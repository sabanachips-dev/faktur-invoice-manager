begin;

create type public.fulfillment_status as enum ('pending_payment', 'paid', 'processing', 'shipped', 'completed', 'cancelled');

alter table public.invoices
  add column "fulfillmentStatus" public.fulfillment_status not null default 'pending_payment',
  add column "courierName" varchar(100),
  add column "trackingNumber" varchar(120),
  add column "shippedAt" timestamptz;

create or replace function public.update_invoice_fulfillment(
  p_invoice_id integer,
  p_fulfillment_status public.fulfillment_status,
  p_courier_name text,
  p_tracking_number text
)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id integer := public.current_faktur_user_id();
  v_existing public.invoices%rowtype;
  v_courier text := nullif(trim(coalesce(p_courier_name, '')), '');
  v_tracking text := nullif(trim(coalesce(p_tracking_number, '')), '');
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  select * into v_existing from public.invoices where id = p_invoice_id and "userId" = v_user_id;
  if v_existing.id is null then raise exception 'Invoice tidak ditemukan.'; end if;
  if p_fulfillment_status in ('shipped', 'completed') and (v_courier is null or v_tracking is null) then
    raise exception 'Kurir dan nomor resi wajib diisi untuk pesanan yang dikirim atau selesai.';
  end if;

  update public.invoices
  set "fulfillmentStatus" = p_fulfillment_status,
      "courierName" = v_courier,
      "trackingNumber" = v_tracking,
      "shippedAt" = case
        when p_fulfillment_status = 'shipped' and v_existing."shippedAt" is null then timezone('utc', now())
        when p_fulfillment_status in ('pending_payment', 'paid', 'processing', 'cancelled') then null
        else v_existing."shippedAt"
      end
  where id = p_invoice_id and "userId" = v_user_id;

  insert into public."invoiceActivities" ("userId", "invoiceId", action, description)
  values (v_user_id, p_invoice_id, 'fulfillment_updated', format('Status pesanan diubah menjadi %s.', p_fulfillment_status));
  return p_invoice_id;
end;
$$;

revoke execute on function public.update_invoice_fulfillment(integer, public.fulfillment_status, text, text) from public, anon;
grant execute on function public.update_invoice_fulfillment(integer, public.fulfillment_status, text, text) to authenticated;

commit;
