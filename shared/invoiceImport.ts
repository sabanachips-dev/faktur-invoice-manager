import type { DiscountType } from "./invoice";

export type InvoiceImportItem = { description: string; quantity: number; unitPrice: number };
export type ImportedInvoice = {
  importId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  billingAddress: string | null;
  storeNumber: string;
  shippingAddress: string | null;
  invoiceDate: Date;
  dueDate: Date;
  currency: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  notes: string | null;
  items: InvoiceImportItem[];
};

export type ImportInvoicePreview = { invoices: ImportedInvoice[]; errors: string[] };

const aliases: Record<string, string[]> = {
  importId: ["import_id", "id_import", "id"],
  storeNumber: ["nama_toko", "nomor_toko", "store_number", "toko"],
  clientName: ["nama_klien", "nama_client", "klien", "client"],
  clientEmail: ["email_klien", "email_client", "email"],
  clientPhone: ["telepon_klien", "phone_klien", "telepon", "phone"],
  billingAddress: ["alamat_penagihan", "billing_address"],
  shippingAddress: ["alamat_pengiriman", "shipping_address"],
  invoiceDate: ["tanggal_invoice", "invoice_date"],
  dueDate: ["jatuh_tempo", "due_date"],
  currency: ["mata_uang", "currency"],
  discountType: ["jenis_diskon", "discount_type"],
  discountValue: ["nilai_diskon", "discount_value", "diskon"],
  taxRate: ["pajak", "tax_rate", "pajak_persen"],
  notes: ["catatan", "notes"],
  itemDescription: ["nama_item", "item", "deskripsi_item", "description"],
  quantity: ["qty", "kuantitas", "quantity"],
  unitPrice: ["harga", "harga_satuan", "unit_price"],
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function normalRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()]));
}

function valueFor(row: Record<string, string>, name: keyof typeof aliases) {
  return aliases[name].map(header => row[header]).find(Boolean) || "";
}

function nullable(value: string) { return value || null; }

function numberValue(value: string) {
  const normalized = value.replace(/\s/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replaceAll(",", ".").replace(/[^0-9.-]/g, "");
  return Number(normalized);
}

function dateValue(value: string) {
  const parts = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  const result = parts ? new Date(Number(parts[3]), Number(parts[2]) - 1, Number(parts[1])) : new Date(value);
  return Number.isNaN(result.getTime()) ? undefined : result;
}

function discountTypeValue(value: string): DiscountType {
  return ["persen", "percentage", "%", "percent"].includes(value.trim().toLowerCase()) ? "percentage" : "amount";
}

function invoiceLevelFields(invoice: Omit<ImportedInvoice, "items">) {
  return {
    clientName: invoice.clientName, clientEmail: invoice.clientEmail, clientPhone: invoice.clientPhone, billingAddress: invoice.billingAddress,
    storeNumber: invoice.storeNumber, shippingAddress: invoice.shippingAddress, invoiceDate: invoice.invoiceDate.toISOString(), dueDate: invoice.dueDate.toISOString(),
    currency: invoice.currency, discountType: invoice.discountType, discountValue: invoice.discountValue, taxRate: invoice.taxRate, notes: invoice.notes,
  };
}

export function parseInvoiceImportRows(rows: Record<string, unknown>[]): ImportInvoicePreview {
  const errors: string[] = [];
  const groups = new Map<string, ImportedInvoice>();
  rows.forEach((source, index) => {
    const rowNumber = index + 2;
    const row = normalRow(source);
    const importId = valueFor(row, "importId");
    const storeNumber = valueFor(row, "storeNumber");
    const clientName = valueFor(row, "clientName") || storeNumber;
    const invoiceDate = dateValue(valueFor(row, "invoiceDate"));
    const dueDate = dateValue(valueFor(row, "dueDate"));
    const description = valueFor(row, "itemDescription");
    const quantity = numberValue(valueFor(row, "quantity"));
    const unitPrice = numberValue(valueFor(row, "unitPrice"));
    const discountType = discountTypeValue(valueFor(row, "discountType"));
    const discountValue = Math.max(0, numberValue(valueFor(row, "discountValue")) || 0);
    const taxRate = Math.max(0, numberValue(valueFor(row, "taxRate")) || 0);
    if (!importId) errors.push(`Baris ${rowNumber}: Import_ID wajib diisi.`);
    if (!storeNumber) errors.push(`Baris ${rowNumber}: Nama_Toko wajib diisi.`);
    if (!clientName) errors.push(`Baris ${rowNumber}: Nama_Klien atau Nama_Toko wajib diisi.`);
    if (!invoiceDate) errors.push(`Baris ${rowNumber}: Tanggal_Invoice tidak valid.`);
    if (!dueDate) errors.push(`Baris ${rowNumber}: Jatuh_Tempo tidak valid.`);
    if (!description) errors.push(`Baris ${rowNumber}: Nama_Item wajib diisi.`);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.push(`Baris ${rowNumber}: Qty harus lebih dari 0.`);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) errors.push(`Baris ${rowNumber}: Harga harus 0 atau lebih.`);
    if (discountType === "percentage" && discountValue > 100) errors.push(`Baris ${rowNumber}: Diskon persentase maksimal 100.`);
    if (taxRate > 100) errors.push(`Baris ${rowNumber}: Pajak maksimal 100.`);
    if (!importId || !storeNumber || !clientName || !invoiceDate || !dueDate || !description || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0 || (discountType === "percentage" && discountValue > 100) || taxRate > 100) return;
    const invoiceData: Omit<ImportedInvoice, "items"> = {
      importId, clientName, clientEmail: nullable(valueFor(row, "clientEmail")), clientPhone: nullable(valueFor(row, "clientPhone")), billingAddress: nullable(valueFor(row, "billingAddress")),
      storeNumber, shippingAddress: nullable(valueFor(row, "shippingAddress")), invoiceDate, dueDate, currency: valueFor(row, "currency") || "IDR", discountType, discountValue, taxRate, notes: nullable(valueFor(row, "notes")),
    };
    const existing = groups.get(importId);
    if (existing) {
      const existingFields = invoiceLevelFields(existing);
      const currentFields = invoiceLevelFields(invoiceData);
      const different = Object.keys(existingFields).filter(key => existingFields[key as keyof typeof existingFields] !== currentFields[key as keyof typeof currentFields]);
      if (different.length) errors.push(`Baris ${rowNumber}: field ${different.join(", ")} harus sama untuk Import_ID ${importId}.`);
      existing.items.push({ description, quantity, unitPrice });
      return;
    }
    groups.set(importId, { ...invoiceData, items: [{ description, quantity, unitPrice }] });
  });
  return { invoices: errors.length ? [] : Array.from(groups.values()), errors };
}
