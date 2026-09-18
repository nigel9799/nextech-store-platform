begin;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  kind text not null check (kind in ('general', 'product', 'cart', 'custom_build', 'order_support')),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (char_length(customer_email) <= 254),
  customer_phone text check (customer_phone is null or char_length(customer_phone) <= 40),
  interest text not null check (char_length(interest) between 2 and 120),
  budget text check (budget is null or char_length(budget) <= 80),
  message text not null check (char_length(message) between 5 and 4000),
  cart_items jsonb not null default '[]'::jsonb check (jsonb_typeof(cart_items) = 'array'),
  estimated_total_minor integer check (estimated_total_minor is null or estimated_total_minor >= 0),
  currency_code text not null default 'EUR' check (currency_code ~ '^[A-Z]{3}$'),
  status public.order_enquiry_status not null default 'new',
  email_delivery_status text not null default 'pending'
    check (email_delivery_status in ('pending', 'sent', 'failed', 'not_configured')),
  email_provider_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index enquiries_tenant_created_idx on public.enquiries (tenant_id, created_at desc);
create index enquiries_tenant_status_idx on public.enquiries (tenant_id, status, created_at desc);

create trigger enquiries_set_updated_at before update on public.enquiries
for each row execute function private.set_updated_at();
create trigger enquiries_audit after update or delete on public.enquiries
for each row execute function private.audit_tenant_change();

alter table public.enquiries enable row level security;
alter table public.enquiries force row level security;

revoke all on public.enquiries from anon, authenticated;
grant select, update on public.enquiries to authenticated;
grant select, insert, update, delete on public.enquiries to service_role;

create policy enquiries_agent_select on public.enquiries for select to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'enquiries_agent']::public.tenant_role[]
)));

create policy enquiries_agent_update on public.enquiries for update to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'enquiries_agent']::public.tenant_role[]
)))
with check ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'enquiries_agent']::public.tenant_role[]
)));

comment on table public.enquiries is
  'Tenant-scoped customer questions, product requests and non-payment cart enquiries.';

commit;
