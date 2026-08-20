import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  businessProfiles,
  catalogItems,
  clients,
  InsertUser,
  invoiceItems,
  invoices,
  users,
} from "../drizzle/schema";
import { calculateInvoiceAmounts, formatInvoiceNumber, type InvoiceStatus } from "../shared/invoice";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: new Date() };
  (["name", "email", "loginMethod"] as const).forEach(field => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getBusinessProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1);
  if (result[0]) return result[0];

  await db.insert(businessProfiles).values({ userId, businessName: "Bisnis Anda" });
  const created = await db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1);
  return created[0]!;
}

export async function updateBusinessProfile(
  userId: number,
  data: Partial<Omit<typeof businessProfiles.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>,
) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await getBusinessProfile(userId);
  await db.update(businessProfiles).set(data).where(eq(businessProfiles.userId, userId));
  return getBusinessProfile(userId);
}

export async function listClients(userId: number, query?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const condition = query
    ? and(eq(clients.userId, userId), or(like(clients.name, `%${query}%`), like(clients.email, `%${query}%`)))
    : eq(clients.userId, userId);
  return db.select().from(clients).where(condition).orderBy(desc(clients.createdAt));
}

export async function getClient(userId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const client = await db.select().from(clients).where(and(eq(clients.userId, userId), eq(clients.id, clientId))).limit(1);
  if (!client[0]) return undefined;
  const history = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.userId, userId), eq(invoices.clientId, clientId)))
    .orderBy(desc(invoices.createdAt));
  return { ...client[0], invoices: history };
}

export async function createClient(userId: number, data: Omit<typeof clients.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(clients).values({ ...data, userId });
  return Number(result[0].insertId);
}

export async function updateClient(userId: number, clientId: number, data: Partial<Omit<typeof clients.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(clients).set(data).where(and(eq(clients.userId, userId), eq(clients.id, clientId)));
}

export async function deleteClient(userId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const linked = await db.select({ id: invoices.id }).from(invoices).where(and(eq(invoices.userId, userId), eq(invoices.clientId, clientId))).limit(1);
  if (linked.length) throw new Error("Klien tidak dapat dihapus karena masih memiliki invoice.");
  await db.delete(clients).where(and(eq(clients.userId, userId), eq(clients.id, clientId)));
}

export async function listCatalogItems(userId: number, query?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const condition = query
    ? and(eq(catalogItems.userId, userId), like(catalogItems.name, `%${query}%`))
    : eq(catalogItems.userId, userId);
  return db.select().from(catalogItems).where(condition).orderBy(desc(catalogItems.createdAt));
}

export async function createCatalogItem(userId: number, data: Omit<typeof catalogItems.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db.insert(catalogItems).values({ ...data, userId });
  return Number(result[0].insertId);
}

export async function updateCatalogItem(userId: number, itemId: number, data: Partial<Omit<typeof catalogItems.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.update(catalogItems).set(data).where(and(eq(catalogItems.userId, userId), eq(catalogItems.id, itemId)));
}

export async function deleteCatalogItem(userId: number, itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(catalogItems).where(and(eq(catalogItems.userId, userId), eq(catalogItems.id, itemId)));
}

export type InvoiceFilters = { status?: InvoiceStatus; clientId?: number; search?: string; from?: Date; to?: Date };

export async function listInvoices(userId: number, filters: InvoiceFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const conditions = [eq(invoices.userId, userId)];
  if (filters.status) conditions.push(eq(invoices.status, filters.status));
  if (filters.clientId) conditions.push(eq(invoices.clientId, filters.clientId));
  if (filters.from) conditions.push(gte(invoices.invoiceDate, filters.from));
  if (filters.to) conditions.push(lte(invoices.invoiceDate, filters.to));
  if (filters.search) {
    conditions.push(or(like(invoices.invoiceNumber, `%${filters.search}%`), like(clients.name, `%${filters.search}%`))!);
  }
  return db
    .select({ invoice: invoices, client: clients })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.createdAt));
}

export async function getNextInvoiceNumber(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const year = new Date().getFullYear();
  const profile = await getBusinessProfile(userId);
  const existing = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.userId, userId));
  const usedNumbers = new Set(existing.map(invoice => invoice.invoiceNumber));
  let sequence = Math.max(1, existing.length + 1);
  let nextNumber = formatInvoiceNumber(year, sequence, profile.invoiceNumberFormat);
  while (usedNumbers.has(nextNumber)) {
    sequence += 1;
    nextNumber = formatInvoiceNumber(year, sequence, profile.invoiceNumberFormat);
  }
  return nextNumber;
}

export type InvoiceWriteInput = {
  clientId: number;
  invoiceNumber?: string;
  invoiceDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  currency: string;
  discount: number;
  taxRate: number;
  notes?: string | null;
  items: { catalogItemId?: number | null; description: string; quantity: number; unitPrice: number }[];
};

async function assertOwnedClient(userId: number, clientId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const client = await db.select({ id: clients.id }).from(clients).where(and(eq(clients.id, clientId), eq(clients.userId, userId))).limit(1);
  if (!client[0]) throw new Error("Klien tidak ditemukan.");
}

function invoiceValues(input: InvoiceWriteInput) {
  const amounts = calculateInvoiceAmounts(input.items, input.discount, input.taxRate);
  return {
    ...amounts,
    taxRate: Math.max(0, Math.round(input.taxRate)),
    currency: input.currency.toUpperCase().slice(0, 3),
    notes: input.notes || null,
  };
}

