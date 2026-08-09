begin;

create function private.is_tenant_member(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users membership
    where membership.tenant_id = target_tenant_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

create function private.has_tenant_role(target_tenant_id uuid, allowed_roles public.tenant_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_users membership
    where membership.tenant_id = target_tenant_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.role = any (allowed_roles)
  );
$$;

revoke all on function private.is_tenant_member(uuid) from public, anon;
revoke all on function private.has_tenant_role(uuid, public.tenant_role[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_tenant_member(uuid) to authenticated;
grant execute on function private.has_tenant_role(uuid, public.tenant_role[]) to authenticated;

create policy tenants_member_select
on public.tenants for select
to authenticated
using ((select private.is_tenant_member(id)));

create policy tenant_domains_member_select
on public.tenant_domains for select
to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy profiles_self_select
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_self_update
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy tenant_users_member_or_owner_select
on public.tenant_users for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_tenant_role(tenant_id, array['owner']::public.tenant_role[]))
);

create policy audit_logs_owner_admin_select
on public.audit_logs for select
to authenticated
using (
  (select private.has_tenant_role(
    tenant_id,
    array['owner', 'administrator']::public.tenant_role[]
  ))
);

comment on function private.is_tenant_member(uuid) is 'RLS-only active tenant membership check. Not exposed through the Data API.';
comment on function private.has_tenant_role(uuid, public.tenant_role[]) is 'RLS-only active tenant role check using auth.uid().';

commit;
