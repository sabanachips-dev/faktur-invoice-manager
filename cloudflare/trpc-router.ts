import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { queryPath, supabaseRest } from "./supabase-rest";

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

export const workerRouter = t.router({
  auth: t.router({
    me: t.procedure.query(({ ctx }) => ctx.user),
    session: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id, email: ctx.user.email, name: ctx.user.name })),
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
