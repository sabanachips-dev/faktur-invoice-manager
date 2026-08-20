import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { INVOICE_STATUSES } from "../shared/invoice";
import { storagePut } from "./storage";
import { sendInvoiceEmail } from "./email";

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
const invoiceInput = z.object({
  clientId: z.number().int().positive(),
  invoiceNumber: z.string().trim().max(80).optional(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  status: z.enum(INVOICE_STATUSES),
  currency: z.string().trim().length(3),
  discount: z.number().int().min(0),
  taxRate: z.number().int().min(0).max(100),
  notes: nullableString,
  items: z.array(z.object({
    catalogItemId: z.number().int().positive().optional().nullable(),
    description: z.string().trim().min(1).max(500),
    quantity: z.number().int().min(1).max(100000),
    unitPrice: z.number().int().min(0),
  })),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    get: protectedProcedure.query(({ ctx }) => db.getDashboard(ctx.user.id)),
  }),
  business: router({
    get: protectedProcedure.query(({ ctx }) => db.getBusinessProfile(ctx.user.id)),
    update: protectedProcedure
      .input(z.object({
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
      }))
      .mutation(({ ctx, input }) => db.updateBusinessProfile(ctx.user.id, { ...input, email: input.email || null })),
    uploadLogo: protectedProcedure
      .input(z.object({ dataUrl: z.string().max(3_000_000) }))
      .mutation(async ({ ctx, input }) => {
        const match = input.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
        if (!match) throw new Error("Format logo harus PNG, JPG, atau WEBP.");
        const buffer = Buffer.from(match[2], "base64");
        if (buffer.length > 1_500_000) throw new Error("Ukuran logo maksimal 1,5 MB.");
        const extension = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
        const { url } = await storagePut(`business/${ctx.user.id}/logo-${Date.now()}.${extension}`, buffer, match[1]);
        return db.updateBusinessProfile(ctx.user.id, { logoUrl: url });
      }),
  }),
  clients: router({
    list: protectedProcedure.input(z.object({ query: z.string().optional() })).query(({ ctx, input }) => db.listClients(ctx.user.id, input.query)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => db.getClient(ctx.user.id, input.id)),
    create: protectedProcedure.input(clientInput).mutation(({ ctx, input }) => db.createClient(ctx.user.id, { ...input, email: input.email || null })),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: clientInput.partial() })).mutation(({ ctx, input }) => db.updateClient(ctx.user.id, input.id, { ...input.data, email: input.data.email || null })),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteClient(ctx.user.id, input.id)),
  }),
  catalog: router({
    list: protectedProcedure.input(z.object({ query: z.string().optional() })).query(({ ctx, input }) => db.listCatalogItems(ctx.user.id, input.query)),
    create: protectedProcedure.input(catalogInput).mutation(({ ctx, input }) => db.createCatalogItem(ctx.user.id, input)),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: catalogInput.partial() })).mutation(({ ctx, input }) => db.updateCatalogItem(ctx.user.id, input.id, input.data)),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteCatalogItem(ctx.user.id, input.id)),
  }),
  invoices: router({
    list: protectedProcedure.input(z.object({ status: z.enum(INVOICE_STATUSES).optional(), clientId: z.number().int().positive().optional(), search: z.string().optional(), from: z.date().optional(), to: z.date().optional() })).query(({ ctx, input }) => db.listInvoices(ctx.user.id, input)),
    nextNumber: protectedProcedure.query(({ ctx }) => db.getNextInvoiceNumber(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(({ ctx, input }) => db.getInvoice(ctx.user.id, input.id)),
    create: protectedProcedure.input(invoiceInput).mutation(({ ctx, input }) => db.createInvoice(ctx.user.id, input)),
    update: protectedProcedure.input(z.object({ id: z.number().int().positive(), data: invoiceInput })).mutation(({ ctx, input }) => db.updateInvoice(ctx.user.id, input.id, input.data)),
    duplicate: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.duplicateInvoice(ctx.user.id, input.id)),
    updateStatus: protectedProcedure.input(z.object({ id: z.number().int().positive(), status: z.enum(INVOICE_STATUSES) })).mutation(({ ctx, input }) => db.updateInvoiceStatus(ctx.user.id, input.id, input.status)),
    sendEmail: protectedProcedure.input(z.object({ id: z.number().int().positive(), origin: z.string().url() })).mutation(async ({ ctx, input }) => {
      const invoice = await db.getInvoice(ctx.user.id, input.id);
      if (!invoice) throw new Error("Invoice tidak ditemukan.");
      await sendInvoiceEmail({ invoice, publicLink: `${input.origin}/p/${invoice.invoice.publicId}` });
      await db.updateInvoiceStatus(ctx.user.id, input.id, "sent");
      return { success: true } as const;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ ctx, input }) => db.deleteInvoice(ctx.user.id, input.id)),
  }),
  publicInvoice: router({
    get: publicProcedure.input(z.object({ publicId: z.string().min(1).max(32) })).query(({ input }) => db.getPublicInvoice(input.publicId)),
  }),
});

export type AppRouter = typeof appRouter;
