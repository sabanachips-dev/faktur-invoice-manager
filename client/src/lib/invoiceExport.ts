import * as XLSX from "xlsx";
import { formatDate, labelStatus } from "@/lib/format";
import type { InvoiceStatus } from "@shared/invoice";

export type InvoiceExportSource = {
  invoice: {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    status: InvoiceStatus;
    currency: string;
    subtotal: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string | null;
  };
  client: { name: string; email: string | null };
};

export function createInvoiceExportRows(source: InvoiceExportSource[]) {
  return source.map(({ invoice, client }) => ({
    "No. Invoice": invoice.invoiceNumber,
    Klien: client.name,
    "Email Klien": client.email || "",
    "Tanggal Invoice": formatDate(invoice.invoiceDate),
    "Jatuh Tempo": formatDate(invoice.dueDate),
    Status: labelStatus(invoice.status),
    MataUang: invoice.currency,
    Subtotal: invoice.subtotal,
    Diskon: invoice.discount,
    "Pajak (%)": invoice.taxRate,
    "Nominal Pajak": invoice.taxAmount,
    Total: invoice.total,
    Catatan: invoice.notes || "",
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export function exportInvoicesCsv(source: InvoiceExportSource[], filename: string) {
  const rows = createInvoiceExportRows(source);
  const headers = Object.keys(rows[0] || { "No. Invoice": "" });
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const csv = [headers.join(","), ...rows.map(row => headers.map(header => escape(row[header as keyof typeof row])).join(","))].join("\r\n");
  downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `${filename}.csv`);
}

export function exportInvoicesExcel(source: InvoiceExportSource[], filename: string) {
  const rows = createInvoiceExportRows(source);
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 18 }, { wch: 28 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 10 },
    { wch: 16 }, { wch: 16 }, { wch: 11 }, { wch: 16 }, { wch: 18 }, { wch: 38 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Invoice");
  XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
}

