begin;

alter table public."catalogItems"
  add column "discountType" text not null default 'none',
  add column "discountValue" integer not null default 0,
  add constraint catalog_items_discount_type_check check ("discountType" in ('none', 'amount', 'percentage')),
  add constraint catalog_items_discount_value_check check ("discountValue" >= 0);

alter table public."invoiceItems"
  add column "discountType" text not null default 'none',
  add column "discountValue" integer not null default 0,
  add column discount integer not null default 0,
  add constraint invoice_items_discount_type_check check ("discountType" in ('none', 'amount', 'percentage')),
  add constraint invoice_items_discount_value_check check ("discountValue" >= 0),
  add constraint invoice_items_discount_check check (discount >= 0);

create or replace function public.create_invoice_atomic(
  p_client_id integer, p_invoice_number text, p_invoice_date timestamptz, p_due_date timestamptz,
  p_status public.invoice_status, p_currency text, p_discount_type public.discount_type, p_discount_value integer,
  p_tax_rate integer, p_notes text, p_store_number text, p_shipping_address text, p_items jsonb
)
returns integer language plpgsql security invoker set search_path = public as $$
declare
  v_user_id integer := public.current_faktur_user_id(); v_invoice_id integer; v_subtotal integer := 0;
  v_discount integer := 0; v_tax integer := 0; v_total integer := 0;
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
       or coalesce(item ->> 'discountType', 'none') not in ('none', 'amount', 'percentage')
       or greatest(0, coalesce((item ->> 'discountValue')::integer, 0)) <> coalesce((item ->> 'discountValue')::integer, 0)
       or (coalesce(item ->> 'discountType', 'none') = 'percentage' and coalesce((item ->> 'discountValue')::integer, 0) > 100)
       or (coalesce(item ->> 'discountType', 'none') = 'amount' and coalesce((item ->> 'discountValue')::integer, 0) > coalesce((item ->> 'unitPrice')::integer, 0))
  ) then raise exception 'Diskon item tidak valid.'; end if;
  if p_discount_type = 'percentage' and v_safe_discount_value > 100 then raise exception 'Diskon persentase maksimal 100%%.'; end if;

  select coalesce(sum(gross - line_discount), 0) into v_subtotal from (
    select quantity * unit_price as gross,
      case discount_type
        when 'percentage' then least(round((quantity * unit_price) * discount_value / 100.0)::integer, quantity * unit_price)
        when 'amount' then least(discount_value * quantity, quantity * unit_price)
        else 0
      end as line_discount
    from (
      select greatest(1, (item ->> 'quantity')::integer) as quantity,
        greatest(0, (item ->> 'unitPrice')::integer) as unit_price,
        coalesce(item ->> 'discountType', 'none') as discount_type,
        greatest(0, coalesce((item ->> 'discountValue')::integer, 0)) as discount_value
      from jsonb_array_elements(p_items) item
    ) normalized
  ) calculated;
  v_discount := case when p_discount_type = 'percentage' then least(round(v_subtotal * v_safe_discount_value / 100.0)::integer, v_subtotal) else least(v_safe_discount_value, v_subtotal) end;
  v_tax := greatest(0, round((v_subtotal - v_discount) * greatest(0, coalesce(p_tax_rate, 0)) / 100.0)::integer);
  v_total := v_subtotal - v_discount + v_tax;

  insert into public.invoices ("userId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, currency, subtotal, discount, "discountType", "discountValue", "taxRate", "taxAmount", total, notes, "storeNumber", "shippingAddress", "publicId", "sentAt", "paidAt")
  values (v_user_id, p_client_id, p_invoice_number, p_invoice_date, p_due_date, p_status, upper(left(p_currency, 3)), v_subtotal, v_discount, p_discount_type, v_safe_discount_value, greatest(0, coalesce(p_tax_rate, 0)), v_tax, v_total, nullif(p_notes, ''), nullif(p_store_number, ''), nullif(p_shipping_address, ''), left(replace(gen_random_uuid()::text, '-', ''), 16), case when p_status = 'sent' then timezone('utc', now()) else null end, case when p_status = 'paid' then timezone('utc', now()) else null end)
  returning id into v_invoice_id;

  insert into public."invoiceItems" ("invoiceId", "catalogItemId", description, quantity, "unitPrice", "discountType", "discountValue", discount, subtotal, position)
  select v_invoice_id, nullif(item ->> 'catalogItemId', '')::integer, item ->> 'description', quantity, unit_price, discount_type, discount_value, line_discount, gross - line_discount, ordinality - 1
  from jsonb_array_elements(p_items) with ordinality as entry(item, ordinality)
  cross join lateral (
    select greatest(1, (item ->> 'quantity')::integer) as quantity,
      greatest(0, (item ->> 'unitPrice')::integer) as unit_price,
      coalesce(item ->> 'discountType', 'none') as discount_type,
      greatest(0, coalesce((item ->> 'discountValue')::integer, 0)) as discount_value
  ) normalized
  cross join lateral (
    select quantity * unit_price as gross,
      case discount_type
        when 'percentage' then least(round((quantity * unit_price) * discount_value / 100.0)::integer, quantity * unit_price)
        when 'amount' then least(discount_value * quantity, quantity * unit_price)
        else 0
      end as line_discount
  ) calculated;

  insert into public."invoiceActivities" ("userId", "invoiceId", action, description)
  values (v_user_id, v_invoice_id, 'created', format('Invoice %s dibuat sebagai %s.', p_invoice_number, p_status));
  return v_invoice_id;
end;
$$;

create or replace function public.update_invoice_atomic(
  p_invoice_id integer, p_client_id integer, p_invoice_number text, p_invoice_date timestamptz, p_due_date timestamptz,
  p_status public.invoice_status, p_currency text, p_discount_type public.discount_type, p_discount_value integer,
  p_tax_rate integer, p_notes text, p_store_number text, p_shipping_address text, p_items jsonb
)
returns integer language plpgsql security invoker set search_path = public as $$
declare
  v_user_id integer := public.current_faktur_user_id(); v_subtotal integer := 0; v_discount integer := 0;
  v_tax integer := 0; v_total integer := 0; v_safe_discount integer := greatest(0, coalesce(p_discount_value, 0));
  v_previous_status public.invoice_status;
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  select status into v_previous_status from public.invoices where id = p_invoice_id and "userId" = v_user_id;
  if v_previous_status is null then raise exception 'Invoice tidak ditemukan.'; end if;
  if not exists (select 1 from public.clients where id = p_client_id and "userId" = v_user_id) then raise exception 'Klien tidak ditemukan.'; end if;
  if jsonb_typeof(p_items) <> 'array' or exists (
    select 1 from jsonb_array_elements(p_items) item
    where coalesce((item ->> 'quantity')::integer, 0) < 1
       or coalesce((item ->> 'unitPrice')::integer, -1) < 0
       or coalesce(item ->> 'description', '') = ''
       or coalesce(item ->> 'discountType', 'none') not in ('none', 'amount', 'percentage')
       or greatest(0, coalesce((item ->> 'discountValue')::integer, 0)) <> coalesce((item ->> 'discountValue')::integer, 0)
       or (coalesce(item ->> 'discountType', 'none') = 'percentage' and coalesce((item ->> 'discountValue')::integer, 0) > 100)
       or (coalesce(item ->> 'discountType', 'none') = 'amount' and coalesce((item ->> 'discountValue')::integer, 0) > coalesce((item ->> 'unitPrice')::integer, 0))
  ) then raise exception 'Diskon item tidak valid.'; end if;
  if p_discount_type = 'percentage' and v_safe_discount > 100 then raise exception 'Diskon persentase maksimal 100%%.'; end if;
  select coalesce(sum(gross - line_discount), 0) into v_subtotal from (
    select quantity * unit_price as gross,
      case discount_type when 'percentage' then least(round((quantity * unit_price) * discount_value / 100.0)::integer, quantity * unit_price) when 'amount' then least(discount_value * quantity, quantity * unit_price) else 0 end as line_discount
    from (select greatest(1, (item ->> 'quantity')::integer) as quantity, greatest(0, (item ->> 'unitPrice')::integer) as unit_price, coalesce(item ->> 'discountType', 'none') as discount_type, greatest(0, coalesce((item ->> 'discountValue')::integer, 0)) as discount_value from jsonb_array_elements(p_items) item) normalized
  ) calculated;
  v_discount := case when p_discount_type = 'percentage' then least(round(v_subtotal * v_safe_discount / 100.0)::integer, v_subtotal) else least(v_safe_discount, v_subtotal) end;
  v_tax := greatest(0, round((v_subtotal - v_discount) * greatest(0, coalesce(p_tax_rate, 0)) / 100.0)::integer); v_total := v_subtotal - v_discount + v_tax;
  update public.invoices set "clientId" = p_client_id, "invoiceNumber" = p_invoice_number, "invoiceDate" = p_invoice_date, "dueDate" = p_due_date, status = p_status, currency = upper(left(p_currency, 3)), subtotal = v_subtotal, discount = v_discount, "discountType" = p_discount_type, "discountValue" = v_safe_discount, "taxRate" = greatest(0, coalesce(p_tax_rate, 0)), "taxAmount" = v_tax, total = v_total, notes = nullif(p_notes, ''), "storeNumber" = nullif(p_store_number, ''), "shippingAddress" = nullif(p_shipping_address, ''), "sentAt" = case when p_status = 'sent' then timezone('utc', now()) else null end, "paidAt" = case when p_status = 'paid' then timezone('utc', now()) else null end where id = p_invoice_id and "userId" = v_user_id;
  delete from public."invoiceItems" where "invoiceId" = p_invoice_id;
  insert into public."invoiceItems" ("invoiceId", "catalogItemId", description, quantity, "unitPrice", "discountType", "discountValue", discount, subtotal, position)
  select p_invoice_id, nullif(item ->> 'catalogItemId', '')::integer, item ->> 'description', quantity, unit_price, discount_type, discount_value, line_discount, gross - line_discount, ordinality - 1
  from jsonb_array_elements(p_items) with ordinality as entry(item, ordinality)
  cross join lateral (select greatest(1, (item ->> 'quantity')::integer) as quantity, greatest(0, (item ->> 'unitPrice')::integer) as unit_price, coalesce(item ->> 'discountType', 'none') as discount_type, greatest(0, coalesce((item ->> 'discountValue')::integer, 0)) as discount_value) normalized
  cross join lateral (select quantity * unit_price as gross, case discount_type when 'percentage' then least(round((quantity * unit_price) * discount_value / 100.0)::integer, quantity * unit_price) when 'amount' then least(discount_value * quantity, quantity * unit_price) else 0 end as line_discount) calculated;
  if v_previous_status <> p_status then insert into public."invoiceActivities" ("userId", "invoiceId", action, description) values (v_user_id, p_invoice_id, 'status_changed', format('Status invoice diubah menjadi %s.', p_status)); end if;
  insert into public."invoiceActivities" ("userId", "invoiceId", action, description) values (v_user_id, p_invoice_id, 'updated', 'Invoice diperbarui.');
  return p_invoice_id;
end;
$$;

create or replace function public.create_bulk_invoices_atomic(p_source_invoice_id integer, p_store_numbers text[], p_shipping_address text, p_invoice_date timestamptz, p_due_date timestamptz)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_user_id integer := public.current_faktur_user_id(); v_source public.invoices%rowtype; v_items jsonb; v_summary_items jsonb; v_batch_id text := left(replace(gen_random_uuid()::text, '-', ''), 16); v_ids integer[] := '{}'; v_id integer; v_summary_id integer; v_store text; v_format text; v_candidate text; v_seq integer := 1; v_year text := extract(year from p_invoice_date)::text; v_count integer := cardinality(p_store_numbers);
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  if v_count is null or v_count < 1 or v_count > 100 or exists (select 1 from unnest(p_store_numbers) value group by value having count(*) > 1) then raise exception 'Nomor toko tidak valid.'; end if;
  select * into v_source from public.invoices where id = p_source_invoice_id and "userId" = v_user_id;
  if v_source.id is null then raise exception 'Invoice sumber tidak ditemukan.'; end if;
  select "invoiceNumberFormat" into v_format from public."businessProfiles" where "userId" = v_user_id;
  v_format := coalesce(v_format, 'INV-{YYYY}-{SEQ}');
  select coalesce(jsonb_agg(jsonb_build_object('catalogItemId', "catalogItemId", 'description', description, 'quantity', quantity, 'unitPrice', "unitPrice", 'discountType', "discountType", 'discountValue', "discountValue") order by position), '[]'::jsonb) into v_items from public."invoiceItems" where "invoiceId" = v_source.id;
  for v_store in select value from unnest(p_store_numbers) value loop
    loop
      v_candidate := replace(replace(v_format, '{YYYY}', v_year), '{SEQ}', lpad(v_seq::text, 3, '0'));
      exit when not exists (select 1 from public.invoices where "userId" = v_user_id and "invoiceNumber" = v_candidate);
      v_seq := v_seq + 1;
    end loop;
    select public.create_invoice_atomic(v_source."clientId", v_candidate, p_invoice_date, p_due_date, 'draft', v_source.currency, v_source."discountType", v_source."discountValue", v_source."taxRate", v_source.notes, v_store, p_shipping_address, v_items) into v_id;
    update public.invoices set "bulkBatchId" = v_batch_id where id = v_id;
    v_ids := array_append(v_ids, v_id); v_seq := v_seq + 1;
  end loop;
  select coalesce(jsonb_agg(jsonb_build_object('catalogItemId', "catalogItemId", 'description', description, 'quantity', quantity * v_count, 'unitPrice', "unitPrice", 'discountType', "discountType", 'discountValue', "discountValue") order by position), '[]'::jsonb) into v_summary_items from public."invoiceItems" where "invoiceId" = v_source.id;
  loop
    v_candidate := replace(replace(v_format, '{YYYY}', v_year), '{SEQ}', lpad(v_seq::text, 3, '0'));
    exit when not exists (select 1 from public.invoices where "userId" = v_user_id and "invoiceNumber" = v_candidate);
    v_seq := v_seq + 1;
  end loop;
  select public.create_invoice_atomic(v_source."clientId", v_candidate, p_invoice_date, p_due_date, 'draft', v_source.currency, v_source."discountType", case when v_source."discountType" = 'amount' then v_source."discountValue" * v_count else v_source."discountValue" end, v_source."taxRate", concat_ws(E'\n', v_source.notes, format('Rekap %s toko dalam batch %s.', v_count, upper(left(v_batch_id, 8)))), format('REKAP %s TOKO', v_count), p_shipping_address, v_summary_items) into v_summary_id;
  update public.invoices set "bulkBatchId" = v_batch_id, "isBatchSummary" = true where id = v_summary_id;
  return jsonb_build_object('batchId', v_batch_id, 'storeInvoiceIds', to_jsonb(v_ids), 'summaryInvoiceId', v_summary_id);
end;
$$;

commit;
