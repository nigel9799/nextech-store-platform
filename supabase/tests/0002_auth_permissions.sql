begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

select ok(to_regprocedure('private.is_aal2()') is not null, 'AAL2 helper exists');
select ok(to_regprocedure('private.normalize_hostname(text)') is not null, 'hostname helper exists');
select ok(exists(select 1 from pg_trigger where tgname = 'auth_user_profile_created'), 'Auth profile trigger exists');
select ok(exists(select 1 from pg_trigger where tgname = 'tenant_users_keep_owner'), 'last owner trigger exists');
select ok(exists(select 1 from pg_trigger where tgname = 'tenant_users_audit'), 'membership audit trigger exists');

insert into auth.users (id, aud, role, email)
values
  ('30000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner-one@example.test'),
  ('30000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'owner-two@example.test'),
  ('30000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'catalogue@example.test'),
  ('30000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'other@example.test');

select is((select count(*)::integer from public.profiles where id::text like '30000000%'), 4, 'Auth users receive profiles');

insert into public.tenants (id, slug, business_name, status)
values
  ('40000000-0000-0000-0000-000000000001', 'auth-tenant-one', 'Auth Tenant One', 'active'),
  ('40000000-0000-0000-0000-000000000002', 'auth-tenant-two', 'Auth Tenant Two', 'active');

insert into public.tenant_users (tenant_id, user_id, role, status, joined_at)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'owner', 'active', now()),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'owner', 'active', now()),
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'catalogue_manager', 'active', now()),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'owner', 'active', now());

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal1"}', true);
select is((select count(*)::integer from public.tenants), 0, 'AAL1 cannot read admin tenant data');
update public.tenant_users set role = 'administrator' where user_id = '30000000-0000-0000-0000-000000000003';
reset role;
select is((select role::text from public.tenant_users where user_id = '30000000-0000-0000-0000-000000000003'), 'catalogue_manager', 'AAL1 cannot mutate memberships');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000001","role":"authenticated","aal":"aal2"}', true);
select is((select count(*)::integer from public.tenants), 1, 'AAL2 member sees own tenant');
select is((select count(*)::integer from public.tenants where id = '40000000-0000-0000-0000-000000000002'), 0, 'AAL2 member cannot see another tenant');
select is((select count(*)::integer from public.tenant_users), 3, 'owner sees only own tenant memberships');
select lives_ok($$update public.tenant_users set role = 'administrator' where user_id = '30000000-0000-0000-0000-000000000003'$$, 'owner can change a staff role');

select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}', true);
update public.tenant_users set status = 'suspended', deactivated_at = now() where user_id = '30000000-0000-0000-0000-000000000001';
reset role;
select is((select status::text from public.tenant_users where user_id = '30000000-0000-0000-0000-000000000001'), 'active', 'staff cannot change memberships');

update public.tenant_users set status = 'suspended', deactivated_at = now()
where user_id = '30000000-0000-0000-0000-000000000003';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"30000000-0000-0000-0000-000000000003","role":"authenticated","aal":"aal2"}', true);
select ok(not private.is_tenant_member('40000000-0000-0000-0000-000000000001'), 'suspended membership is revoked immediately');
select is((select count(*)::integer from public.tenants), 0, 'suspended member loses tenant reads immediately');

reset role;
update public.tenant_users set status = 'suspended', deactivated_at = now()
where user_id = '30000000-0000-0000-0000-000000000002';
select throws_ok(
  $$update public.tenant_users set status = 'suspended', deactivated_at = now() where user_id = '30000000-0000-0000-0000-000000000001'$$,
  '23514',
  'A tenant must retain at least one active owner.',
  'last active owner cannot be suspended'
);

select is(private.normalize_hostname('Admin.Example.Test.:443'), 'admin.example.test', 'database hostname normalization is deterministic');
select ok(not has_table_privilege('anon', 'public.tenant_users', 'SELECT'), 'anonymous users cannot read memberships');
select ok((select count(*) > 0 from public.audit_logs where entity_type = 'tenant_users'), 'membership changes are audited');

select * from finish();
rollback;
