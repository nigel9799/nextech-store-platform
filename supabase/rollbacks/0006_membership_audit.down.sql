begin;
drop trigger if exists tenant_domains_audit on public.tenant_domains;
drop trigger if exists tenant_users_audit on public.tenant_users;
drop trigger if exists tenant_users_keep_owner on public.tenant_users;
drop function if exists private.audit_tenant_change();
drop function if exists private.protect_last_active_owner();
commit;
