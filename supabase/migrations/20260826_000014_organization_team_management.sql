begin;

drop policy if exists "organizations_select_member" on public.organizations;
drop policy if exists "organization_members_select_org" on public."organizationMembers";

create policy "organizations_select_member" on public.organizations for select
  using (exists (
    select 1 from public."organizationMembers" m
    where m."organizationId" = organizations.id
      and m."userId" = public.current_faktur_user_id()
  ));

create policy "organization_members_select_visible" on public."organizationMembers" for select
  using (
    "userId" = public.current_faktur_user_id()
    or "organizationId" = public.current_faktur_organization_id()
  );

create policy "users_select_active_organization" on public.users for select
  using (exists (
    select 1 from public."organizationMembers" m
    where m."organizationId" = public.current_faktur_organization_id()
      and m."userId" = users.id
  ));

create or replace function public.accept_organization_invitation(p_token_hash char(64))
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id integer := public.current_faktur_user_id();
  v_user_email text;
  v_invitation public."organizationInvitations"%rowtype;
begin
  if v_user_id is null then raise exception 'Sesi tidak valid.'; end if;
  select email into v_user_email from public.users where id = v_user_id;
  if v_user_email is null then raise exception 'Profil pengguna tidak ditemukan.'; end if;

  select * into v_invitation
  from public."organizationInvitations"
  where "tokenHash" = p_token_hash
    and "acceptedAt" is null
    and "expiresAt" > timezone('utc', now())
  for update;

  if v_invitation.id is null then raise exception 'Undangan tidak valid atau sudah kedaluwarsa.'; end if;
  if lower(v_invitation.email) <> lower(v_user_email) then raise exception 'Undangan ini dibuat untuk email lain.'; end if;

  insert into public."organizationMembers" ("organizationId", "userId", role)
  values (v_invitation."organizationId", v_user_id, v_invitation.role)
  on conflict ("organizationId", "userId") do nothing;

  update public."organizationInvitations"
  set "acceptedAt" = timezone('utc', now())
  where id = v_invitation.id;

  insert into public."userActiveOrganizations" ("userId", "organizationId")
  values (v_user_id, v_invitation."organizationId")
  on conflict ("userId") do update
    set "organizationId" = excluded."organizationId", "updatedAt" = timezone('utc', now());

  return jsonb_build_object('organizationId', v_invitation."organizationId", 'role', v_invitation.role);
end;
$$;

revoke execute on function public.accept_organization_invitation(char(64)) from public, anon;
grant execute on function public.accept_organization_invitation(char(64)) to authenticated;

commit;
