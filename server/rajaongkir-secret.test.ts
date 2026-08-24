import { describe, expect, it } from "vitest";

describe("RajaOngkir API key", () => {
  it("dapat mengakses pencarian tujuan domestik resmi", async () => {
    const apiKey = process.env.RAJAONGKIR_API_KEY;
    expect(apiKey).toBeTruthy();

    const response = await fetch("https://rajaongkir.komerce.id/api/v1/destination/domestic-destination?search=jakarta&limit=1&offset=0", {
      headers: { key: apiKey! },
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as { meta?: { status?: boolean | string }; data?: unknown[] };
    expect([true, "success"]).toContain(payload.meta?.status);
    expect(Array.isArray(payload.data)).toBe(true);
  }, 20_000);
});
