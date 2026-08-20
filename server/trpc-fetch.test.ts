import { describe, expect, it, vi } from "vitest";
import { fetchTrpcWithHtmlRetry, isUnexpectedHtmlResponse } from "../client/src/lib/trpcFetch";

describe("tRPC fetch recovery", () => {
  it("retries once when a successful tRPC request receives HTML", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response("<!doctype html><html></html>", { status: 200, headers: { "content-type": "text/html" } }))
      .mockResolvedValueOnce(new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
    const response = await fetchTrpcWithHtmlRetry("/api/trpc/invoices.list", undefined, { fetcher, delayMs: 0 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(await response.json()).toEqual([]);
  });

  it("does not retry a normal JSON API response", async () => {
    const response = new Response("[]", { status: 200, headers: { "content-type": "application/json" } });
    expect(isUnexpectedHtmlResponse(response)).toBe(false);
    const fetcher = vi.fn().mockResolvedValue(response);
    await fetchTrpcWithHtmlRetry("/api/trpc/invoices.list", undefined, { fetcher, delayMs: 0 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
