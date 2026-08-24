import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare invoice duplicate router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("membuat invoice duplikat melalui RPC atomik", async () => {
    const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("rpc/create_invoice_atomic")) return response(19);
      if (url.includes("invoiceItems")) return response([{ id: 1, description: "Produk", quantity: 1, unitPrice: 100000 }]);
      if (url.includes("businessProfiles")) return response([{}]);
      if (url.includes("invoices?select=invoiceNumber")) return response([{ invoiceNumber: "INV-2026-001" }]);
      return response([{ id: 3, clientId: 2, invoiceNumber: "INV-2026-001", invoiceDate: "2026-08-20T00:00:00.000Z", dueDate: "2026-08-30T00:00:00.000Z", status: "draft", currency: "IDR", discountType: "amount", discountValue: 0, taxRate: 11, notes: null, storeNumber: null, shippingAddress: null, isBatchSummary: false, bulkBatchId: null, total: 100000, client: { id: 2, name: "Toko 01" } }]);
    });
    vi.stubGlobal("fetch", fetchMock);
    const id = await workerRouter.createCaller(context).invoices.duplicate({ id: 3 });
    expect(id).toBe(19);
    expect(fetchMock.mock.calls.at(-1)?.[0]).toBe("https://example.supabase.co/rest/v1/rpc/create_invoice_atomic");
  });
});
