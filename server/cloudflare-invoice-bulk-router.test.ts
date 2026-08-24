import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare bulk invoice router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("meneruskan pembuatan batch ke RPC atomik", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ batchId: "batch-1", storeInvoiceIds: [4, 5], summaryInvoiceId: 6 }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await workerRouter.createCaller(context).invoices.bulkCreate({ sourceInvoiceId: 3, storeNumbers: ["Toko 01", "Toko 02"], shippingAddress: "Gudang pusat", invoiceDate: new Date("2026-08-24T00:00:00.000Z"), dueDate: new Date("2026-08-31T00:00:00.000Z") });
    expect(result).toMatchObject({ batchId: "batch-1", summaryInvoiceId: 6 });
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.supabase.co/rest/v1/rpc/create_bulk_invoices_atomic");
  });
});
