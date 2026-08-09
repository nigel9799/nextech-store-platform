begin;

create function private.is_aal2()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false);
$$;

create function private.normalize_hostname(input_hostname text)
returns text
language sql
immutable
strict
set search_path = ''
as $$
  select lower(trim(trailing '.' from split_part(trim(input_hostname), ':', 1)));
$$;

revoke all on function private.is_aal2() from public, anon;
revoke all on function private.normalize_hostname(text) from public, anon, authenticated;
grant execute on function private.is_aal2() to authenticated;

drop policy if exists tenants_member_select on public.tenants;
drop policy if exists tenant_domains_member_select on public.tenant_domains;
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists tenant_users_member_or_owner_select on public.tenant_users;
drop policy if exists audit_logs_owner_admin_select on public.audit_logs;

create policy tenants_aal2_restriction
on public.tenants as restrictive for all to authenticated
using ((select private.is_aal2()))
with check ((select private.is_aal2()));
create policy tenant_domains_aal2_restriction
on public.tenant_domains as restrictive for all to authenticated
using ((select private.is_aal2()))
with check ((select private.is_aal2()));
create policy profiles_aal2_restriction
on public.profiles as restrictive for all to authenticated
using ((select private.is_aal2()))
with check ((select private.is_aal2()));
create policy tenant_users_aal2_restriction
on public.tenant_users as restrictive for all to authenticated
using ((select private.is_aal2()))
with check ((select private.is_aal2()));
create policy audit_logs_aal2_restriction
on public.audit_logs as restrictive for all to authenticated
using ((select private.is_aal2()))
with check ((select private.is_aal2()));

create policy tenants_member_select
on public.tenants for select to authenticated
using ((select private.is_tenant_member(id)));

create policy tenant_domains_member_select
on public.tenant_domains for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy profiles_self_select
on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_self_update
on public.profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy tenant_users_self_or_owner_select
on public.tenant_users for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.has_tenant_role(tenant_id, array['owner']::public.tenant_role[]))
);
create policy tenant_users_owner_insert
on public.tenant_users for insert to authenticated
with check (
  (select private.has_tenant_role(tenant_id, array['owner']::public.tenant_role[]))
  and invited_by = (select auth.uid())
);
create policy tenant_users_owner_update
on public.tenant_users for update to authenticated
using ((select private.has_tenant_role(tenant_id, array['owner']::public.tenant_role[])))
with check ((select private.has_tenant_role(tenant_id, array['owner']::public.tenant_role[])));

create policy audit_logs_owner_admin_select
on public.audit_logs for select to authenticated
using (
  (select private.has_tenant_role(
    tenant_id,
    array['owner', 'administrator']::public.tenant_role[]
  ))
);

grant insert (tenant_id, user_id, role, status, invited_by, invited_at)
  on public.tenant_users to authenticated;
grant update (role, status, invited_at, joined_at, deactivated_at)
  on public.tenant_users to authenticated;
grant select, insert, update, delete
  on public.tenants, public.tenant_domains, public.profiles, public.tenant_users, public.audit_logs
  to service_role;
grant usage, select on sequence public.audit_logs_id_seq to service_role;

comment on function private.is_aal2() is
  'Restrictive RLS gate requiring a verified second authentication factor.';
comment on function private.normalize_hostname(text) is
  'Canonical hostname normalization shared by database tests and server resolution.';

commit;
