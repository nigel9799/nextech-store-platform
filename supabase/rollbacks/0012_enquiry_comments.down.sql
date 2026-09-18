begin;
drop table if exists public.enquiry_comments;
alter table public.enquiries drop constraint if exists enquiries_id_tenant_unique;
commit;
