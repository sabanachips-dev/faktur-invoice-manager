import { and, eq, inArray } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { clients, invoiceActivities, invoiceItems, invoices } from "../drizzle/schema";
import * as db from "./db";

const userId = 1;
const marker = `History E2E ${Date.now()}`;
let clientId: number | undefined;
let invoiceId: number | undefined;
let invoiceIds: number[] = [];

afterEach(async () => {
  const database = await db.getDb();
  if (!database) return;
  if (invoiceIds.length) {
    await database.delete(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds));
    await database.delete(invoices).where(inArray(invoices.id, invoiceIds));
    await database.delete(invoiceActivities).where(and(eq(invoiceActivities.userId, userId), inArray(invoiceActivities.invoiceId, invoiceIds)));
  }
  if (clientId) await database.delete(clients).where(and(eq(clients.userId, userId), eq(clients.id, clientId)));
  invoiceId = undefined; invoiceIds = []; clientId = undefined;
});

describe("invoice activity history", () => {
  it("records creation, status change, and deletion while retaining the deleted invoice event", async () => {
    const client = await db.createClient(userId, { name: marker, email: `${Date.now()}@example.com`, phone: null, address: null, taxId: null });
    clientId = client.id;
    invoiceId = await db.createInvoice(userId, {
      clientId: client.id, invoiceDate: new Date("2026-08-20"), dueDate: new Date("2026-09-03"), status: "draft", currency: "IDR", discountType: "amount", discountValue: 0, taxRate: 11, notes: null,
      items: [{ description: "Produk riwayat", quantity: 1, unitPrice: 100000 }],
    });
    invoiceIds = [invoiceId];
    await db.updateInvoiceStatus(userId, invoiceId, "paid");
    let activityRows = await db.listInvoiceActivities(userId, invoiceId);
    expect(activityRows.map(row => row.activity.action)).toEqual(expect.arrayContaining(["created", "status_changed"]));
    await db.deleteInvoice(userId, invoiceId);
    activityRows = await db.listInvoiceActivities(userId, invoiceId);
    expect(activityRows.map(row => row.activity.action)).toEqual(expect.arrayContaining(["deleted"]));
    expect(activityRows.find(row => row.activity.action === "deleted")?.invoiceNumber).toBeNull();
  }, 30_000);

  it("records editor updates, editor status changes, duplication, and email activity", async () => {
    const client = await db.createClient(userId, { name: `${marker} second`, email: `${Date.now()}-second@example.com`, phone: null, address: null, taxId: null });
    clientId = client.id;
    invoiceId = await db.createInvoice(userId, {
      clientId: client.id, invoiceDate: new Date("2026-08-20"), dueDate: new Date("2026-09-03"), status: "draft", currency: "IDR", discountType: "amount", discountValue: 0, taxRate: 11, notes: null,
      items: [{ description: "Produk update", quantity: 1, unitPrice: 100000 }],
    });
    invoiceIds = [invoiceId];
    const document = await db.getInvoice(userId, invoiceId);
    await db.updateInvoice(userId, invoiceId, {
      clientId: client.id, invoiceNumber: document!.invoice.invoiceNumber, invoiceDate: document!.invoice.invoiceDate, dueDate: document!.invoice.dueDate, status: "sent", currency: "IDR", discountType: "amount", discountValue: 0, taxRate: 11, notes: "Diperbarui",
      storeNumber: null, shippingAddress: null, items: [{ description: "Produk update", quantity: 2, unitPrice: 100000 }],
    });
    const duplicateId = await db.duplicateInvoice(userId, invoiceId);
    invoiceIds.push(duplicateId);
    await db.recordInvoiceActivity(userId, invoiceId, "email_sent", "Invoice dikirim melalui email kepada klien.");
    const originalActivities = await db.listInvoiceActivities(userId, invoiceId);
    const duplicateActivities = await db.listInvoiceActivities(userId, duplicateId);
    expect(originalActivities.map(row => row.activity.action)).toEqual(expect.arrayContaining(["created", "updated", "status_changed", "email_sent"]));
    expect(duplicateActivities.map(row => row.activity.action)).toEqual(expect.arrayContaining(["created", "duplicated"]));
  }, 30_000);
});
