import { afterEach, describe, expect, it, vi } from "vitest";
import { workerRouter, type WorkerContext } from "../cloudflare/trpc-router";

const context: WorkerContext = { env: { SUPABASE_URL: "https://example.supabase.co", SUPABASE_PUBLISHABLE_KEY: "publishable" }, accessToken: "Bearer session-token", user: { id: 7, authUserId: "auth-7", openId: "auth-7", name: "Pemilik", email: "pemilik@example.com", role: "user" } };

describe("Cloudflare invoice email router", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("menolak pengiriman sebelum rahasia Resend tersedia", async () => {
    const response = (value: unknown) => new Response(JSON.stringify(value), { status: 200, headers: { "content-type": "application/json" } });
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("invoiceItems")) return response([{ id: 1, description: "Produk", quantity: 1, unitPrice: 100000 }]);
      if (url.includes("businessProfiles")) return response([{ businessName: "Faktur", email: "bisnis@example.com" }]);
      return response([{ id: 1, clientId: 2, invoiceNumber: "INV-01", publicId: "abc12345", client: { name: "Toko", email: "toko@example.com" } }]);
    }));
    await expect(workerRouter.createCaller(context).invoices.sendEmail({ id: 1, origin: "https://staging.example.com" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
