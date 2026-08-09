begin;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug extensions.citext not null unique,
  status public.tenant_status not null default 'onboarding',
  business_name text not null,
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  locale text not null default 'en-MT',
  timezone_name text not null default 'Europe/Malta',
  pricing_mode public.pricing_mode not null default 'vat_inclusive',
  default_vat_rate_bps integer check (default_vat_rate_bps between 0 and 10000),
  vat_configured_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tenants_vat_configuration_consistent check (
    (default_vat_rate_bps is null and vat_configured_at is null)
    or (default_vat_rate_bps is not null and vat_configured_at is not null)
  )
);

create table public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostname extensions.citext not null unique,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint tenant_domains_normalized_hostname check (
    hostname::text = lower(hostname::text)
    and hostname::text !~ '[:/\\s]'
    and length(hostname::text) between 1 and 253
  )
);

create unique index tenant_domains_one_primary_per_tenant
  on public.tenant_domains (tenant_id)
  where is_primary;
create index tenant_domains_tenant_id_idx on public.tenant_domains (tenant_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_length check (display_name is null or length(display_name) between 1 and 120)
);

create table public.tenant_users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (tenant_id, user_id),
  constraint tenant_users_joined_state check (
    (status = 'active' and joined_at is not null) or status <> 'active'
  )
);

create index tenant_users_user_tenant_idx on public.tenant_users (user_id, tenant_id);
create index tenant_users_tenant_role_idx on public.tenant_users (tenant_id, role) where status = 'active';

create table public.audit_logs (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_metadata jsonb,
  after_metadata jsonb,
  request_id uuid,
  created_at timestamptz not null default timezone('utc', now()),
  constraint audit_logs_action_length check (length(action) between 1 and 100),
  constraint audit_logs_entity_type_length check (length(entity_type) between 1 and 100)
);

create index audit_logs_tenant_created_idx on public.audit_logs (tenant_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (tenant_id, entity_type, entity_id);

create trigger tenants_set_updated_at before update on public.tenants
for each row execute function private.set_updated_at();
create trigger tenant_domains_set_updated_at before update on public.tenant_domains
for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger tenant_users_set_updated_at before update on public.tenant_users
for each row execute function private.set_updated_at();

alter table public.tenants enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_users enable row level security;
alter table public.audit_logs enable row level security;

alter table public.tenants force row level security;
alter table public.tenant_domains force row level security;
alter table public.profiles force row level security;
alter table public.tenant_users force row level security;
alter table public.audit_logs force row level security;

revoke all on public.tenants, public.tenant_domains, public.profiles, public.tenant_users, public.audit_logs from anon, authenticated;
grant select on public.tenants, public.tenant_domains, public.profiles, public.tenant_users, public.audit_logs to authenticated;
grant update (display_name) on public.profiles to authenticated;

comment on table public.profiles is 'Global auth identity profile. Tenant ownership lives in tenant_users.';
comment on table public.audit_logs is 'Append-only redacted audit metadata; application roles receive no direct insert/update/delete grant.';

commit;
