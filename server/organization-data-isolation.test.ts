import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "supabase/migrations/20260826_000013_organization_data_isolation.sql"), "utf8");

describe("organization data isolation migration", () => {
  it("replaces legacy owner-only policies with organization boundaries", () => {
    expect(source).toContain('drop policy if exists "invoices_own"');
    expect(source).toContain('create policy "invoices_org_read"');
    expect(source).toContain('"organizationId" = public.current_faktur_organization_id()');
    expect(source).toContain('create policy "invoice_items_org_read"');
  });

  it("makes atomic, import, fulfillment, and public invoice functions organization-aware", () => {
    expect(source).toContain('v_org_id integer := public.current_faktur_organization_id()');
    expect(source).toContain('"organizationId", "clientId", "invoiceNumber"');
    expect(source).toContain('join public."businessProfiles" b on b."organizationId" = i."organizationId"');
    expect(source).toContain('create or replace function public.import_invoices_atomic');
    expect(source).toContain('create or replace function public.update_invoice_fulfillment');
  });

  it("keeps the historical user identifier only as actor audit information", () => {
    expect(source).not.toContain('and "userId" = v_user_id');
    expect(source).toContain('"userId", "organizationId", "invoiceId", action');
  });
});
