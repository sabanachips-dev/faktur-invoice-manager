import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker from "../cloudflare/worker";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("Faktur Cloudflare Worker", () => {
  it("ships the same baseline security headers for static assets", async () => {
    const staticHeaders = await readFile(new URL("../client/public/_headers", import.meta.url), "utf8");
    expect(staticHeaders).toContain("X-Content-Type-Options: nosniff");
    expect(staticHeaders).toContain("X-Frame-Options: SAMEORIGIN");
    expect(staticHeaders).toContain("Referrer-Policy: strict-origin-when-cross-origin");
    expect(staticHeaders).toContain("Permissions-Policy: camera=(), geolocation=(), microphone=()");
    expect(staticHeaders).toContain("Cross-Origin-Opener-Policy: same-origin");
  });

  it("reports a fast worker health response without waiting for Supabase", async () => {
    const upstreamFetch = vi.fn();
    globalThis.fetch = upstreamFetch;
    const assetFetch = vi.fn();

    const response = await worker.fetch(new Request("https://example.test/api/health"), {
      ASSETS: { fetch: assetFetch },
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "test-key",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      services: { worker: true },
    });
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(upstreamFetch).not.toHaveBeenCalled();
    expect(assetFetch).not.toHaveBeenCalled();
  });

  it("reports deep Supabase health only when the explicit deep endpoint is requested", async () => {
    const upstreamFetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    globalThis.fetch = upstreamFetch;
    const response = await worker.fetch(new Request("https://example.test/api/health/deep"), {
      ASSETS: { fetch: vi.fn() }, SUPABASE_URL: "https://project.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test-key",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "ok", services: { supabase: true } });
    expect(upstreamFetch).toHaveBeenCalledWith("https://project.supabase.co/auth/v1/settings", {
      headers: { apikey: "test-key" },
    });
  });

  it("serves the React asset binding for non-API requests", async () => {
    const expected = new Response("application shell");
    const assetFetch = vi.fn().mockResolvedValue(expected);

    const response = await worker.fetch(new Request("https://example.test/invoice"), {
      ASSETS: { fetch: assetFetch },
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_PUBLISHABLE_KEY: "test-key",
    });

    expect(await response.text()).toBe("application shell");
    expect(response.headers.get("x-frame-options")).toBe("SAMEORIGIN");
    expect(assetFetch).toHaveBeenCalledTimes(1);
  });

  it("returns the authenticated Supabase user without exposing the token", async () => {
    const upstreamFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "auth-1", email: "owner@example.com", user_metadata: { full_name: "Owner" } }), { status: 200 }));
    globalThis.fetch = upstreamFetch;
    const response = await worker.fetch(new Request("https://example.test/api/auth/me", { headers: { authorization: "Bearer user-token" } }), {
      ASSETS: { fetch: vi.fn() }, SUPABASE_URL: "https://project.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test-key",
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "auth-1", email: "owner@example.com", name: "Owner" });
    expect(upstreamFetch).toHaveBeenCalledWith("https://project.supabase.co/auth/v1/user", { headers: { apikey: "test-key", authorization: "Bearer user-token" } });
  });

  it("rejects an auth check without a bearer session", async () => {
    const response = await worker.fetch(new Request("https://example.test/api/auth/me"), {
      ASSETS: { fetch: vi.fn() }, SUPABASE_URL: "https://project.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test-key",
    });
    expect(response.status).toBe(401);
  });
});
