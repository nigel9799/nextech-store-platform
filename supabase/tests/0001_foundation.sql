begin;
create extension if not exists pgtap with schema extensions;

select plan(42);

select ok(to_regnamespace('private') is not null, 'private schema exists');
select ok(to_regclass('public.tenants') is not null, 'tenants table exists');
select ok(to_regclass('public.tenant_domains') is not null, 'tenant_domains table exists');
select ok(to_regclass('public.profiles') is not null, 'profiles table exists');
select ok(to_regclass('public.tenant_users') is not null, 'tenant_users table exists');
select ok(to_regclass('public.audit_logs') is not null, 'audit_logs table exists');

select ok(exists(select 1 from pg_type where typname = 'tenant_role'), 'tenant_role enum exists');
select ok(exists(select 1 from pg_type where typname = 'pricing_mode'), 'pricing_mode enum exists');
select ok(exists(select 1 from pg_type where typname = 'product_status'), 'product_status enum exists');
select ok(exists(select 1 from pg_type where typname = 'contact_field_type'), 'contact_field_type enum exists');
select ok(exists(select 1 from pg_type where typname = 'email_delivery_status'), 'email status enum exists');

select ok((select relrowsecurity from pg_class where oid = 'public.tenants'::regclass), 'tenants RLS enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.tenants'::regclass), 'tenants RLS forced');
select ok((select relrowsecurity from pg_class where oid = 'public.tenant_domains'::regclass), 'tenant_domains RLS enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.tenant_domains'::regclass), 'tenant_domains RLS forced');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS forced');
select ok((select relrowsecurity from pg_class where oid = 'public.tenant_users'::regclass), 'tenant_users RLS enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.tenant_users'::regclass), 'tenant_users RLS forced');
select ok((select relrowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit_logs RLS enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit_logs RLS forced');

select ok(to_regprocedure('private.is_tenant_member(uuid)') is not null, 'membership helper exists');
select ok(to_regprocedure('private.has_tenant_role(uuid,tenant_role[])') is not null, 'role helper exists');
select ok(not has_function_privilege('anon', 'private.is_tenant_member(uuid)', 'EXECUTE'), 'anon cannot execute membership helper');
select ok(has_function_privilege('authenticated', 'private.is_tenant_member(uuid)', 'EXECUTE'), 'authenticated can use membership helper in RLS');

select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='tenants' and policyname='tenants_member_select'), 'tenant select policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='tenant_domains' and policyname='tenant_domains_member_select'), 'domain select policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_self_select'), 'profile select policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='profiles_self_update'), 'profile update policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='tenant_users' and policyname='tenant_users_member_or_owner_select'), 'membership select policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='audit_logs' and policyname='audit_logs_owner_admin_select'), 'audit select policy exists');

select ok(not has_table_privilege('anon', 'public.tenants', 'SELECT'), 'anon cannot read tenants');
select ok(not has_table_privilege('anon', 'public.tenant_users', 'SELECT'), 'anon cannot read memberships');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'), 'authenticated cannot insert audit logs directly');
select ok(not has_table_privilege('authenticated', 'public.tenant_users', 'UPDATE'), 'authenticated cannot update memberships yet');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), 'authenticated may update safe profile column');

insert into auth.users (id, aud, role, email)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@example.test'),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'staff@example.test'),
  ('10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'inactive@example.test');

insert into public.tenants (id, slug, business_name)
values
  ('20000000-0000-0000-0000-000000000001', 'tenant-one', 'Tenant One'),
  ('20000000-0000-0000-0000-000000000002', 'tenant-two', 'Tenant Two');

insert into public.tenant_users (tenant_id, user_id, role, status, joined_at)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner', 'active', now()),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'catalogue_manager', 'active', now()),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'enquiries_agent', 'suspended', null);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select ok(private.is_tenant_member('20000000-0000-0000-0000-000000000001'), 'active member is recognized in own tenant');
select ok(not private.is_tenant_member('20000000-0000-0000-0000-000000000002'), 'member is rejected from another tenant');
select ok(private.has_tenant_role('20000000-0000-0000-0000-000000000001', array['owner']::public.tenant_role[]), 'allowed owner role is recognized');
select ok(not private.has_tenant_role('20000000-0000-0000-0000-000000000001', array['administrator']::public.tenant_role[]), 'wrong role is rejected');

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
select ok(not private.is_tenant_member('20000000-0000-0000-0000-000000000001'), 'suspended member is rejected');
select ok(not private.has_tenant_role('20000000-0000-0000-0000-000000000001', array['enquiries_agent']::public.tenant_role[]), 'suspended role is rejected');
reset role;

select * from finish();
rollback;
