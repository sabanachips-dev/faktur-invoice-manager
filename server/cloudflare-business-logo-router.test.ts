import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare business logo router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("mengunggah logo ke bucket pemilik lalu memperbarui profil", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Key: "auth-7/logo.png" }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ logoUrl: "https://example.supabase.co/storage/v1/object/public/business-logos/auth-7/logo.png" }]), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await workerRouter.createCaller(context).business.uploadLogo({ dataUrl: "data:image/png;base64,aGVsbG8=" });
    expect(result).toHaveProperty("logoUrl");
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.supabase.co/storage/v1/object/business-logos/auth-7/logo.png");
    expect(fetchMock.mock.calls[1][0]).toContain("/rest/v1/businessProfiles?");
  });
});
