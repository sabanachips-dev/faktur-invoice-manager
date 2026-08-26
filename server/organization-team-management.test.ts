import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const routerSource = readFileSync(resolve(process.cwd(), "cloudflare/trpc-router.ts"), "utf8");
const migrationSource = readFileSync(resolve(process.cwd(), "supabase/migrations/20260826_000014_organization_team_management.sql"), "utf8");

describe("organization team management", () => {
  it("requires appropriate roles for team-changing procedures", () => {
    expect(routerSource).toContain('requireOrganizationRole(ctx, ["owner", "admin"])');
    expect(routerSource).toContain('requireOrganizationRole(ctx, ["owner"])');
    expect(routerSource).toContain("Pemilik tidak dapat menghapus dirinya sendiri.");
  });

  it("stores only a hashed invitation token and exposes a single-use acceptance RPC", () => {
    expect(routerSource).toContain("const tokenHash = await hashInvitationToken(token)");
    expect(routerSource).toContain("accept_organization_invitation");
    expect(migrationSource).toContain('"tokenHash" = p_token_hash');
    expect(migrationSource).toContain('and "acceptedAt" is null');
    expect(migrationSource).toContain('and "expiresAt" > timezone');
  });

  it("permits members to view their own workspaces and active-team identities only", () => {
    expect(migrationSource).toContain('"userId" = public.current_faktur_user_id()');
    expect(migrationSource).toContain('"organizationId" = public.current_faktur_organization_id()');
    expect(migrationSource).toContain('create policy "users_select_active_organization"');
  });
});
