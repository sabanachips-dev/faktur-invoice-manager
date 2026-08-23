import { describe, expect, it } from "vitest";

const projectUrl = process.env.SUPABASE_FAKTUR_URL;
const apiKey = process.env.SUPABASE_FAKTUR_ANON_KEY || process.env.SUPABASE_FAKTUR_PUBLISHABLE_KEY;

describe("Supabase Faktur connection", () => {
  it("accepts the configured public API key on the auth settings endpoint", async () => {
    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(apiKey).toMatch(/^(sb_publishable_|eyJ)/);

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: {
        apikey: apiKey!,
      },
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ external: { email: true } });
  }, 15_000);
});
