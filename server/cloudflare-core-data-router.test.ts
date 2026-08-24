import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = {
  env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" },
  accessToken: "Bearer session-token",
  user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" },
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

describe("Cloudflare core data router", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("membuat klien memakai bearer session dan userId pemilik", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json([{ id: 31, name: "Toko A" }]));
    vi.stubGlobal("fetch", fetchMock);

    const client = await workerRouter.createCaller(context).clients.create({ name: "Toko A", email: "", address: null, phone: null, taxId: null });

    expect(client).toMatchObject({ id: 31, name: "Toko A" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/clients",
      expect.objectContaining({ method: "POST", body: expect.stringContaining('"userId":7') }),
    );
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get("authorization")).toBe("Bearer session-token");
  });

  it("membuat profil bisnis default hanya bila profil belum tersedia", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json([{ id: 8, userId: 7, businessName: "Bisnis Anda" }]));
    vi.stubGlobal("fetch", fetchMock);

    const profile = await workerRouter.createCaller(context).business.get();

    expect(profile).toMatchObject({ id: 8, businessName: "Bisnis Anda" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].body).toContain('"userId":7');
  });

  it("menolak procedure terlindungi bila sesi tidak tersedia", async () => {
    const unauthenticated: WorkerContext = { ...context, user: null, accessToken: null };
    await expect(workerRouter.createCaller(unauthenticated).catalog.list({})).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
