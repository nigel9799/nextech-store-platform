begin;

alter table public.tenant_users
  add column deactivated_at timestamptz,
  add constraint tenant_users_deactivation_consistent check (
    (status = 'suspended' and deactivated_at is not null)
    or (status <> 'suspended' and deactivated_at is null)
  );

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger auth_user_profile_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

insert into public.profiles (id, display_name)
select
  id,
  nullif(trim(coalesce(raw_user_meta_data ->> 'display_name', '')), '')
from auth.users
on conflict (id) do nothing;

comment on function private.handle_new_auth_user() is
  'Creates a tenant-neutral profile for invitation-created Supabase Auth users.';

commit;
