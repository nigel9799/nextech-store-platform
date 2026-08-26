begin;

-- Milestone 3 public storefront foundation. These tables contain tenant-scoped
-- content and catalogue data; product/category administration is deferred.
create table public.site_settings (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint site_settings_object check (jsonb_typeof(settings) = 'object')
);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  label text not null check (length(label) between 1 and 80),
  href text not null check (href ~ '^(#|/)'),
  display_order integer not null default 0 check (display_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, display_order)
);

create table public.content_sections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  section_key text not null check (length(section_key) between 1 and 80),
  payload jsonb not null default '{}'::jsonb,
  display_order integer not null default 0 check (display_order >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint content_sections_object check (jsonb_typeof(payload) = 'object'),
  unique (tenant_id, section_key)
);

create table public.legal_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind public.legal_kind not null,
  title text not null check (length(title) between 1 and 160),
  body text not null,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, kind)
);

create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 80),
  display_order integer not null default 0 check (display_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug),
  unique (tenant_id, display_order),
  unique (tenant_id, id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  category_id uuid not null,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 160),
  sku text not null check (length(sku) between 1 and 80),
  short_spec text not null check (length(short_spec) between 1 and 240),
  price_minor integer not null check (price_minor >= 0),
  old_price_minor integer check (old_price_minor is null or old_price_minor >= price_minor),
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  status public.product_status not null default 'draft',
  tag text check (tag is null or length(tag) between 1 and 40),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, slug),
  unique (tenant_id, sku),
  unique (tenant_id, id),
  foreign key (tenant_id, category_id)
    references public.product_categories(tenant_id, id) on delete restrict
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  product_id uuid not null,
  storage_path text not null check (length(storage_path) between 1 and 500),
  alt_text text not null check (length(alt_text) between 1 and 240),
  display_order integer not null default 0 check (display_order >= 0),
  is_primary boolean not null default false,
  status public.media_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  foreign key (tenant_id, product_id)
    references public.products(tenant_id, id) on delete cascade
);

create unique index product_images_one_primary
  on public.product_images (product_id)
  where is_primary;
create index navigation_items_tenant_order_idx
  on public.navigation_items (tenant_id, display_order);
create index content_sections_tenant_order_idx
  on public.content_sections (tenant_id, display_order);
create index legal_pages_tenant_kind_idx on public.legal_pages (tenant_id, kind);
create index product_categories_tenant_order_idx
  on public.product_categories (tenant_id, display_order);
create index products_tenant_status_order_idx
  on public.products (tenant_id, status, display_order);
create index product_images_tenant_product_order_idx
  on public.product_images (tenant_id, product_id, display_order);

create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function private.set_updated_at();
create trigger navigation_items_set_updated_at before update on public.navigation_items
for each row execute function private.set_updated_at();
create trigger content_sections_set_updated_at before update on public.content_sections
for each row execute function private.set_updated_at();
create trigger legal_pages_set_updated_at before update on public.legal_pages
for each row execute function private.set_updated_at();
create trigger product_categories_set_updated_at before update on public.product_categories
for each row execute function private.set_updated_at();
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
create trigger product_images_set_updated_at before update on public.product_images
for each row execute function private.set_updated_at();

alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;
alter table public.content_sections enable row level security;
alter table public.legal_pages enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

alter table public.site_settings force row level security;
alter table public.navigation_items force row level security;
alter table public.content_sections force row level security;
alter table public.legal_pages force row level security;
alter table public.product_categories force row level security;
alter table public.products force row level security;
alter table public.product_images force row level security;

revoke all on public.site_settings, public.navigation_items, public.content_sections,
  public.legal_pages, public.product_categories, public.products, public.product_images
  from anon, authenticated;
grant select on public.site_settings, public.navigation_items, public.content_sections,
  public.legal_pages, public.product_categories, public.products, public.product_images
  to authenticated;
grant select, insert, update, delete
  on public.site_settings, public.navigation_items, public.content_sections,
  public.legal_pages, public.product_categories, public.products, public.product_images
  to service_role;

create policy site_settings_member_select
on public.site_settings for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy navigation_items_member_select
on public.navigation_items for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy content_sections_member_select
on public.content_sections for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy legal_pages_member_select
on public.legal_pages for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy product_categories_member_select
on public.product_categories for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy products_member_select
on public.products for select to authenticated
using ((select private.is_tenant_member(tenant_id)));
create policy product_images_member_select
on public.product_images for select to authenticated
using ((select private.is_tenant_member(tenant_id)));

comment on table public.site_settings is 'Tenant-scoped storefront settings; public rendering reads through a server repository.';
comment on table public.products is 'Tenant-scoped catalogue seed and future managed products; prices are VAT-inclusive minor units.';

commit;
