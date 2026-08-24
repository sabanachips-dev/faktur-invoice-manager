import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z } from "zod";
import { queryPath, supabaseRest, supabaseRpc } from "./supabase-rest";
import { DASHBOARD_PERIODS, getDashboardPeriodRange, isDateWithinRange } from "../shared/dashboard";
import { FULFILLMENT_STATUSES, getNextAvailableInvoiceNumber, INVOICE_STATUSES } from "../shared/invoice";
import { parseInvoiceImportRows } from "../shared/invoiceImport";

export type WorkerEnv = { SUPABASE_URL: string; SUPABASE_PUBLISHABLE_KEY: string; RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string };
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
  discountType: z.enum(["none", "amount", "percentage"]).default("none"),
  discountValue: z.number().int().min(0).default(0),
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
const logoInput = z.object({ dataUrl: z.string().max(2_100_000) });
const invoiceInput = z.object({
  clientId: z.number().int().positive(),
  invoiceNumber: z.string().trim().max(80).optional(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  status: z.enum(INVOICE_STATUSES),
  currency: z.string().trim().length(3),
  discountType: z.enum(["amount", "percentage"]),
  discountValue: z.number().int().min(0),
  taxRate: z.number().int().min(0).max(100),
  notes: nullableString,
  storeNumber: z.string().trim().max(100).optional().nullable(),
  shippingAddress: nullableString,
  items: z.array(z.object({ catalogItemId: z.number().int().positive().optional().nullable(), description: z.string().trim().min(1).max(500), quantity: z.number().int().min(1).max(100000), unitPrice: z.number().int().min(0), discountType: z.enum(["none", "amount", "percentage"]).default("none"), discountValue: z.number().int().min(0).default(0) })),
}).superRefine((value, context) => {
  if (value.discountType === "percentage" && value.discountValue > 100) context.addIssue({ code: "custom", path: ["discountValue"], message: "Diskon persentase maksimal 100%." });
  value.items.forEach((item, index) => {
    if (item.discountType === "percentage" && item.discountValue > 100) context.addIssue({ code: "custom", path: ["items", index, "discountValue"], message: "Diskon item persentase maksimal 100%." });
    if (item.discountType === "amount" && item.discountValue > item.unitPrice) context.addIssue({ code: "custom", path: ["items", index, "discountValue"], message: "Potongan item per unit tidak boleh melebihi harga satuan." });
  });
});
const bulkInvoiceInput = z.object({
  sourceInvoiceId: z.number().int().positive(),
  storeNumbers: z.array(z.string().trim().min(1).max(100)).min(1).max(100).refine(values => new Set(values).size === values.length, "Nomor toko tidak boleh duplikat."),
  shippingAddress: z.string().trim().min(1).max(1000),
  invoiceDate: z.date(),
  dueDate: z.date(),
});
const importRowsInput = z.object({ rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))).min(1).max(1000) });

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

async function getInvoiceDetail(ctx: WorkerContext, invoiceId: number) {
  const rows = await listInvoiceRows(ctx);
  const row = rows.find(candidate => candidate.invoice.id === invoiceId);
  if (!row) return null;
  const business = await getBusinessProfile(ctx);
  const items = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("invoiceItems", { select: "*", invoiceId: `eq.${invoiceId}`, order: "position.asc" }));
  return { ...row, business, items };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

