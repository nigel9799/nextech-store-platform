begin;

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_product_id uuid,
  storage_path text not null check (length(storage_path) between 1 and 500),
  title text check (title is null or length(title) between 1 and 160),
  alt_text text not null check (length(alt_text) between 1 and 240),
  display_order integer not null default 0 check (display_order >= 0),
  status public.media_status not null default 'published',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, storage_path),
  foreign key (tenant_id, source_product_id)
    references public.products(tenant_id, id) on delete set null (source_product_id)
);

create index gallery_images_tenant_order_idx
  on public.gallery_images (tenant_id, display_order);

create trigger gallery_images_set_updated_at before update on public.gallery_images
for each row execute function private.set_updated_at();

insert into public.gallery_images (
  tenant_id, source_product_id, storage_path, title, alt_text,
  display_order, status
)
select
  image.tenant_id,
  image.product_id,
  image.storage_path,
  product.name,
  image.alt_text,
  product.display_order * 20 + image.display_order,
  image.status
from public.product_images image
join public.products product
  on product.tenant_id = image.tenant_id and product.id = image.product_id
where product.show_in_gallery = true
on conflict (tenant_id, storage_path) do nothing;

alter table public.gallery_images enable row level security;
alter table public.gallery_images force row level security;

revoke all on public.gallery_images from anon, authenticated;
grant select, insert, update, delete on public.gallery_images to authenticated;
grant select, insert, update, delete on public.gallery_images to service_role;

create policy gallery_images_member_select
on public.gallery_images for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

create policy gallery_images_catalogue_insert
on public.gallery_images for insert to authenticated
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy gallery_images_catalogue_update
on public.gallery_images for update to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)))
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

create policy gallery_images_catalogue_delete
on public.gallery_images for delete to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'catalogue_manager']::public.tenant_role[]
)));

comment on table public.gallery_images is
  'Standalone public gallery media, optionally copied from a completed build.';

commit;
