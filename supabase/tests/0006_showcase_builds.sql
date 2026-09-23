begin;
select plan(4);

select has_column('public', 'products', 'description', 'build description exists');
select col_is_null('public', 'products', 'price_minor', 'build price is optional');

insert into public.tenants (id, slug, business_name, status) values
  ('60000000-0000-0000-0000-000000000006', 'showcase-builds', 'Showcase Builds', 'active');
insert into public.product_categories (id, tenant_id, slug, name, display_order) values
  ('70000000-0000-0000-0000-000000000006', '60000000-0000-0000-0000-000000000006', 'completed-builds', 'Completed Builds', 1);
insert into public.products (
  tenant_id, category_id, slug, name, sku, short_spec, description,
  price_minor, currency_code, status, display_order
)
values (
  '60000000-0000-0000-0000-000000000006',
  '70000000-0000-0000-0000-000000000006',
  'showcase-no-price', 'Build 1', 'BUILD-001',
  'Completed gaming PC showcase.', 'A detailed completed-build description.',
  null, 'EUR', 'draft', 99
);

select is(
  (select price_minor from public.products where sku = 'BUILD-001'),
  null::integer,
  'a completed build saves without a price'
);
select is(
  (select description from public.products where sku = 'BUILD-001'),
  'A detailed completed-build description.',
  'a completed build keeps its long description'
);

select * from finish();
rollback;
