begin;

update public.products set price_minor = 0 where price_minor is null;

alter table public.products
  drop constraint if exists products_old_price_minor_check;

alter table public.products
  alter column price_minor set not null,
  add constraint products_old_price_minor_check
    check (old_price_minor is null or old_price_minor >= price_minor),
  drop column description;

commit;
