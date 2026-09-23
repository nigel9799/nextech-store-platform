begin;

alter table public.products
  add column show_in_gallery boolean not null default true;

comment on column public.products.show_in_gallery is
  'Controls whether the completed build images appear in the public gallery.';

commit;
