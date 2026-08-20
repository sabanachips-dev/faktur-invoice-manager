import { normalizeImportedStoreRows } from "@shared/bulkImport";

function downloadBlob(blob: Blob, filename: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

export async function importStoresFromSpreadsheet(file: File) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  if (!firstSheet) throw new Error("Sheet tidak ditemukan pada file.");
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheet], { defval: "" });
  if (!rows.length) throw new Error("Sheet tidak berisi daftar toko.");
  return normalizeImportedStoreRows(rows);
}

export function downloadStoreImportTemplate() {
  const csv = "Nomor_Toko,Alamat_Pengiriman\r\nToko 01,Gudang pusat - Jl. Distribusi No. 10\r\nToko 02,Gudang pusat - Jl. Distribusi No. 10\r\n";
  downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), "template-import-toko.csv");
}
