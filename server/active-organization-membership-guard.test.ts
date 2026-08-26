import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260826_000015_active_organization_membership_guard.sql"), "utf8");

describe("active organization membership guard", () => {
  it("verifies an active organization is still held by the authenticated member", () => {
    expect(migration).toContain('active."userId" = public.current_faktur_user_id()');
    expect(migration).toContain('member."organizationId" = active."organizationId"');
    expect(migration).toContain('member."userId" = active."userId"');
  });

  it("repairs or removes stale active organizations immediately after member deletion", () => {
    expect(migration).toContain("repair_active_organization_after_membership_deleted");
    expect(migration).toContain('after delete on public."organizationMembers"');
    expect(migration).toContain('delete from public."userActiveOrganizations"');
    expect(migration).toContain('update public."userActiveOrganizations"');
  });
});
