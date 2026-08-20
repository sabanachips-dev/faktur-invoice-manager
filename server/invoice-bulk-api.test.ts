import { describe, expect, it } from "vitest";
import { bulkInvoiceInput, invoiceInput } from "./routers";

describe("bulk invoice input contracts", () => {
  it("accepts delivery data and a unique set of store numbers", () => {
    const result = bulkInvoiceInput.safeParse({
      sourceInvoiceId: 7,
      storeNumbers: ["Toko 01", "Toko 02", "Toko 03"],
      shippingAddress: "Gudang pusat, Jakarta",
      invoiceDate: new Date("2026-08-20"),
      dueDate: new Date("2026-09-03"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects repeated store numbers to prevent duplicate bulk invoice rows", () => {
    const result = bulkInvoiceInput.safeParse({
      sourceInvoiceId: 7,
      storeNumbers: ["Toko 01", "Toko 01"],
      shippingAddress: "Gudang pusat, Jakarta",
      invoiceDate: new Date("2026-08-20"),
      dueDate: new Date("2026-09-03"),
    });
    expect(result.success).toBe(false);
  });

  it("accepts store number and shipping address on a regular invoice", () => {
    const result = invoiceInput.safeParse({
      clientId: 1, invoiceDate: new Date("2026-08-20"), dueDate: new Date("2026-09-03"), status: "draft", currency: "IDR",
      discountType: "percentage", discountValue: 10, taxRate: 11, notes: null,
      storeNumber: "Toko 16", shippingAddress: "Gudang bersama", items: [{ description: "Produk A", quantity: 1, unitPrice: 100000 }],
    });
    expect(result.success).toBe(true);
  });
});
