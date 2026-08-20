import { and, eq, inArray } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import { clients, invoiceItems, invoices } from "../drizzle/schema";
import * as db from "./db";
import { parseInvoiceImportRows } from "../shared/invoiceImport";

const userId = 1;
const marker = `Import E2E ${Date.now()}`;
let invoiceIds: number[] = [];
let clientId: number | undefined;

afterEach(async () => {
  const database = await db.getDb();
  if (!database) return;
  if (invoiceIds.length) {
    await database.delete(invoiceItems).where(inArray(invoiceItems.invoiceId, invoiceIds));
    await database.delete(invoices).where(inArray(invoices.id, invoiceIds));
  }
  if (clientId) await database.delete(clients).where(and(eq(clients.userId, userId), eq(clients.id, clientId)));
  invoiceIds = []; clientId = undefined;
});

describe("complete invoice spreadsheet import", () => {
  it("creates a client and a full invoice from grouped spreadsheet data", async () => {
    const parsed = parseInvoiceImportRows([
      { Import_ID: "IMPORT-01", Nama_Toko: marker, Nama_Klien: marker, Email_Klien: "invoice-import-e2e@example.com", Alamat_Penagihan: "Alamat tagih", Alamat_Pengiriman: "Alamat gudang", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Mata_Uang: "IDR", Jenis_Diskon: "nominal", Nilai_Diskon: 5000, Pajak: 11, Catatan: "Dari Excel", Nama_Item: "Produk A", Qty: 4, Harga: 100000 },
      { Import_ID: "IMPORT-01", Nama_Toko: marker, Nama_Klien: marker, Email_Klien: "invoice-import-e2e@example.com", Alamat_Penagihan: "Alamat tagih", Alamat_Pengiriman: "Alamat gudang", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Mata_Uang: "IDR", Jenis_Diskon: "nominal", Nilai_Diskon: 5000, Pajak: 11, Catatan: "Dari Excel", Nama_Item: "Produk B", Qty: 2, Harga: 50000 },
    ]);
    expect(parsed.errors).toEqual([]);
    invoiceIds = await db.importInvoices(userId, parsed.invoices);
    expect(invoiceIds).toHaveLength(1);
    const document = await db.getInvoice(userId, invoiceIds[0]!);
    clientId = document?.client.id;
    expect(document?.client).toMatchObject({ name: marker, email: "invoice-import-e2e@example.com", address: "Alamat tagih" });
    expect(document?.invoice).toMatchObject({ storeNumber: marker, shippingAddress: "Alamat gudang", discountType: "amount", discountValue: 5000, taxRate: 11, notes: "Dari Excel" });
    expect(document?.items).toMatchObject([{ description: "Produk A", quantity: 4, unitPrice: 100000 }, { description: "Produk B", quantity: 2, unitPrice: 50000 }]);
  }, 30_000);

  it("reuses an existing client when email is blank but name, phone, and address match", async () => {
    const existing = await db.createClient(userId, { name: marker, email: null, phone: "081212341234", address: "Alamat fallback", taxId: null });
    clientId = existing.id;
    const parsed = parseInvoiceImportRows([{ Import_ID: "IMPORT-02", Nama_Toko: marker, Nama_Klien: marker, Telepon_Klien: "081212341234", Alamat_Penagihan: "Alamat fallback", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Mata_Uang: "IDR", Pajak: 11, Nama_Item: "Produk C", Qty: 1, Harga: 50000 }]);
    expect(parsed.errors).toEqual([]);
    invoiceIds = await db.importInvoices(userId, parsed.invoices);
    const document = await db.getInvoice(userId, invoiceIds[0]!);
    expect(document?.client.id).toBe(existing.id);
  }, 30_000);
});
