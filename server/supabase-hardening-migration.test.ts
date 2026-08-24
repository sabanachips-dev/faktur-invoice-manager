import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_000011_operational_hardening.sql"), "utf8");

describe("operational hardening migration", () => {
  it("keeps only the intended public invoice RPC callable anonymously", () => {
    expect(migration).toContain("revoke execute on function public.handle_auth_user_created() from public, anon, authenticated;");
    expect(migration).toContain("revoke execute on function public.rls_auto_enable() from public, anon, authenticated;");
    expect(migration).toContain("grant execute on function public.get_public_invoice(text) to anon, authenticated;");
  });

  it("adds invoice relationship indexes and caches auth identity within user policies", () => {
    expect(migration).toContain('create index if not exists invoice_items_invoice_id_idx');
    expect(migration).toContain('create index if not exists invoice_items_catalog_item_id_idx');
    expect(migration).toContain('create index if not exists invoices_client_id_idx');
    expect(migration).toContain('(select auth.uid())');
  });
});
