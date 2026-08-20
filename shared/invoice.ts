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

export function calculateInvoiceAmounts(
  items: InvoiceLineCalculationInput[],
  discount = 0,
  taxRate = 0,
) {
  const subtotal = items.reduce(
    (total, item) => total + Math.max(0, Math.round(item.quantity)) * Math.max(0, Math.round(item.unitPrice)),
    0,
  );
  const safeDiscount = Math.min(Math.max(0, Math.round(discount)), subtotal);
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
