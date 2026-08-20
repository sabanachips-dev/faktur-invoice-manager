import type { ImportedInvoice } from "@shared/invoiceImport";

export type InvoiceSheetRow = Record<string, string | number | boolean | null>;

export async function readInvoiceImportSheet(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const name = workbook.SheetNames[0];
  if (!name) throw new Error("Sheet tidak ditemukan pada file.");
  const rows = XLSX.utils.sheet_to_json<InvoiceSheetRow>(workbook.Sheets[name], { defval: "", raw: false });
  if (!rows.length) throw new Error("Sheet tidak berisi data invoice.");
  return rows;
}

export async function downloadInvoiceImportTemplate() {
  const XLSX = await import("xlsx");
  const rows = [
    { Import_ID: "TOKO-001", Nama_Toko: "Toko Merdeka 01", Nama_Klien: "Toko Merdeka 01", Email_Klien: "toko01@example.com", Telepon_Klien: "081234567890", Alamat_Penagihan: "Jl. Merdeka No. 1", Alamat_Pengiriman: "Gudang Pusat, Jakarta", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Mata_Uang: "IDR", Jenis_Diskon: "persen", Nilai_Diskon: 10, Pajak: 11, Catatan: "Kirim ke gudang pusat", Nama_Item: "Produk A", Qty: 12, Harga: 150000 },
    { Import_ID: "TOKO-001", Nama_Toko: "Toko Merdeka 01", Nama_Klien: "Toko Merdeka 01", Email_Klien: "toko01@example.com", Telepon_Klien: "081234567890", Alamat_Penagihan: "Jl. Merdeka No. 1", Alamat_Pengiriman: "Gudang Pusat, Jakarta", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Mata_Uang: "IDR", Jenis_Diskon: "persen", Nilai_Diskon: 10, Pajak: 11, Catatan: "Kirim ke gudang pusat", Nama_Item: "Produk B", Qty: 6, Harga: 90000 },
    { Import_ID: "TOKO-002", Nama_Toko: "Toko Merdeka 02", Nama_Klien: "Toko Merdeka 02", Email_Klien: "toko02@example.com", Telepon_Klien: "081298765432", Alamat_Penagihan: "Jl. Merdeka No. 2", Alamat_Pengiriman: "Gudang Pusat, Jakarta", Tanggal_Invoice: "2026-08-20", Jatuh_Tempo: "2026-09-03", Mata_Uang: "IDR", Jenis_Diskon: "nominal", Nilai_Diskon: 50000, Pajak: 11, Catatan: "Kirim ke gudang pusat", Nama_Item: "Produk A", Qty: 10, Harga: 150000 },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  sheet["!cols"] = Object.keys(rows[0]).map(key => ({ wch: Math.max(14, Math.min(24, key.length + 4)) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Invoice");
  XLSX.writeFile(workbook, "template-import-invoice.xlsx", { compression: true });
}

export function describeImportedInvoice(invoice: ImportedInvoice) {
  return `${invoice.storeNumber} · ${invoice.items.length} item · ${invoice.currency}`;
}
