import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "cloudflare/trpc-router.ts"), "utf8");

describe("organization worker context", () => {
  it("loads the active organization and member role from Supabase after authentication", () => {
    expect(source).toContain("userActiveOrganizations?userId=eq.${profile.id}&select=organizationId&limit=1");
    expect(source).toContain("organizationMembers?userId=eq.${profile.id}&organizationId=eq.${organizationId}&select=role&limit=1");
    expect(source).toContain("organizationRole: membership?.role ?? null");
  });

  it("writes direct business data with the active organization identifier", () => {
    expect(source).toContain("organizationId: ctx.user.organizationId");
    expect(source).toContain("organizationId, businessName: \"Bisnis Anda\"");
    expect(source).toContain("organizationId: ctx.user.organizationId });");
  });
});
