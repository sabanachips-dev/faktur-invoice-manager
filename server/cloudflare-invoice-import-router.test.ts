import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare invoice import router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("memvalidasi lalu mengirim impor ke RPC atomik", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([51]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await workerRouter.createCaller(context).invoices.importFromSheet({ rows: [{ Import_ID: "IMP-01", Nama_Toko: "Toko 01", Nama_Klien: "Toko 01", Tanggal_Invoice: "2026-08-24", Jatuh_Tempo: "2026-08-31", Nama_Item: "Produk A", Qty: 2, Harga: 50000, Pajak: 11, Mata_Uang: "IDR" }] });
    expect(result).toEqual({ invoiceIds: [51], createdCount: 1 });
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.supabase.co/rest/v1/rpc/import_invoices_atomic");
  });
});
