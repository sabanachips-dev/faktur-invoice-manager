import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable", RAJAONGKIR_API_KEY: "shipping-key" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };
const json = (data: unknown) => new Response(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json" } });

describe("Cloudflare shipping router", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("meneruskan pencarian tujuan, kalkulasi ongkir, dan cek resi dengan API key hanya di server", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ meta: { status: "success" }, data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    const caller = workerRouter.createCaller(context);
    await caller.shipping.searchDestination({ query: "sumbar" });
    await caller.shipping.calculate({ originId: 1, destinationId: 2, weight: 1000, couriers: "jne:jnt" });
    await caller.shipping.track({ courier: "jne", trackingNumber: "JNE123456" });
    expect(fetchMock.mock.calls[0][0]).toContain("destination/domestic-destination?search=sumatera%20barat");
    expect(fetchMock.mock.calls[0][1].headers.key).toBe("shipping-key");
    expect(fetchMock.mock.calls[1][0]).toContain("calculate/domestic-cost");
    expect(fetchMock.mock.calls[1][1].body).toContain("weight=1000");
    expect(fetchMock.mock.calls[2][0]).toContain("track/waybill");
    expect(fetchMock.mock.calls[2][1].body).toContain("awb=JNE123456");
  });
});
