import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare invoice update router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("meneruskan pembaruan invoice ke RPC atomik", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(41), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const id = await workerRouter.createCaller(context).invoices.update({ id: 41, data: { clientId: 2, invoiceNumber: "INV-2026-001", invoiceDate: new Date("2026-08-24T00:00:00.000Z"), dueDate: new Date("2026-08-31T00:00:00.000Z"), status: "paid", currency: "IDR", discountType: "amount", discountValue: 0, taxRate: 11, notes: null, storeNumber: null, shippingAddress: null, items: [{ description: "Produk A", quantity: 2, unitPrice: 50000, catalogItemId: null }] } });
    expect(id).toBe(41);
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.supabase.co/rest/v1/rpc/update_invoice_atomic");
    expect(fetchMock.mock.calls[0][1].body).toContain('"p_invoice_id":41');
  });
});
