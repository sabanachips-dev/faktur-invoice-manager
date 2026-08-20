import { describe, expect, it } from "vitest";
import { calculateInvoiceAmounts, formatInvoiceNumber, getNextAvailableInvoiceNumber } from "../shared/invoice";

describe("invoice calculation", () => {
  it("calculates subtotal, discount, tax, and total in rupiah", () => {
    expect(calculateInvoiceAmounts([
      { quantity: 2, unitPrice: 1500000 },
      { quantity: 1, unitPrice: 500000 },
    ], 100000, 11)).toEqual({
      subtotal: 3500000,
      discount: 100000,
      taxAmount: 374000,
      total: 3774000,
    });
  });

  it("prevents a discount from exceeding subtotal", () => {
    expect(calculateInvoiceAmounts([{ quantity: 1, unitPrice: 50000 }], 90000, 11)).toEqual({
      subtotal: 50000,
      discount: 50000,
      taxAmount: 0,
      total: 0,
    });
  });

  it("calculates a percentage discount before tax", () => {
    expect(calculateInvoiceAmounts([{ quantity: 2, unitPrice: 500000 }], 10, 11, "percentage")).toEqual({
      subtotal: 1000000,
      discount: 100000,
      taxAmount: 99000,
      total: 999000,
    });
  });

  it("caps a percentage discount at 100 percent", () => {
    expect(calculateInvoiceAmounts([{ quantity: 1, unitPrice: 125000 }], 125, 11, "percentage")).toEqual({
      subtotal: 125000,
      discount: 125000,
      taxAmount: 0,
      total: 0,
    });
  });
});

describe("invoice number", () => {
  it("uses the required INV-year-sequence format", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("INV-2026-001");
    expect(formatInvoiceNumber(2026, 28)).toBe("INV-2026-028");
  });

  it("applies the configured format while retaining a padded sequence", () => {
    expect(formatInvoiceNumber(2026, 7, "F-{YYYY}/{SEQ}")).toBe("F-2026/007");
  });

  it("uses an unused number even when a prior invoice deletion leaves a sequence gap", () => {
    expect(getNextAvailableInvoiceNumber(["INV-2026-001", "INV-2026-003", "INV-2026-013"], 2026)).toBe("INV-2026-002");
  });
});
