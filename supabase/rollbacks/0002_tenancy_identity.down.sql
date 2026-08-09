begin;
drop table if exists public.audit_logs;
drop table if exists public.tenant_users;
drop table if exists public.profiles;
drop table if exists public.tenant_domains;
drop table if exists public.tenants;
drop function if exists private.set_updated_at();
commit;
