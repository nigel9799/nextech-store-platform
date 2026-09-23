begin;

alter table public.products drop column if exists show_in_gallery;

commit;
