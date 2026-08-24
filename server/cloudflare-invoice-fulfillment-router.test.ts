import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare invoice fulfillment router", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("meneruskan status dikirim dan resi ke RPC pemenuhan invoice", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(8), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const id = await workerRouter.createCaller(context).invoices.updateFulfillment({ id: 8, fulfillmentStatus: "shipped", courierName: "JNE", trackingNumber: "JNE123456789" });

    expect(id).toBe(8);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.supabase.co/rest/v1/rpc/update_invoice_fulfillment");
    expect(fetchMock.mock.calls[0][1].body).toContain('"p_fulfillment_status":"shipped"');
    expect(fetchMock.mock.calls[0][1].body).toContain('"p_tracking_number":"JNE123456789"');
  });

  it("menolak status dikirim jika resi belum diisi", async () => {
    await expect(workerRouter.createCaller(context).invoices.updateFulfillment({ id: 8, fulfillmentStatus: "shipped", courierName: "JNE", trackingNumber: null })).rejects.toBeDefined();
  });
});
