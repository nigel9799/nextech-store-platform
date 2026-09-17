begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

select ok(to_regclass('public.site_settings') is not null, 'site settings table exists');
select ok(to_regclass('public.product_categories') is not null, 'category table exists');
select ok(to_regclass('public.products') is not null, 'products table exists');
select ok(to_regclass('public.product_images') is not null, 'product images table exists');
select ok(to_regclass('public.content_sections') is not null, 'content sections table exists');
select ok(to_regclass('public.navigation_items') is not null, 'navigation table exists');
select ok(to_regclass('public.legal_pages') is not null, 'legal pages table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.products'::regclass), 'products RLS enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.products'::regclass), 'products RLS forced');
select ok(not has_table_privilege('anon', 'public.products', 'SELECT'), 'anonymous product reads are denied');
select ok(has_table_privilege('authenticated', 'public.products', 'INSERT'), 'authenticated catalogue writes are granted for policy checks');

insert into auth.users (id, aud, role, email) values
 ('50000000-0000-0000-0000-000000000001','authenticated','authenticated','storefront-one@example.test'),
 ('50000000-0000-0000-0000-000000000002','authenticated','authenticated','storefront-two@example.test');
insert into public.tenants (id, slug, business_name, status) values
 ('60000000-0000-0000-0000-000000000001','storefront-one','Storefront One','active'),
 ('60000000-0000-0000-0000-000000000002','storefront-two','Storefront Two','active');
insert into public.tenant_users (tenant_id,user_id,role,status,joined_at) values
 ('60000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','owner','active',now()),
 ('60000000-0000-0000-0000-000000000002','50000000-0000-0000-0000-000000000002','owner','active',now());
insert into public.product_categories (id,tenant_id,slug,name,display_order) values
 ('70000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','prebuilt-pcs','Prebuilt PCs',1),
 ('70000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','prebuilt-pcs','Prebuilt PCs',1);
insert into public.products (id,tenant_id,category_id,slug,name,sku,short_spec,price_minor,currency_code,status,display_order) values
 ('80000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001','one-pc','One PC','ONE-001','Test system',100,'EUR','live',1),
 ('80000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000002','two-pc','Two PC','TWO-001','Test system',100,'EUR','live',1);

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"50000000-0000-0000-0000-000000000001","role":"authenticated"}',true);
select is((select count(*)::integer from public.products),1,'member reads only same-tenant products');
select is((select count(*)::integer from public.products where tenant_id='60000000-0000-0000-0000-000000000002'),0,'cross-tenant products are isolated');
select is((select count(*)::integer from public.product_categories),1,'member reads only same-tenant categories');
select is((select count(*)::integer from public.site_settings),0,'settings are tenant-scoped');
reset role;
select * from finish();
rollback;
