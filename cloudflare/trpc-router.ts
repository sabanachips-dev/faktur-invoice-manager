import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { queryPath, supabaseRest } from "./supabase-rest";
import { DASHBOARD_PERIODS, getDashboardPeriodRange, isDateWithinRange } from "../shared/dashboard";

export type WorkerEnv = { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string };
export type WorkerUser = { id: number; authUserId: string; openId: string; name: string | null; email: string | null; role: "admin" | "user" };
export type WorkerContext = { user: WorkerUser | null; env: WorkerEnv; accessToken: string | null };

async function getUser(request: Request, env: WorkerEnv): Promise<WorkerUser | null> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const baseHeaders = { apikey: env.SUPABASE_PUBLISHABLE_KEY, authorization };
  const authResponse = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, { headers: baseHeaders });
  if (!authResponse.ok) return null;
  const authUser = await authResponse.json<{ id: string }>();
  const profileResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/users?authUserId=eq.${encodeURIComponent(authUser.id)}&select=id,authUserId,openId,name,email,role&limit=1`, { headers: baseHeaders });
  if (!profileResponse.ok) return null;
  const [profile] = await profileResponse.json<WorkerUser[]>();
  return profile ?? null;
}

const t = initTRPC.context<WorkerContext>().create({ transformer: superjson });
const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});

const nullableString = z.string().trim().max(1000).optional().nullable();
const clientInput = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: nullableString,
  phone: nullableString,
  taxId: nullableString,
});
const catalogInput = z.object({
  name: z.string().trim().min(1).max(255),
  description: nullableString,
  defaultPrice: z.number().int().min(0),
});
const businessInput = z.object({
  businessName: z.string().trim().min(1).max(255),
  address: nullableString,
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: nullableString,
  bankName: nullableString,
  bankAccountName: nullableString,
  bankAccountNumber: nullableString,
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  invoiceTemplate: z.enum(["clean", "modern", "classic"]),
  invoiceNumberFormat: z.string().trim().min(1).max(80),
  defaultTaxRate: z.number().int().min(0).max(100),
  defaultCurrency: z.string().trim().length(3),
});

async function getBusinessProfile(ctx: WorkerContext) {
  const rows = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("businessProfiles", {
    select: "*", userId: `eq.${ctx.user!.id}`, limit: "1",
  }));
  if (rows[0]) return rows[0];
  const created = await supabaseRest<Record<string, unknown>[]>(ctx, "businessProfiles", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ userId: ctx.user!.id, businessName: "Bisnis Anda" }),
  });
  return created[0] ?? null;
}

function postgrestInsert(ctx: WorkerContext, table: string, body: unknown) {
  return supabaseRest<Record<string, unknown>[]>(ctx, table, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
}

type InvoiceRow = Record<string, unknown> & {
  id: number;
  invoiceDate: string;
  total: number;
  status: string;
  isBatchSummary: boolean;
  bulkBatchId: string | null;
};

async function listInvoiceRows(ctx: WorkerContext) {
  const rows = await supabaseRest<(InvoiceRow & { client: Record<string, unknown> | null })[]>(ctx, queryPath("invoices", {
    select: "*,client:clients(*)", order: "createdAt.desc",
  }));
  return rows.map(({ client, ...invoice }) => ({ invoice, client }));
}

async function getDashboard(ctx: WorkerContext, period: (typeof DASHBOARD_PERIODS)[number]) {
  const all = await listInvoiceRows(ctx);
  const range = getDashboardPeriodRange(period);
  const rows = all.map(row => row.invoice).filter(invoice => !invoice.isBatchSummary);
  const filteredRows = rows.filter(invoice => isDateWithinRange(new Date(invoice.invoiceDate), range.start, range.end));
  const sum = (items: InvoiceRow[]) => items.reduce((total, invoice) => total + Number(invoice.total || 0), 0);
  const income = period === "this_year"
    ? Array.from({ length: 12 }, (_, index) => {
      const date = new Date(range.start.getFullYear(), index, 1);
      const value = filteredRows.filter(invoice => invoice.status === "paid" && new Date(invoice.invoiceDate).getMonth() === index).reduce((total, invoice) => total + Number(invoice.total || 0), 0);
      return { label: date.toLocaleString("id-ID", { month: "short" }), value };
    })
    : Array.from({ length: Math.ceil((range.end.getTime() - range.start.getTime()) / 86_400_000) }, (_, index) => {
      const date = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate() + index);
      const nextDate = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate() + index + 1);
      const value = filteredRows.filter(invoice => invoice.status === "paid" && isDateWithinRange(new Date(invoice.invoiceDate), date, nextDate)).reduce((total, invoice) => total + Number(invoice.total || 0), 0);
      return { label: String(date.getDate()), value };
    });
  const summaryRows = all.filter(row => row.invoice.isBatchSummary && isDateWithinRange(new Date(row.invoice.invoiceDate), range.start, range.end)).slice(0, 3);
  const batchRecaps = await Promise.all(summaryRows.map(async row => {
    const items = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("invoiceItems", { select: "*", invoiceId: `eq.${row.invoice.id}`, order: "position.asc" }));
    const storeCount = all.filter(candidate => candidate.invoice.bulkBatchId === row.invoice.bulkBatchId && !candidate.invoice.isBatchSummary).length;
    return { invoice: row.invoice, client: row.client, storeCount, items };
  }));
  return {
    period,
    periodLabel: range.label,
    metrics: {
      monthTotal: sum(filteredRows), monthCount: filteredRows.length,
      unpaidTotal: sum(filteredRows.filter(invoice => invoice.status === "unpaid" || invoice.status === "sent")),
      unpaidCount: filteredRows.filter(invoice => invoice.status === "unpaid" || invoice.status === "sent").length,
      paidTotal: sum(filteredRows.filter(invoice => invoice.status === "paid")), paidCount: filteredRows.filter(invoice => invoice.status === "paid").length,
      overdueTotal: sum(filteredRows.filter(invoice => invoice.status === "overdue")), overdueCount: filteredRows.filter(invoice => invoice.status === "overdue").length,
    },
    income,
    recent: all.filter(row => !row.invoice.isBatchSummary && isDateWithinRange(new Date(row.invoice.invoiceDate), range.start, range.end)).slice(0, 5),
    batchRecaps,
  };
}

export const workerRouter = t.router({
  auth: t.router({
    me: t.procedure.query(({ ctx }) => ctx.user),
    session: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id, email: ctx.user.email, name: ctx.user.name })),
  }),
  dashboard: t.router({
    get: protectedProcedure.input(z.object({ period: z.enum(DASHBOARD_PERIODS).default("this_month") })).query(({ ctx, input }) => getDashboard(ctx, input.period)),
  }),
  business: t.router({
    get: protectedProcedure.query(({ ctx }) => getBusinessProfile(ctx)),
    update: protectedProcedure.input(businessInput).mutation(async ({ ctx, input }) => {
      await getBusinessProfile(ctx);
      const rows = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("businessProfiles", { userId: `eq.${ctx.user.id}` }), {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...input, email: input.email || null }),
      });
      return rows[0] ?? getBusinessProfile(ctx);
    }),
  }),
  clients: t.router({
    list: protectedProcedure.input(z.object({ query: z.string().optional() })).query(({ ctx, input }) => {
      const term = input.query?.trim();
      return supabaseRest<Record<string, unknown>[]>(ctx, queryPath("clients", {
        select: "*", order: "createdAt.desc", or: term ? `(name.ilike.*${term}*,email.ilike.*${term}*)` : undefined,
      }));
    }),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const clients = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("clients", { select: "*", id: `eq.${input.id}`, limit: "1" }));
      return clients[0] ? { ...clients[0], invoices: [] } : null;
    }),
    create: protectedProcedure.input(clientInput).mutation(async ({ ctx, input }) => {
      const rows = await postgrestInsert(ctx, "clients", { ...input, email: input.email || null, userId: ctx.user.id });
      return rows[0] ?? null;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: clientInput.partial() })).mutation(async ({ ctx, input }) => {
      const rows = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("clients", { id: `eq.${input.id}` }), {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ...input.data, email: input.data.email || null }),
      });
      return rows[0] ?? null;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const linked = await supabaseRest<{ id: number }[]>(ctx, queryPath("invoices", { select: "id", clientId: `eq.${input.id}`, limit: "1" }));
      if (linked.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Klien tidak dapat dihapus karena masih memiliki invoice." });
      await supabaseRest<void>(ctx, queryPath("clients", { id: `eq.${input.id}` }), { method: "DELETE" });
      return { success: true };
    }),
  }),
  catalog: t.router({
    list: protectedProcedure.input(z.object({ query: z.string().optional() })).query(({ ctx, input }) => {
      const term = input.query?.trim();
      return supabaseRest<Record<string, unknown>[]>(ctx, queryPath("catalogItems", { select: "*", order: "createdAt.desc", name: term ? `ilike.*${term}*` : undefined }));
    }),
    create: protectedProcedure.input(catalogInput).mutation(async ({ ctx, input }) => {
      const rows = await postgrestInsert(ctx, "catalogItems", { ...input, userId: ctx.user.id });
      return rows[0]?.id ?? null;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: catalogInput.partial() })).mutation(async ({ ctx, input }) => {
      const rows = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("catalogItems", { id: `eq.${input.id}` }), {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(input.data),
      });
      return rows[0] ?? null;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await supabaseRest<void>(ctx, queryPath("catalogItems", { id: `eq.${input.id}` }), { method: "DELETE" });
      return { success: true };
    }),
  }),
});

export type WorkerRouter = typeof workerRouter;

export function handleTrpcRequest(request: Request, env: WorkerEnv) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: workerRouter,
    createContext: async () => ({ env, accessToken: request.headers.get("authorization"), user: await getUser(request, env) }),
    onError({ error }) { console.error("[Worker tRPC]", error.code, error.message); },
  });
}
