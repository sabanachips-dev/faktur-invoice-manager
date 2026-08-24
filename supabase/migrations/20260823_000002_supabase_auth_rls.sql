begin;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users ("authUserId", "openId", name, email, "loginMethod", role)
  values (
    new.id,
    new.id::text,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, new.id::text), '@', 1)),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
    'user'
  )
  on conflict ("authUserId") do update
    set name = excluded.name,
        email = excluded.email,
        "loginMethod" = excluded."loginMethod",
        "lastSignedIn" = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_auth_user_created();

create or replace function public.current_faktur_user_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where "authUserId" = auth.uid() limit 1;
$$;

create policy "users_select_own" on public.users
  for select using ("authUserId" = auth.uid());
create policy "users_update_own" on public.users
  for update using ("authUserId" = auth.uid()) with check ("authUserId" = auth.uid());

create policy "business_profiles_own" on public."businessProfiles"
  for all using ("userId" = public.current_faktur_user_id()) with check ("userId" = public.current_faktur_user_id());
create policy "clients_own" on public.clients
  for all using ("userId" = public.current_faktur_user_id()) with check ("userId" = public.current_faktur_user_id());
create policy "catalog_items_own" on public."catalogItems"
  for all using ("userId" = public.current_faktur_user_id()) with check ("userId" = public.current_faktur_user_id());
create policy "invoices_own" on public.invoices
  for all using ("userId" = public.current_faktur_user_id()) with check ("userId" = public.current_faktur_user_id());
create policy "invoice_items_own" on public."invoiceItems"
  for all using (
    exists (select 1 from public.invoices where invoices.id = "invoiceItems"."invoiceId" and invoices."userId" = public.current_faktur_user_id())
  ) with check (
    exists (select 1 from public.invoices where invoices.id = "invoiceItems"."invoiceId" and invoices."userId" = public.current_faktur_user_id())
  );
create policy "invoice_activities_own" on public."invoiceActivities"
  for all using ("userId" = public.current_faktur_user_id()) with check ("userId" = public.current_faktur_user_id());

commit;