export const workerRouter = t.router({
  auth: t.router({
    me: t.procedure.query(({ ctx }) => ctx.user),
    session: protectedProcedure.query(({ ctx }) => ({ id: ctx.user.id, email: ctx.user.email, name: ctx.user.name })),
  }),
  dashboard: t.router({
    get: protectedProcedure.input(z.object({ period: z.enum(DASHBOARD_PERIODS).default("this_month") })).query(({ ctx, input }) => getDashboard(ctx, input.period)),
  }),
  invoices: t.router({
    list: protectedProcedure.input(z.object({
      status: z.enum(INVOICE_STATUSES).optional(), clientId: z.number().int().positive().optional(), search: z.string().optional(), from: z.date().optional(), to: z.date().optional(),
    })).query(async ({ ctx, input }) => {
      const search = input.search?.trim().toLocaleLowerCase();
      const rows = await listInvoiceRows(ctx);
      return rows.filter(row => {
        const invoiceDate = new Date(row.invoice.invoiceDate);
        const invoiceNumber = String(row.invoice.invoiceNumber || "").toLocaleLowerCase();
        const clientName = String(row.client?.name || "").toLocaleLowerCase();
        return (!input.status || row.invoice.status === input.status)
          && (!input.clientId || Number(row.invoice.clientId) === input.clientId)
          && (!input.from || invoiceDate >= input.from)
          && (!input.to || invoiceDate <= input.to)
          && (!search || invoiceNumber.includes(search) || clientName.includes(search));
      });
    }),
    nextNumber: protectedProcedure.query(async ({ ctx }) => {
      const [profile, rows] = await Promise.all([
        getBusinessProfile(ctx),
        supabaseRest<{ invoiceNumber: string }[]>(ctx, queryPath("invoices", { select: "invoiceNumber" })),
      ]);
      return getNextAvailableInvoiceNumber(rows.map(row => row.invoiceNumber), new Date().getFullYear(), String(profile?.invoiceNumberFormat || "INV-{YYYY}-{SEQ}"));
    }),
    create: protectedProcedure.input(invoiceInput).mutation(async ({ ctx, input }) => {
      const invoiceNumber = input.invoiceNumber?.trim() || await workerRouter.createCaller(ctx).invoices.nextNumber();
      const invoiceId = await supabaseRpc<number>(ctx, "create_invoice_atomic", {
        p_client_id: input.clientId, p_invoice_number: invoiceNumber, p_invoice_date: input.invoiceDate.toISOString(), p_due_date: input.dueDate.toISOString(), p_status: input.status,
        p_currency: input.currency, p_discount_type: input.discountType, p_discount_value: input.discountValue, p_tax_rate: input.taxRate,
        p_notes: input.notes || null, p_store_number: input.storeNumber || null, p_shipping_address: input.shippingAddress || null, p_items: input.items,
      });
      return invoiceId;
    }),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: invoiceInput })).mutation(async ({ ctx, input }) => {
      const invoiceNumber = input.data.invoiceNumber?.trim() || await workerRouter.createCaller(ctx).invoices.nextNumber();
      return supabaseRpc<number>(ctx, "update_invoice_atomic", {
        p_invoice_id: input.id, p_client_id: input.data.clientId, p_invoice_number: invoiceNumber, p_invoice_date: input.data.invoiceDate.toISOString(), p_due_date: input.data.dueDate.toISOString(), p_status: input.data.status,
        p_currency: input.data.currency, p_discount_type: input.data.discountType, p_discount_value: input.data.discountValue, p_tax_rate: input.data.taxRate,
        p_notes: input.data.notes || null, p_store_number: input.data.storeNumber || null, p_shipping_address: input.data.shippingAddress || null, p_items: input.data.items,
      });
    }),
    bulkCreate: protectedProcedure.input(bulkInvoiceInput).mutation(({ ctx, input }) => supabaseRpc<{ batchId: string; storeInvoiceIds: number[]; summaryInvoiceId: number }>(ctx, "create_bulk_invoices_atomic", {
      p_source_invoice_id: input.sourceInvoiceId, p_store_numbers: input.storeNumbers, p_shipping_address: input.shippingAddress,
      p_invoice_date: input.invoiceDate.toISOString(), p_due_date: input.dueDate.toISOString(),
    })),
    importFromSheet: protectedProcedure.input(importRowsInput).mutation(async ({ ctx, input }) => {
      const parsed = parseInvoiceImportRows(input.rows);
      if (parsed.errors.length) throw new TRPCError({ code: "BAD_REQUEST", message: parsed.errors.join(" ") });
      const invoiceIds = await supabaseRpc<number[]>(ctx, "import_invoices_atomic", { p_invoices: parsed.invoices });
      return { invoiceIds, createdCount: invoiceIds.length };
    }),
    duplicate: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const existing = await getInvoiceDetail(ctx, input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice tidak ditemukan." });
      const invoice = existing.invoice as Record<string, unknown>;
      const invoiceNumber = await workerRouter.createCaller(ctx).invoices.nextNumber();
      return supabaseRpc<number>(ctx, "create_invoice_atomic", {
        p_client_id: Number(invoice.clientId), p_invoice_number: invoiceNumber, p_invoice_date: new Date().toISOString(), p_due_date: String(invoice.dueDate), p_status: "draft",
        p_currency: String(invoice.currency), p_discount_type: String(invoice.discountType), p_discount_value: Number(invoice.discountValue), p_tax_rate: Number(invoice.taxRate),
        p_notes: invoice.notes || null, p_store_number: invoice.storeNumber || null, p_shipping_address: invoice.shippingAddress || null,
        p_items: existing.items.map(item => ({ catalogItemId: item.catalogItemId || null, description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, discountType: item.discountType || "none", discountValue: Number(item.discountValue || 0) })),
      });
    }),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => getInvoiceDetail(ctx, input.id)),
    getMany: protectedProcedure.input(z.object({ ids: z.array(z.number().int().positive()).min(1).max(100) })).query(async ({ ctx, input }) => {
      const details = await Promise.all([...new Set(input.ids)].map(id => getInvoiceDetail(ctx, id)));
      return details.filter((detail): detail is NonNullable<typeof detail> => Boolean(detail));
    }),
    history: protectedProcedure.input(z.object({ id: z.number().int().positive().optional() })).query(async ({ ctx, input }) => {
      const rows = await supabaseRest<(Record<string, unknown> & { invoice: { invoiceNumber?: string } | null })[]>(ctx, queryPath("invoiceActivities", {
        select: "*,invoice:invoices(invoiceNumber)", order: "createdAt.desc", limit: "100", invoiceId: input.id ? `eq.${input.id}` : undefined,
      }));
      return rows.map(({ invoice, ...activity }) => ({ activity, invoiceNumber: invoice?.invoiceNumber || null }));
    }),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(INVOICE_STATUSES) })).mutation(async ({ ctx, input }) => {
      const now = new Date().toISOString();
      const rows = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("invoices", { id: `eq.${input.id}` }), {
        method: "PATCH", headers: { Prefer: "return=representation" },
        body: JSON.stringify({ status: input.status, paidAt: input.status === "paid" ? now : null, sentAt: input.status === "sent" ? now : null }),
      });
      if (!rows[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice tidak ditemukan." });
      await postgrestInsert(ctx, "invoiceActivities", { userId: ctx.user.id, invoiceId: input.id, action: "status_changed", description: `Status invoice diubah menjadi ${input.status}.` });
      return rows[0];
    }),
    updateFulfillment: protectedProcedure.input(z.object({ id: z.number().int().positive(), fulfillmentStatus: z.enum(FULFILLMENT_STATUSES), courierName: z.string().trim().max(100).optional().nullable(), trackingNumber: z.string().trim().max(120).optional().nullable() }).superRefine((value, context) => {
      if (["shipped", "completed"].includes(value.fulfillmentStatus) && (!value.courierName || !value.trackingNumber)) context.addIssue({ code: "custom", path: ["trackingNumber"], message: "Kurir dan nomor resi wajib diisi untuk pesanan yang dikirim atau selesai." });
    })).mutation(({ ctx, input }) => supabaseRpc<number>(ctx, "update_invoice_fulfillment", { p_invoice_id: input.id, p_fulfillment_status: input.fulfillmentStatus, p_courier_name: input.courierName || null, p_tracking_number: input.trackingNumber || null })),
    sendEmail: protectedProcedure.input(z.object({ id: z.number().int().positive(), origin: z.string().url() })).mutation(async ({ ctx, input }) => {
      const document = await getInvoiceDetail(ctx, input.id);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice tidak ditemukan." });
      const invoice = document.invoice as Record<string, unknown>;
      const client = document.client as Record<string, unknown>;
      const business = document.business as Record<string, unknown>;
      const email = String(client.email || "");
      if (!email) throw new TRPCError({ code: "BAD_REQUEST", message: "Klien belum memiliki alamat email." });
      if (!ctx.env.RESEND_API_KEY || !ctx.env.RESEND_FROM_EMAIL) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Layanan email belum dikonfigurasi." });
      const publicLink = `${input.origin.replace(/\/$/, "")}/p/${String(invoice.publicId)}`;
      const subject = `Invoice ${String(invoice.invoiceNumber)} dari ${String(business.businessName)}`;
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${ctx.env.RESEND_API_KEY}`, "content-type": "application/json" }, body: JSON.stringify({ from: ctx.env.RESEND_FROM_EMAIL, to: [email], subject, html: `<main style="font-family:Arial,sans-serif;color:#18233a;max-width:560px;margin:0 auto;padding:28px"><h1 style="font-size:24px">Invoice ${escapeHtml(String(invoice.invoiceNumber))}</h1><p>Halo ${escapeHtml(String(client.name))},</p><p>${escapeHtml(String(business.businessName))} telah mengirimkan invoice. <a href="${escapeHtml(publicLink)}">Lihat invoice</a></p></main>` }) });
      if (!response.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Email tidak dapat dikirim." });
      await workerRouter.createCaller(ctx).invoices.updateStatus({ id: input.id, status: "sent" });
      await postgrestInsert(ctx, "invoiceActivities", { userId: ctx.user.id, invoiceId: input.id, action: "email_sent", description: "Invoice dikirim melalui email kepada klien." });
      return { success: true } as const;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const existing = await getInvoiceDetail(ctx, input.id);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice tidak ditemukan atau sudah dihapus." });
      await supabaseRest<void>(ctx, queryPath("invoices", { id: `eq.${input.id}` }), { method: "DELETE" });
      return { deletedId: input.id };
    }),
  }),
  publicInvoice: t.router({
    get: t.procedure.input(z.object({ publicId: z.string().regex(/^[A-Za-z0-9]{8,32}$/, "Tautan invoice tidak valid.") })).query(({ ctx, input }) => {
      const anonymousContext: WorkerContext = { ...ctx, accessToken: `Bearer ${ctx.env.SUPABASE_PUBLISHABLE_KEY}` };
      return supabaseRpc<Record<string, unknown> | null>(anonymousContext, "get_public_invoice", { p_public_id: input.publicId });
    }),
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
    uploadLogo: protectedProcedure.input(logoInput).mutation(async ({ ctx, input }) => {
      const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) throw new TRPCError({ code: "BAD_REQUEST", message: "Gunakan format PNG, JPG, atau WEBP." });
      const mimeType = match[1];
      const binary = atob(match[2]);
      if (binary.length > 1_500_000) throw new TRPCError({ code: "BAD_REQUEST", message: "Ukuran logo maksimal 1,5 MB." });
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      const extension = mimeType === "image/jpeg" ? "jpg" : mimeType.slice("image/".length);
      const objectPath = `${ctx.user.authUserId}/logo.${extension}`;
      const upload = await fetch(`${ctx.env.SUPABASE_URL}/storage/v1/object/business-logos/${objectPath}`, {
        method: "POST",
        headers: { apikey: ctx.env.SUPABASE_PUBLISHABLE_KEY, authorization: ctx.accessToken!, "content-type": mimeType, "x-upsert": "true" },
        body: bytes,
      });
      if (!upload.ok) throw new TRPCError({ code: "BAD_REQUEST", message: "Logo bisnis tidak dapat diunggah." });
      const logoUrl = `${ctx.env.SUPABASE_URL}/storage/v1/object/public/business-logos/${objectPath}`;
      const rows = await supabaseRest<Record<string, unknown>[]>(ctx, queryPath("businessProfiles", { userId: `eq.${ctx.user.id}` }), {
        method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ logoUrl }),
      });
      return rows[0] ?? { logoUrl };
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
