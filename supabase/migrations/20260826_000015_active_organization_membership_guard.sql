begin;

create or replace function public.current_faktur_organization_id()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select active."organizationId"
      from public."userActiveOrganizations" active
      where active."userId" = public.current_faktur_user_id()
        and exists (
          select 1 from public."organizationMembers" member
          where member."organizationId" = active."organizationId"
            and member."userId" = active."userId"
        )
    ),
    (
      select member."organizationId"
      from public."organizationMembers" member
      where member."userId" = public.current_faktur_user_id()
      order by member."createdAt" asc
      limit 1
    )
  );
$$;

create or replace function public.repair_active_organization_after_membership_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_organization_id integer;
begin
  if exists (
    select 1 from public."userActiveOrganizations" active
    where active."userId" = old."userId"
      and active."organizationId" = old."organizationId"
  ) then
    select member."organizationId" into v_next_organization_id
    from public."organizationMembers" member
    where member."userId" = old."userId"
    order by member."createdAt" asc
    limit 1;

    if v_next_organization_id is null then
      delete from public."userActiveOrganizations" where "userId" = old."userId";
    else
      update public."userActiveOrganizations"
      set "organizationId" = v_next_organization_id, "updatedAt" = timezone('utc', now())
      where "userId" = old."userId";
    end if;
  end if;
  return old;
end;
$$;

drop trigger if exists repair_active_organization_after_membership_deleted on public."organizationMembers";
create trigger repair_active_organization_after_membership_deleted
  after delete on public."organizationMembers"
  for each row execute function public.repair_active_organization_after_membership_deleted();

revoke execute on function public.repair_active_organization_after_membership_deleted() from public, anon, authenticated;

commit;
