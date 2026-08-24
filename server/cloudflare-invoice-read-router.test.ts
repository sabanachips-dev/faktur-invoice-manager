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

describe("Cloudflare invoice read router", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("menyaring daftar invoice berdasarkan status dan pencarian", async () => {
    const today = new Date().toISOString();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(json([
      { id: 1, invoiceNumber: "INV-2026-001", invoiceDate: today, total: 150000, status: "paid", isBatchSummary: false, bulkBatchId: null, client: { id: 2, name: "Toko Mawar" } },
      { id: 2, invoiceNumber: "INV-2026-002", invoiceDate: today, total: 80000, status: "draft", isBatchSummary: false, bulkBatchId: null, client: { id: 3, name: "Toko Melati" } },
    ]))));

    const result = await workerRouter.createCaller(context).invoices.list({ status: "paid", search: "mawar" });

    expect(result).toHaveLength(1);
    expect(result[0].invoice).toMatchObject({ invoiceNumber: "INV-2026-001", status: "paid" });
  });

  it("membuat nomor invoice berikutnya dari format profil bisnis", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) => Promise.resolve(json(
      url.includes("businessProfiles")
        ? [{ invoiceNumberFormat: "FAK-{YYYY}-{SEQ}" }]
        : [{ invoiceNumber: "FAK-2026-001" }],
    )));
    vi.stubGlobal("fetch", fetchMock);

    const next = await workerRouter.createCaller(context).invoices.nextNumber();

    expect(next).toMatch(/^FAK-\d{4}-002$/);
  });

  it("memperbarui status dan merekam aktivitas dengan userId pemilik", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json([{ id: 1, status: "paid" }]))
      .mockResolvedValueOnce(json([{ id: 11 }]));
    vi.stubGlobal("fetch", fetchMock);

    const invoice = await workerRouter.createCaller(context).invoices.updateStatus({ id: 1, status: "paid" });

    expect(invoice).toMatchObject({ id: 1, status: "paid" });
    expect(fetchMock.mock.calls[1][1].body).toContain('"userId":7');
    expect(fetchMock.mock.calls[1][1].body).toContain('"action":"status_changed"');
  });
});
