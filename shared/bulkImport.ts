export type ImportedStoreRow = Record<string, unknown>;

const storeHeaders = ["nomor_toko", "store_number", "nomor toko", "store", "toko"];
const addressHeaders = ["alamat_pengiriman", "shipping_address", "alamat pengiriman", "alamat_gudang", "alamat gudang"];

function normalizedRecord(row: ImportedStoreRow) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_"), String(value ?? "").trim()]));
}

function readValue(row: Record<string, string>, headers: string[]) {
  return headers.map(header => header.replaceAll(" ", "_")).map(header => row[header]).find(Boolean) || "";
}

export function normalizeImportedStoreRows(rows: ImportedStoreRow[]) {
  const entries = rows.map(normalizedRecord).map(row => ({ storeNumber: readValue(row, storeHeaders), shippingAddress: readValue(row, addressHeaders) })).filter(row => row.storeNumber || row.shippingAddress);
  const missingStoreAt = entries.findIndex(row => !row.storeNumber);
  if (missingStoreAt >= 0) throw new Error(`Nomor toko wajib diisi pada baris ${missingStoreAt + 2}.`);
  const storeNumbers = entries.map(row => row.storeNumber);
  if (new Set(storeNumbers).size !== storeNumbers.length) throw new Error("Nomor toko dalam sheet tidak boleh duplikat.");
  const addresses = Array.from(new Set(entries.map(row => row.shippingAddress).filter(Boolean)));
  return {
    storeNumbers,
    shippingAddress: addresses.length === 1 ? addresses[0] : "",
    warning: addresses.length > 1 ? "Alamat pengiriman dalam sheet berbeda. Gunakan satu alamat gudang bersama pada formulir." : undefined,
  };
}
