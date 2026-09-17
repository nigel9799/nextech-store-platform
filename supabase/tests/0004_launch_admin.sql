begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table_privilege('authenticated', 'public.products', 'INSERT'), 'authenticated receives product insert grant';
select has_table_privilege('authenticated', 'public.product_categories', 'UPDATE'), 'authenticated receives category update grant';
select has_table_privilege('authenticated', 'public.product_images', 'DELETE'), 'authenticated receives product image delete grant';
select has_table_privilege('authenticated', 'public.site_settings', 'UPDATE'), 'authenticated receives settings update grant';

select policies_are('public', 'products', array[
  'products_catalogue_delete', 'products_catalogue_insert',
  'products_catalogue_update', 'products_member_select'
], 'product policies are complete');
select policies_are('public', 'product_categories', array[
  'product_categories_catalogue_delete', 'product_categories_catalogue_insert',
  'product_categories_catalogue_update', 'product_categories_member_select'
], 'category policies are complete');
select policies_are('public', 'product_images', array[
  'product_images_catalogue_delete', 'product_images_catalogue_insert',
  'product_images_catalogue_update', 'product_images_member_select'
], 'product image policies are complete');
select policies_are('public', 'site_settings', array[
  'site_settings_member_select', 'site_settings_website_insert',
  'site_settings_website_update'
], 'settings policies are complete');

select has_trigger('public', 'products', 'products_audit', 'products are audited');
select has_trigger('public', 'product_categories', 'product_categories_audit', 'categories are audited');
select ok((select relrowsecurity from pg_class where oid = 'public.products'::regclass), 'product RLS remains enabled');
select ok((select relforcerowsecurity from pg_class where oid = 'public.products'::regclass), 'product RLS remains forced');

select * from finish();
rollback;
