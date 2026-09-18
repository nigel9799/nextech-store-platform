begin;

alter table public.enquiries
  add constraint enquiries_id_tenant_unique unique (id, tenant_id);

create table public.enquiry_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  enquiry_id uuid not null,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  author_name text not null check (char_length(author_name) between 1 and 254),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint enquiry_comments_enquiry_tenant_fk
    foreign key (enquiry_id, tenant_id)
    references public.enquiries(id, tenant_id)
    on delete cascade
);

create index enquiry_comments_enquiry_created_idx
  on public.enquiry_comments (enquiry_id, created_at);

alter table public.enquiry_comments enable row level security;
alter table public.enquiry_comments force row level security;

revoke all on public.enquiry_comments from anon, authenticated;
grant select, insert on public.enquiry_comments to authenticated;
grant select, insert, update, delete on public.enquiry_comments to service_role;

create policy enquiry_comments_agent_select
on public.enquiry_comments for select to authenticated
using ((select private.has_tenant_role(
  tenant_id,
  array['owner', 'administrator', 'enquiries_agent']::public.tenant_role[]
)));

create policy enquiry_comments_agent_insert
on public.enquiry_comments for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  and (select private.has_tenant_role(
    tenant_id,
    array['owner', 'administrator', 'enquiries_agent']::public.tenant_role[]
  ))
);

comment on table public.enquiry_comments is
  'Immutable tenant-scoped internal notes attached to customer enquiries.';

commit;
