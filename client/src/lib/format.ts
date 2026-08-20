import type { InvoiceStatus } from "@shared/invoice";

export function formatMoney(value: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value: Date | string | number) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function toDateInput(value: Date | string | number) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function labelStatus(status: InvoiceStatus) {
  return ({ draft: "Draft", sent: "Terkirim", unpaid: "Belum dibayar", paid: "Lunas", overdue: "Jatuh tempo", cancelled: "Dibatalkan" })[status];
}

