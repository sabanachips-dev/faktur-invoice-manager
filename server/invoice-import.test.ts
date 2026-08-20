import { describe, expect, it } from "vitest";
import { parseInvoiceImportRows } from "../shared/invoiceImport";

describe("invoice spreadsheet parser", () => {
  it("groups several item rows into one complete invoice", () => {
    const result = parseInvoiceImportRows([
      { Import_ID: "T-001", Nama_Toko: "Toko 01", Nama_Klien: "Toko 01", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Nama_Item: "Produk A", Qty: 2, Harga: 150000, Jenis_Diskon: "persen", Nilai_Diskon: 10, Pajak: 11, Mata_Uang: "IDR" },
      { Import_ID: "T-001", Nama_Toko: "Toko 01", Nama_Klien: "Toko 01", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Nama_Item: "Produk B", Qty: 3, Harga: 90000, Jenis_Diskon: "persen", Nilai_Diskon: 10, Pajak: 11, Mata_Uang: "IDR" },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0]).toMatchObject({ importId: "T-001", storeNumber: "Toko 01", discountType: "percentage", discountValue: 10, taxRate: 11, currency: "IDR" });
    expect(result.invoices[0]?.items).toMatchObject([{ description: "Produk A", quantity: 2, unitPrice: 150000 }, { description: "Produk B", quantity: 3, unitPrice: 90000 }]);
  });

  it("reports invalid required values before any invoice is created", () => {
    const result = parseInvoiceImportRows([{ Import_ID: "", Nama_Toko: "", Tanggal_Invoice: "invalid", Jatuh_Tempo: "", Nama_Item: "", Qty: 0, Harga: -1 }]);
    expect(result.invoices).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(3);
  });

  it("rejects rows with different invoice-level data under one Import_ID", () => {
    const result = parseInvoiceImportRows([
      { Import_ID: "T-002", Nama_Toko: "Toko 02", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Nama_Item: "Produk A", Qty: 1, Harga: 100000, Pajak: 11 },
      { Import_ID: "T-002", Nama_Toko: "Toko 02", Tanggal_Invoice: "2026-08-21", Jatuh_Tempo: "2026-09-03", Nama_Item: "Produk B", Qty: 1, Harga: 100000, Pajak: 11 },
    ]);
    expect(result.invoices).toEqual([]);
    expect(result.errors.join(" ")).toContain("invoiceDate");
  });
});
