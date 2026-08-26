import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260826_000012_organization_foundation.sql"), "utf8");

describe("organization foundation migration", () => {
  it("creates organizations, membership roles, active organization state, and invitation records", () => {
    expect(migration).toContain("create type public.organization_member_role as enum ('owner', 'admin', 'staff')");
    expect(migration).toContain("create table public.organizations");
    expect(migration).toContain('create table public."organizationMembers"');
    expect(migration).toContain('create table public."userActiveOrganizations"');
    expect(migration).toContain('create table public."organizationInvitations"');
  });

  it("backfills all legacy business data into a safe initial organization without deleting records", () => {
    for (const table of ['"businessProfiles"', "clients", '"catalogItems"', "invoices", '"invoiceActivities"']) {
      expect(migration).toContain(`update public.${table}`);
      expect(migration).toContain('set "organizationId" = o.id');
    }
    expect(migration).not.toContain("delete from public.invoices");
    expect(migration).not.toContain("delete from public.clients");
  });

  it("prepares organization-scoped invoice numbering and authenticated organization helpers", () => {
    expect(migration).toContain('invoice_organization_number_unique unique ("organizationId", "invoiceNumber")');
    expect(migration).toContain("create or replace function public.current_faktur_organization_id()");
    expect(migration).toContain("create or replace function public.current_faktur_organization_role()");
    expect(migration).toContain("create or replace function public.handle_auth_user_created()");
  });
});
