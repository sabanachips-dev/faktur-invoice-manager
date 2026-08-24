import { describe, expect, it } from "vitest";
import { createInvoiceExportRows } from "./invoiceExport";

describe("invoice export rows", () => {
  it("creates financial-report rows with Indonesian statuses and numeric amounts", () => {
    const rows = createInvoiceExportRows([{
      invoice: { invoiceNumber: "INV-2026-001", invoiceDate: new Date(2026, 7, 20), dueDate: new Date(2026, 8, 3), status: "paid", currency: "IDR", subtotal: 100000, discount: 5000, taxRate: 11, taxAmount: 10450, total: 105450, notes: "Terima kasih" },
      client: { name: "PT Contoh", email: "finance@contoh.id" },
      itemDiscount: 12000,
    }]);
    expect(rows).toEqual([expect.objectContaining({
      "No. Invoice": "INV-2026-001",
      Klien: "PT Contoh",
      Status: "Lunas",
      Subtotal: 100000,
      "Diskon Per Item": 12000,
      "Diskon Invoice": 5000,
      Total: 105450,
    })]);
  });
});
