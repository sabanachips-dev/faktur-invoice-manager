import { eq, inArray } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { clients, invoiceItems, invoices } from "../drizzle/schema";
import * as db from "./db";

const userId = 1;
const marker = `__bulk_verification_${Date.now()}__`;
let temporaryClientId: number | undefined;
let temporaryInvoiceIds: number[] = [];

afterEach(async () => {
  const database = await db.getDb();
  if (!database) return;
  if (temporaryInvoiceIds.length) {
    await database.delete(invoiceItems).where(inArray(invoiceItems.invoiceId, temporaryInvoiceIds));
    await database.delete(invoices).where(inArray(invoices.id, temporaryInvoiceIds));
  }
  if (temporaryClientId) await database.delete(clients).where(eq(clients.id, temporaryClientId));
  temporaryInvoiceIds = [];
  temporaryClientId = undefined;
});

describe("duplicate and bulk invoice end-to-end", () => {
  it("creates new invoice numbers while copying item, discount, and shipment data", async () => {
    const client = await db.createClient(userId, { name: marker, email: "bulk-verification@example.com", address: null, phone: null, taxId: null });
    temporaryClientId = client.id;
    const sourceId = await db.createInvoice(userId, {
      clientId: client.id,
      invoiceDate: new Date("2026-08-20"), dueDate: new Date("2026-09-03"), status: "draft", currency: "IDR",
      discountType: "percentage", discountValue: 10, taxRate: 11, notes: "Catatan sumber",
      storeNumber: "Toko Sumber", shippingAddress: "Gudang sumber",
      items: [{ description: "Produk yang sama", quantity: 5, unitPrice: 200000 }],
    });
    temporaryInvoiceIds.push(sourceId);
    const source = await db.getInvoice(userId, sourceId);
    expect(source).toBeTruthy();

    const duplicateId = await db.duplicateInvoice(userId, sourceId);
    temporaryInvoiceIds.push(duplicateId);
    const duplicate = await db.getInvoice(userId, duplicateId);
    expect(duplicate?.invoice.invoiceNumber).not.toBe(source?.invoice.invoiceNumber);
    expect(duplicate?.invoice.storeNumber).toBe("Toko Sumber");
    expect(duplicate?.invoice.shippingAddress).toBe("Gudang sumber");
    expect(duplicate?.items).toMatchObject([{ description: "Produk yang sama", quantity: 5, unitPrice: 200000 }]);

    const bulkResult = await db.createBulkInvoices(userId, {
      sourceInvoiceId: sourceId,
      storeNumbers: ["Toko 01", "Toko 02", "Toko 03"],
      shippingAddress: "Gudang bersama, Jakarta",
      invoiceDate: new Date("2026-08-21"),
      dueDate: new Date("2026-09-04"),
    });
    temporaryInvoiceIds.push(...bulkResult.storeInvoiceIds, bulkResult.summaryInvoiceId);
    const bulkDocuments = await db.getInvoicesByIds(userId, bulkResult.storeInvoiceIds);
    expect(bulkDocuments).toHaveLength(3);
    expect(new Set(bulkDocuments.map(document => document.invoice.invoiceNumber)).size).toBe(3);
    expect(bulkDocuments.map(document => document.invoice.storeNumber).sort()).toEqual(["Toko 01", "Toko 02", "Toko 03"]);
    expect(bulkDocuments.every(document => document.invoice.shippingAddress === "Gudang bersama, Jakarta")).toBe(true);
    expect(bulkDocuments.every(document => document.invoice.discountType === "percentage" && document.invoice.discountValue === 10)).toBe(true);
    expect(bulkDocuments.every(document => document.items.length === 1 && document.items[0]?.quantity === 5)).toBe(true);
    const summary = await db.getInvoice(userId, bulkResult.summaryInvoiceId);
    expect(summary?.invoice.isBatchSummary).toBe(true);
    expect(summary?.invoice.bulkBatchId).toBe(bulkResult.batchId);
    expect(summary?.items).toMatchObject([{ description: "Produk yang sama", quantity: 15, unitPrice: 200000 }]);
    const dashboard = await db.getDashboard(userId, "this_month");
    const dashboardRecap = dashboard.batchRecaps.find(recap => recap.invoice.id === bulkResult.summaryInvoiceId);
    expect(dashboardRecap?.storeCount).toBe(3);
    expect(dashboardRecap?.items).toMatchObject([{ description: "Produk yang sama", quantity: 15 }]);
  }, 30_000);
});
