export const publicInvoiceIdPattern = /^[A-Za-z0-9_-]{6,32}$/;

export function isValidPublicInvoiceId(value: unknown): value is string {
  return typeof value === "string" && publicInvoiceIdPattern.test(value.trim());
}
