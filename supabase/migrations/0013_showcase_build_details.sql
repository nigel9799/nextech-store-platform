begin;

alter table public.products
  add column description text
    check (description is null or length(description) <= 5000),
  alter column price_minor drop not null;

alter table public.products
  drop constraint if exists products_old_price_minor_check;

alter table public.products
  add constraint products_old_price_minor_check check (
    old_price_minor is null
    or (price_minor is not null and old_price_minor >= price_minor)
  );

comment on column public.products.description is
  'Optional long-form description and component details for a completed build.';
comment on column public.products.price_minor is
  'Optional showcase price in minor currency units; null hides pricing publicly.';

commit;
