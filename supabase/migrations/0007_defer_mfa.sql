begin;

-- MFA is intentionally deferred during development. Tenant membership, role,
-- and cross-tenant RLS policies remain the authorization boundary.
drop policy if exists audit_logs_aal2_restriction on public.audit_logs;
drop policy if exists tenant_users_aal2_restriction on public.tenant_users;
drop policy if exists profiles_aal2_restriction on public.profiles;
drop policy if exists tenant_domains_aal2_restriction on public.tenant_domains;
drop policy if exists tenants_aal2_restriction on public.tenants;

revoke execute on function private.is_aal2() from authenticated;
drop function if exists private.is_aal2();

commit;
