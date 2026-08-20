import { describe, expect, it } from "vitest";
import { normalizeImportedStoreRows } from "../shared/bulkImport";

describe("bulk store spreadsheet import", () => {
  it("normalizes store rows and adopts one shared shipping address", () => {
    expect(normalizeImportedStoreRows([
      { Nomor_Toko: "Toko 01", Alamat_Pengiriman: "Gudang pusat" },
      { Nomor_Toko: "Toko 02", Alamat_Pengiriman: "Gudang pusat" },
    ])).toEqual({ storeNumbers: ["Toko 01", "Toko 02"], shippingAddress: "Gudang pusat", warning: undefined });
  });

  it("rejects duplicate store numbers", () => {
    expect(() => normalizeImportedStoreRows([{ Nomor_Toko: "Toko 01" }, { Nomor_Toko: "Toko 01" }])).toThrow("tidak boleh duplikat");
  });
});
