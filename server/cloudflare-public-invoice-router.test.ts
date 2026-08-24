import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: null, user: null };

describe("Cloudflare public invoice router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("membaca invoice publik melalui RPC terisolasi", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ invoice: { publicId: "abcd1234" } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await workerRouter.createCaller(context).publicInvoice.get({ publicId: "abcd1234" });
    expect(result).toMatchObject({ invoice: { publicId: "abcd1234" } });
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.supabase.co/rest/v1/rpc/get_public_invoice");
  });
});
