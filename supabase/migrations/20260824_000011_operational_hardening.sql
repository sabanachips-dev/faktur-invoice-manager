begin;

-- Internal helpers stay usable by authenticated policies and triggers, but cannot be invoked directly by anonymous API callers.
revoke execute on function public.current_faktur_user_id() from public, anon;
grant execute on function public.current_faktur_user_id() to authenticated;

-- These functions are invoked by database triggers only and must not be callable through the exposed Data API.
revoke execute on function public.handle_auth_user_created() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Public invoice retrieval intentionally remains available to anonymous recipients with an unguessable public ID.
revoke execute on function public.get_public_invoice(text) from public;
grant execute on function public.get_public_invoice(text) to anon, authenticated;

-- Cover foreign keys used while loading, editing, and joining invoices as the catalogue grows.
create index if not exists invoice_items_invoice_id_idx on public."invoiceItems" ("invoiceId");
create index if not exists invoice_items_catalog_item_id_idx on public."invoiceItems" ("catalogItemId");
create index if not exists invoices_client_id_idx on public.invoices ("clientId");

-- Preserve ownership semantics while allowing Postgres to evaluate the auth ID once per statement.
alter policy "users_select_own" on public.users
  using ("authUserId" = (select auth.uid()));
alter policy "users_update_own" on public.users
  using ("authUserId" = (select auth.uid()))
  with check ("authUserId" = (select auth.uid()));

commit;
