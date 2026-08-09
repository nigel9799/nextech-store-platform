begin;

create function private.protect_last_active_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner'
    and old.status = 'active'
    and (new.role <> 'owner' or new.status <> 'active')
    and not exists (
      select 1 from public.tenant_users other_owner
      where other_owner.tenant_id = old.tenant_id
        and other_owner.id <> old.id
        and other_owner.role = 'owner'
        and other_owner.status = 'active'
    )
  then
    raise exception 'A tenant must retain at least one active owner.'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create function private.audit_tenant_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  record_tenant_id uuid;
  record_id text;
begin
  if tg_op = 'DELETE' then
    record_tenant_id := old.tenant_id;
    record_id := old.id::text;
  else
    record_tenant_id := new.tenant_id;
    record_id := new.id::text;
  end if;

  insert into public.audit_logs (
    tenant_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_metadata,
    after_metadata
  ) values (
    record_tenant_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    record_id,
    case when tg_op in ('UPDATE', 'DELETE') then
      jsonb_build_object(
        'role', to_jsonb(old) -> 'role',
        'status', to_jsonb(old) -> 'status',
        'hostname', to_jsonb(old) -> 'hostname',
        'verified_at', to_jsonb(old) -> 'verified_at'
      )
    end,
    case when tg_op in ('INSERT', 'UPDATE') then
      jsonb_build_object(
        'role', to_jsonb(new) -> 'role',
        'status', to_jsonb(new) -> 'status',
        'hostname', to_jsonb(new) -> 'hostname',
        'verified_at', to_jsonb(new) -> 'verified_at'
      )
    end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger tenant_users_keep_owner
before update of role, status on public.tenant_users
for each row execute function private.protect_last_active_owner();
create trigger tenant_users_audit
after insert or update or delete on public.tenant_users
for each row execute function private.audit_tenant_change();
create trigger tenant_domains_audit
after insert or update or delete on public.tenant_domains
for each row execute function private.audit_tenant_change();

revoke all on function private.protect_last_active_owner() from public, anon, authenticated;
revoke all on function private.audit_tenant_change() from public, anon, authenticated;

commit;
