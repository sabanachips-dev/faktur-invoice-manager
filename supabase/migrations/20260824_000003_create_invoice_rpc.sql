begin;

create or replace function public.create_invoice_atomic(
  p_client_id integer,
  p_invoice_number text,
  p_invoice_date timestamptz,
  p_due_date timestamptz,
  p_status public.invoice_status,
  p_currency text,
  p_discount_type public.discount_type,
  p_discount_value integer,
  p_tax_rate integer,
  p_notes text,
  p_store_number text,
  p_shipping_address text,
  p_items jsonb
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id integer := public.current_faktur_user_id();
  v_invoice_id integer;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_tax integer := 0;
  v_total integer := 0;
  v_safe_discount_value integer := greatest(0, coalesce(p_discount_value, 0));
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  if not exists (select 1 from public.clients where id = p_client_id and "userId" = v_user_id) then raise exception 'Klien tidak ditemukan.'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Item invoice tidak valid.'; end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) item
    where coalesce((item ->> 'quantity')::integer, 0) < 1
       or coalesce((item ->> 'unitPrice')::integer, -1) < 0
       or coalesce(item ->> 'description', '') = ''
  ) then raise exception 'Item invoice tidak valid.'; end if;
  if p_discount_type = 'percentage' and v_safe_discount_value > 100 then raise exception 'Diskon persentase maksimal 100%%.'; end if;

  select coalesce(sum(greatest(1, (item ->> 'quantity')::integer) * greatest(0, (item ->> 'unitPrice')::integer)), 0)
    into v_subtotal from jsonb_array_elements(p_items) item;
  v_discount := case when p_discount_type = 'percentage' then least(round(v_subtotal * v_safe_discount_value / 100.0)::integer, v_subtotal) else least(v_safe_discount_value, v_subtotal) end;
  v_tax := greatest(0, round((v_subtotal - v_discount) * greatest(0, coalesce(p_tax_rate, 0)) / 100.0)::integer);
  v_total := v_subtotal - v_discount + v_tax;

  insert into public.invoices ("userId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, currency, subtotal, discount, "discountType", "discountValue", "taxRate", "taxAmount", total, notes, "storeNumber", "shippingAddress", "publicId", "sentAt", "paidAt")
  values (v_user_id, p_client_id, p_invoice_number, p_invoice_date, p_due_date, p_status, upper(left(p_currency, 3)), v_subtotal, v_discount, p_discount_type, v_safe_discount_value, greatest(0, coalesce(p_tax_rate, 0)), v_tax, v_total, nullif(p_notes, ''), nullif(p_store_number, ''), nullif(p_shipping_address, ''), left(replace(gen_random_uuid()::text, '-', ''), 16), case when p_status = 'sent' then timezone('utc', now()) else null end, case when p_status = 'paid' then timezone('utc', now()) else null end)
  returning id into v_invoice_id;

  insert into public."invoiceItems" ("invoiceId", "catalogItemId", description, quantity, "unitPrice", subtotal, position)
  select v_invoice_id, nullif(item ->> 'catalogItemId', '')::integer, item ->> 'description', greatest(1, (item ->> 'quantity')::integer), greatest(0, (item ->> 'unitPrice')::integer), greatest(1, (item ->> 'quantity')::integer) * greatest(0, (item ->> 'unitPrice')::integer), ordinality - 1
  from jsonb_array_elements(p_items) with ordinality as entry(item, ordinality);

  insert into public."invoiceActivities" ("userId", "invoiceId", action, description)
  values (v_user_id, v_invoice_id, 'created', format('Invoice %s dibuat sebagai %s.', p_invoice_number, p_status));
  return v_invoice_id;
end;
$$;

revoke execute on function public.create_invoice_atomic(integer, text, timestamptz, timestamptz, public.invoice_status, text, public.discount_type, integer, integer, text, text, text, jsonb) from public, anon;
grant execute on function public.create_invoice_atomic(integer, text, timestamptz, timestamptz, public.invoice_status, text, public.discount_type, integer, integer, text, text, text, jsonb) to authenticated;

commit;
