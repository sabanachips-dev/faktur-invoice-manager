import { describe, expect, it } from "vitest";

describe("email provider credentials", () => {
  it("authenticates with the configured Resend API key", async () => {
    const apiKey = process.env.RESEND_API_KEY;
    expect(apiKey, "RESEND_API_KEY must be configured").toBeTruthy();
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(response.status, "Resend must accept the configured API key").not.toBe(401);
    expect(response.status, "Resend API should be reachable with this key").toBeLessThan(500);
  }, 15_000);
});
