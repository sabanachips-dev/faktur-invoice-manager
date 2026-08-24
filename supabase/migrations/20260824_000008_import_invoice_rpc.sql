begin;

create or replace function public.import_invoices_atomic(p_invoices jsonb)
returns jsonb language plpgsql security invoker set search_path = public as $$
declare
  v_user_id integer := public.current_faktur_user_id(); v_invoice jsonb; v_client_id integer; v_ids integer[] := '{}'; v_invoice_id integer; v_format text; v_candidate text; v_year text; v_seq integer := 1;
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  if jsonb_typeof(p_invoices) <> 'array' or jsonb_array_length(p_invoices) < 1 or jsonb_array_length(p_invoices) > 1000 then raise exception 'Data impor tidak valid.'; end if;
  select "invoiceNumberFormat" into v_format from public."businessProfiles" where "userId" = v_user_id;
  v_format := coalesce(v_format, 'INV-{YYYY}-{SEQ}');
  for v_invoice in select value from jsonb_array_elements(p_invoices) value loop
    if coalesce(v_invoice->>'clientName', '') = '' or jsonb_typeof(v_invoice->'items') <> 'array' or jsonb_array_length(v_invoice->'items') < 1 then raise exception 'Data impor tidak valid.'; end if;
    select id into v_client_id from public.clients where "userId" = v_user_id and ((nullif(v_invoice->>'clientEmail', '') is not null and email = nullif(v_invoice->>'clientEmail', '')) or (name = v_invoice->>'clientName' and coalesce(phone, '') = coalesce(v_invoice->>'clientPhone', '') and coalesce(address, '') = coalesce(v_invoice->>'billingAddress', ''))) order by id limit 1;
    if v_client_id is null then
      insert into public.clients ("userId", name, email, phone, address) values (v_user_id, v_invoice->>'clientName', nullif(v_invoice->>'clientEmail', ''), nullif(v_invoice->>'clientPhone', ''), nullif(v_invoice->>'billingAddress', '')) returning id into v_client_id;
    end if;
    v_year := extract(year from (v_invoice->>'invoiceDate')::timestamptz)::text;
    loop
      v_candidate := replace(replace(v_format, '{YYYY}', v_year), '{SEQ}', lpad(v_seq::text, 3, '0'));
      exit when not exists (select 1 from public.invoices where "userId" = v_user_id and "invoiceNumber" = v_candidate);
      v_seq := v_seq + 1;
    end loop;
    select public.create_invoice_atomic(v_client_id, v_candidate, (v_invoice->>'invoiceDate')::timestamptz, (v_invoice->>'dueDate')::timestamptz, 'draft', coalesce(v_invoice->>'currency', 'IDR'), coalesce((v_invoice->>'discountType')::public.discount_type, 'amount'), greatest(0, coalesce((v_invoice->>'discountValue')::integer, 0)), greatest(0, coalesce((v_invoice->>'taxRate')::integer, 0)), nullif(v_invoice->>'notes', ''), nullif(v_invoice->>'storeNumber', ''), nullif(v_invoice->>'shippingAddress', ''), v_invoice->'items') into v_invoice_id;
    v_ids := array_append(v_ids, v_invoice_id); v_seq := v_seq + 1;
  end loop;
  return to_jsonb(v_ids);
end;
$$;

revoke execute on function public.import_invoices_atomic(jsonb) from public, anon;
grant execute on function public.import_invoices_atomic(jsonb) to authenticated;
commit;