export async function createInvoice(userId: number, input: InvoiceWriteInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await assertOwnedClient(userId, input.clientId);
  const invoiceNumber = input.invoiceNumber?.trim() || (await getNextInvoiceNumber(userId));
  const values = invoiceValues(input);
  const publicId = crypto.randomUUID().replaceAll("-", "").slice(0, 16);
  const result = await db.insert(invoices).values({
    userId,
    clientId: input.clientId,
    invoiceNumber,
    invoiceDate: input.invoiceDate,
    dueDate: input.dueDate,
    status: input.status,
    publicId,
    sentAt: input.status === "sent" ? new Date() : null,
    ...values,
  });
  const invoiceId = Number(result[0].insertId);
  if (input.items.length) {
    await db.insert(invoiceItems).values(
      input.items.map((item, position) => ({
        invoiceId,
        catalogItemId: item.catalogItemId || null,
        description: item.description,
        quantity: Math.max(1, Math.round(item.quantity)),
        unitPrice: Math.max(0, Math.round(item.unitPrice)),
        subtotal: Math.max(1, Math.round(item.quantity)) * Math.max(0, Math.round(item.unitPrice)),
        position,
      })),
    );
  }
  return invoiceId;
}

export async function getInvoice(userId: number, invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db
    .select({ invoice: invoices, client: clients, business: businessProfiles })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .innerJoin(businessProfiles, eq(invoices.userId, businessProfiles.userId))
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)))
    .limit(1);
  if (!result[0]) return undefined;
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId)).orderBy(invoiceItems.position);
  return { ...result[0], items };
}

export async function getPublicInvoice(publicId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const result = await db
    .select({ invoice: invoices, client: clients, business: businessProfiles })
    .from(invoices)
    .innerJoin(clients, eq(invoices.clientId, clients.id))
    .innerJoin(businessProfiles, eq(invoices.userId, businessProfiles.userId))
    .where(eq(invoices.publicId, publicId))
    .limit(1);
  if (!result[0]) return undefined;
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, result[0].invoice.id)).orderBy(invoiceItems.position);
  return { ...result[0], items };
}

export async function updateInvoice(userId: number, invoiceId: number, input: InvoiceWriteInput) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await assertOwnedClient(userId, input.clientId);
  const values = invoiceValues(input);
  await db
    .update(invoices)
    .set({
      clientId: input.clientId,
      invoiceNumber: input.invoiceNumber?.trim() || (await getNextInvoiceNumber(userId)),
      invoiceDate: input.invoiceDate,
      dueDate: input.dueDate,
      status: input.status,
      sentAt: input.status === "sent" ? new Date() : null,
      paidAt: input.status === "paid" ? new Date() : null,
      ...values,
    })
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)));
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  if (input.items.length) {
    await db.insert(invoiceItems).values(
      input.items.map((item, position) => ({
        invoiceId,
        catalogItemId: item.catalogItemId || null,
        description: item.description,
        quantity: Math.max(1, Math.round(item.quantity)),
        unitPrice: Math.max(0, Math.round(item.unitPrice)),
        subtotal: Math.max(1, Math.round(item.quantity)) * Math.max(0, Math.round(item.unitPrice)),
        position,
      })),
    );
  }
}

export async function updateInvoiceStatus(userId: number, invoiceId: number, status: InvoiceStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db
    .update(invoices)
    .set({ status, paidAt: status === "paid" ? new Date() : null, sentAt: status === "sent" ? new Date() : null })
    .where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)));
}

export async function deleteInvoice(userId: number, invoiceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  await db.delete(invoices).where(and(eq(invoices.userId, userId), eq(invoices.id, invoiceId)));
}

export async function duplicateInvoice(userId: number, invoiceId: number) {
  const existing = await getInvoice(userId, invoiceId);
  if (!existing) throw new Error("Invoice tidak ditemukan.");
  return createInvoice(userId, {
    clientId: existing.invoice.clientId,
    invoiceDate: new Date(),
    dueDate: existing.invoice.dueDate,
    status: "draft",
    currency: existing.invoice.currency,
    discount: existing.invoice.discount,
    taxRate: existing.invoice.taxRate,
    notes: existing.invoice.notes,
    items: existing.items.map(item => ({
      catalogItemId: item.catalogItemId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  });
}

export async function getDashboard(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  const all = await listInvoices(userId);
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const rows = all.map(row => row.invoice);
  const currentMonth = rows.filter(invoice => invoice.invoiceDate >= firstOfMonth);
  const sum = (items: typeof rows) => items.reduce((total, invoice) => total + invoice.total, 0);
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const value = rows
      .filter(invoice => invoice.status === "paid" && invoice.invoiceDate.getFullYear() === date.getFullYear() && invoice.invoiceDate.getMonth() === date.getMonth())
      .reduce((total, invoice) => total + invoice.total, 0);
    return { label: date.toLocaleString("id-ID", { month: "short" }), value };
  });
  return {
    metrics: {
      monthTotal: sum(currentMonth),
      monthCount: currentMonth.length,
      unpaidTotal: sum(rows.filter(invoice => invoice.status === "unpaid" || invoice.status === "sent")),
      unpaidCount: rows.filter(invoice => invoice.status === "unpaid" || invoice.status === "sent").length,
      paidTotal: sum(rows.filter(invoice => invoice.status === "paid")),
      paidCount: rows.filter(invoice => invoice.status === "paid").length,
      overdueTotal: sum(rows.filter(invoice => invoice.status === "overdue")),
      overdueCount: rows.filter(invoice => invoice.status === "overdue").length,
    },
    income: months,
    recent: all.slice(0, 5),
  };
}
