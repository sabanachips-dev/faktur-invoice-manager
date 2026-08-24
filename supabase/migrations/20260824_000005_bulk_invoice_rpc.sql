begin;

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
  select coalesce(jsonb_agg(jsonb_build_object('catalogItemId', "catalogItemId", 'description', description, 'quantity', quantity, 'unitPrice', "unitPrice") order by position), '[]'::jsonb) into v_items from public."invoiceItems" where "invoiceId" = v_source.id;
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
  select coalesce(jsonb_agg(jsonb_build_object('catalogItemId', "catalogItemId", 'description', description, 'quantity', quantity * v_count, 'unitPrice', "unitPrice") order by position), '[]'::jsonb) into v_summary_items from public."invoiceItems" where "invoiceId" = v_source.id;
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

revoke execute on function public.create_bulk_invoices_atomic(integer, text[], text, timestamptz, timestamptz) from public, anon;
grant execute on function public.create_bulk_invoices_atomic(integer, text[], text, timestamptz, timestamptz) to authenticated;
commit;
