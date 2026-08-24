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
    expect(result.invoices[0]?.items).toMatchObject([{ description: "Produk A", quantity: 2, unitPrice: 150000, discountType: "none", discountValue: 0 }, { description: "Produk B", quantity: 3, unitPrice: 90000, discountType: "none", discountValue: 0 }]);
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

  it("parses item discounts and rejects a nominal potongan above the unit price", () => {
    const valid = parseInvoiceImportRows([{ Import_ID: "T-003", Nama_Toko: "Toko 03", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Nama_Item: "Produk Promo", Qty: 4, Harga: 50000, Jenis_Diskon_Item: "persen", Nilai_Diskon_Item: 10 }]);
    expect(valid.errors).toEqual([]);
    expect(valid.invoices[0]?.items[0]).toMatchObject({ discountType: "percentage", discountValue: 10 });

    const invalid = parseInvoiceImportRows([{ Import_ID: "T-004", Nama_Toko: "Toko 04", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Nama_Item: "Produk Promo", Qty: 1, Harga: 50000, Jenis_Diskon_Item: "nominal", Nilai_Diskon_Item: 60000 }]);
    expect(invalid.errors.join(" ")).toContain("Potongan item per unit");
  });
});
