import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = {
  env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" },
  accessToken: "Bearer session-token",
  user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" },
};

function json(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });
}

describe("Cloudflare dashboard router", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("menghitung metrik periode aktif tanpa memasukkan invoice rekap batch", async () => {
    const today = new Date().toISOString();
    const rows = [
      { id: 1, invoiceDate: today, total: 150000, status: "paid", fulfillmentStatus: "processing", isBatchSummary: false, bulkBatchId: null, client: { id: 2, name: "Toko A" } },
      { id: 2, invoiceDate: today, total: 80000, status: "unpaid", fulfillmentStatus: "pending_payment", isBatchSummary: false, bulkBatchId: null, client: { id: 3, name: "Toko B" } },
      { id: 3, invoiceDate: today, total: 230000, status: "draft", isBatchSummary: true, bulkBatchId: "batch-a", client: { id: 2, name: "Toko A" } },
    ];
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(json(rows))));

    const dashboard = await workerRouter.createCaller(context).dashboard.get({ period: "this_month" });

    expect(dashboard.periodLabel).toBe("bulan ini");
    expect(dashboard.metrics).toMatchObject({ monthTotal: 230000, monthCount: 2, paidTotal: 150000, unpaidTotal: 80000 });
    expect(dashboard.recent).toHaveLength(2);
    expect(dashboard.batchRecaps).toHaveLength(1);
    expect(dashboard.fulfillment).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "processing", count: 1, total: 150000 }),
      expect.objectContaining({ status: "pending_payment", count: 1, total: 80000 }),
    ]));
  });
});
