begin;

create or replace function public.get_public_invoice(p_public_id text)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'invoice', to_jsonb(i),
    'client', to_jsonb(c),
    'business', to_jsonb(b),
    'items', coalesce((select jsonb_agg(to_jsonb(ii) order by ii.position) from public."invoiceItems" ii where ii."invoiceId" = i.id), '[]'::jsonb)
  )
  from public.invoices i
  join public.clients c on c.id = i."clientId"
  join public."businessProfiles" b on b."userId" = i."userId"
  where i."publicId" = p_public_id
  limit 1;
$$;

revoke execute on function public.get_public_invoice(text) from public;
grant execute on function public.get_public_invoice(text) to anon, authenticated;
commit;
