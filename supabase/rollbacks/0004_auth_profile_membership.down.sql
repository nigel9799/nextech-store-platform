begin;
drop trigger if exists auth_user_profile_created on auth.users;
drop function if exists private.handle_new_auth_user();
alter table public.tenant_users drop constraint if exists tenant_users_deactivation_consistent;
alter table public.tenant_users drop column if exists deactivated_at;
commit;
