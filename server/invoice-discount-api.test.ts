import { describe, expect, it } from "vitest";
import { invoiceInput } from "./routers";
import { normalizeDiscountValue } from "../shared/invoice";

const baseInput = {
  clientId: 1,
  invoiceDate: new Date("2026-08-20"),
  dueDate: new Date("2026-09-03"),
  status: "draft" as const,
  currency: "IDR",
  taxRate: 11,
  notes: null,
  items: [{ description: "Jasa", quantity: 1, unitPrice: 100000 }],
};

describe("invoice percentage discount contract", () => {
  it("rejects a percentage discount above 100 through the API input contract", () => {
    const result = invoiceInput.safeParse({ ...baseInput, discountType: "percentage", discountValue: 101 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some(issue => issue.path.join(".") === "discountValue")).toBe(true);
  });

  it("normalizes stored percentage values to a maximum of 100", () => {
    expect(normalizeDiscountValue(125, "percentage")).toBe(100);
    expect(normalizeDiscountValue(10.7, "percentage")).toBe(11);
    expect(normalizeDiscountValue(125000, "amount")).toBe(125000);
  });
});
