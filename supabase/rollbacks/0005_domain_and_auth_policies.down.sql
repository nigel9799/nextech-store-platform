begin;
drop policy if exists audit_logs_aal2_restriction on public.audit_logs;
drop policy if exists tenant_users_aal2_restriction on public.tenant_users;
drop policy if exists profiles_aal2_restriction on public.profiles;
drop policy if exists tenant_domains_aal2_restriction on public.tenant_domains;
drop policy if exists tenants_aal2_restriction on public.tenants;
drop policy if exists tenant_users_owner_insert on public.tenant_users;
drop policy if exists tenant_users_owner_update on public.tenant_users;
drop policy if exists tenant_users_self_or_owner_select on public.tenant_users;
drop policy if exists audit_logs_owner_admin_select on public.audit_logs;
drop policy if exists profiles_self_update on public.profiles;
drop policy if exists profiles_self_select on public.profiles;
drop policy if exists tenant_domains_member_select on public.tenant_domains;
drop policy if exists tenants_member_select on public.tenants;
revoke insert, update on public.tenant_users from authenticated;
revoke select, insert, update, delete
  on public.tenants, public.tenant_domains, public.profiles, public.tenant_users, public.audit_logs
  from service_role;
revoke usage, select on sequence public.audit_logs_id_seq from service_role;
drop function if exists private.normalize_hostname(text);
drop function if exists private.is_aal2();

create policy tenants_member_select on public.tenants for select to authenticated
using ((select private.is_tenant_member(id)));
create policy tenant_domains_member_select on public.tenant_domains for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy profiles_self_select on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy tenant_users_member_or_owner_select on public.tenant_users for select to authenticated
using (user_id = (select auth.uid()) or (select private.has_tenant_role(tenant_id, array['owner']::public.tenant_role[])));
create policy audit_logs_owner_admin_select on public.audit_logs for select to authenticated
using ((select private.has_tenant_role(tenant_id, array['owner', 'administrator']::public.tenant_role[])));
commit;
