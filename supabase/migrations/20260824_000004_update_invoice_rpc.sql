begin;

create or replace function public.update_invoice_atomic(
  p_invoice_id integer, p_client_id integer, p_invoice_number text, p_invoice_date timestamptz, p_due_date timestamptz,
  p_status public.invoice_status, p_currency text, p_discount_type public.discount_type, p_discount_value integer, p_tax_rate integer,
  p_notes text, p_store_number text, p_shipping_address text, p_items jsonb
)
returns integer language plpgsql security invoker set search_path = public as $$
declare
  v_user_id integer := public.current_faktur_user_id(); v_subtotal integer := 0; v_discount integer := 0; v_tax integer := 0; v_total integer := 0; v_safe_discount integer := greatest(0, coalesce(p_discount_value, 0)); v_previous_status public.invoice_status;
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  select status into v_previous_status from public.invoices where id = p_invoice_id and "userId" = v_user_id;
  if v_previous_status is null then raise exception 'Invoice tidak ditemukan.'; end if;
  if not exists (select 1 from public.clients where id = p_client_id and "userId" = v_user_id) then raise exception 'Klien tidak ditemukan.'; end if;
  if jsonb_typeof(p_items) <> 'array' or exists (select 1 from jsonb_array_elements(p_items) item where coalesce((item ->> 'quantity')::integer, 0) < 1 or coalesce((item ->> 'unitPrice')::integer, -1) < 0 or coalesce(item ->> 'description', '') = '') then raise exception 'Item invoice tidak valid.'; end if;
  if p_discount_type = 'percentage' and v_safe_discount > 100 then raise exception 'Diskon persentase maksimal 100%%.'; end if;
  select coalesce(sum(greatest(1, (item ->> 'quantity')::integer) * greatest(0, (item ->> 'unitPrice')::integer)), 0) into v_subtotal from jsonb_array_elements(p_items) item;
  v_discount := case when p_discount_type = 'percentage' then least(round(v_subtotal * v_safe_discount / 100.0)::integer, v_subtotal) else least(v_safe_discount, v_subtotal) end;
  v_tax := greatest(0, round((v_subtotal - v_discount) * greatest(0, coalesce(p_tax_rate, 0)) / 100.0)::integer); v_total := v_subtotal - v_discount + v_tax;
  update public.invoices set "clientId" = p_client_id, "invoiceNumber" = p_invoice_number, "invoiceDate" = p_invoice_date, "dueDate" = p_due_date, status = p_status, currency = upper(left(p_currency, 3)), subtotal = v_subtotal, discount = v_discount, "discountType" = p_discount_type, "discountValue" = v_safe_discount, "taxRate" = greatest(0, coalesce(p_tax_rate, 0)), "taxAmount" = v_tax, total = v_total, notes = nullif(p_notes, ''), "storeNumber" = nullif(p_store_number, ''), "shippingAddress" = nullif(p_shipping_address, ''), "sentAt" = case when p_status = 'sent' then timezone('utc', now()) else null end, "paidAt" = case when p_status = 'paid' then timezone('utc', now()) else null end where id = p_invoice_id and "userId" = v_user_id;
  delete from public."invoiceItems" where "invoiceId" = p_invoice_id;
  insert into public."invoiceItems" ("invoiceId", "catalogItemId", description, quantity, "unitPrice", subtotal, position)
  select p_invoice_id, nullif(item ->> 'catalogItemId', '')::integer, item ->> 'description', greatest(1, (item ->> 'quantity')::integer), greatest(0, (item ->> 'unitPrice')::integer), greatest(1, (item ->> 'quantity')::integer) * greatest(0, (item ->> 'unitPrice')::integer), ordinality - 1 from jsonb_array_elements(p_items) with ordinality as entry(item, ordinality);
  if v_previous_status <> p_status then insert into public."invoiceActivities" ("userId", "invoiceId", action, description) values (v_user_id, p_invoice_id, 'status_changed', format('Status invoice diubah menjadi %s.', p_status)); end if;
  insert into public."invoiceActivities" ("userId", "invoiceId", action, description) values (v_user_id, p_invoice_id, 'updated', 'Invoice diperbarui.');
  return p_invoice_id;
end;
$$;

revoke execute on function public.update_invoice_atomic(integer, integer, text, timestamptz, timestamptz, public.invoice_status, text, public.discount_type, integer, integer, text, text, text, jsonb) from public, anon;
grant execute on function public.update_invoice_atomic(integer, integer, text, timestamptz, timestamptz, public.invoice_status, text, public.discount_type, integer, integer, text, text, text, jsonb) to authenticated;
commit;
