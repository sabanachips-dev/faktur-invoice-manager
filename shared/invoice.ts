export const INVOICE_STATUSES = [
  "draft",
  "sent",
  "unpaid",
  "paid",
  "overdue",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceLineCalculationInput = {
  quantity: number;
  unitPrice: number;
};

export type DiscountType = "amount" | "percentage";

export function normalizeDiscountValue(value: number, type: DiscountType) {
  const normalized = Math.max(0, Math.round(value));
  return type === "percentage" ? Math.min(normalized, 100) : normalized;
}

export function calculateInvoiceAmounts(
  items: InvoiceLineCalculationInput[],
  discountValue = 0,
  taxRate = 0,
  discountType: DiscountType = "amount",
) {
  const subtotal = items.reduce(
    (total, item) => total + Math.max(0, Math.round(item.quantity)) * Math.max(0, Math.round(item.unitPrice)),
    0,
  );
  const normalizedDiscountValue = normalizeDiscountValue(discountValue, discountType);
  const safeDiscount = discountType === "percentage"
    ? Math.min(Math.round((subtotal * normalizedDiscountValue) / 100), subtotal)
    : Math.min(normalizedDiscountValue, subtotal);
  const taxableAmount = subtotal - safeDiscount;
  const taxAmount = Math.max(0, Math.round((taxableAmount * Math.max(0, taxRate)) / 100));

  return {
    subtotal,
    discount: safeDiscount,
    taxAmount,
    total: taxableAmount + taxAmount,
  };
}

export function formatInvoiceNumber(year: number, sequence: number, format = "INV-{YYYY}-{SEQ}") {
  return format
    .replaceAll("{YYYY}", String(year))
    .replaceAll("{SEQ}", String(Math.max(1, sequence)).padStart(3, "0"));
}

export function getNextAvailableInvoiceNumber(usedNumbers: Iterable<string>, year: number, format = "INV-{YYYY}-{SEQ}") {
  const used = new Set(usedNumbers);
  let sequence = 1;
  let candidate = formatInvoiceNumber(year, sequence, format);
  while (used.has(candidate)) {
    sequence += 1;
    candidate = formatInvoiceNumber(year, sequence, format);
  }
  return candidate;
}
