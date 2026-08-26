begin;

create function private.is_aal2()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal') = 'aal2', false);
$$;

revoke all on function private.is_aal2() from public, anon;
grant execute on function private.is_aal2() to authenticated;

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

comment on function private.is_aal2() is
  'Restrictive RLS gate requiring a verified second authentication factor.';

commit;
