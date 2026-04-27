-- ============================================================
-- Proposal Requests: ownership and CRM reporting support
-- Tracks who created each lead and who owns the commercial follow-up.
-- ============================================================

alter table public.proposal_requests
  add column if not exists created_by_type text not null default 'system',
  add column if not exists created_by_user_id uuid,
  add column if not exists created_by_name text not null default 'Sistema Neural Hub',
  add column if not exists created_by_email text not null default 'sistema@neuralhub.ia.br',
  add column if not exists owner_type text not null default 'system',
  add column if not exists owner_user_id uuid,
  add column if not exists owner_name text not null default 'Sistema Neural Hub',
  add column if not exists owner_email text not null default 'sistema@neuralhub.ia.br';

create index if not exists idx_proposal_requests_owner_user_id
  on public.proposal_requests (owner_user_id);

create index if not exists idx_proposal_requests_owner_type
  on public.proposal_requests (owner_type);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'proposal_requests_created_by_type_check'
      and conrelid = 'public.proposal_requests'::regclass
  ) then
    alter table public.proposal_requests
      add constraint proposal_requests_created_by_type_check
      check (created_by_type in ('system', 'user'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'proposal_requests_owner_type_check'
      and conrelid = 'public.proposal_requests'::regclass
  ) then
    alter table public.proposal_requests
      add constraint proposal_requests_owner_type_check
      check (owner_type in ('system', 'user'));
  end if;
end $$;

update public.proposal_requests
set
  created_by_type = coalesce(created_by_type, 'system'),
  created_by_name = coalesce(nullif(created_by_name, ''), 'Sistema Neural Hub'),
  created_by_email = coalesce(nullif(created_by_email, ''), 'sistema@neuralhub.ia.br'),
  owner_type = coalesce(owner_type, 'system'),
  owner_name = coalesce(nullif(owner_name, ''), 'Sistema Neural Hub'),
  owner_email = coalesce(nullif(owner_email, ''), 'sistema@neuralhub.ia.br')
where true;

create or replace function public.proposal_requests_current_crm_user()
returns table(user_id uuid, email text, full_name text, role text)
language sql
security definer
set search_path = public, auth
as $$
  select
    auth.uid() as user_id,
    u.email::text as email,
    coalesce(
      p.full_name,
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      u.email
    )::text as full_name,
    (u.raw_user_meta_data ->> 'role')::text as role
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where u.id = auth.uid()
    and (u.raw_user_meta_data ->> 'role') in ('admin', 'comercial')
  limit 1;
$$;

create or replace function public.list_crm_users()
returns table(user_id uuid, email text, full_name text, role text)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email::text as email,
    coalesce(
      p.full_name,
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name',
      u.email
    )::text as full_name,
    (u.raw_user_meta_data ->> 'role')::text as role
  from auth.users u
  left join public.profiles p on p.user_id = u.id
  where (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial')
    and (u.raw_user_meta_data ->> 'role') in ('admin', 'comercial')
  order by full_name asc, email asc;
$$;

create or replace function public.normalize_proposal_request_ownership()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_row record;
begin
  if new.source = 'crm-manual' then
    select * into current_user_row
    from public.proposal_requests_current_crm_user()
    limit 1;
  end if;

  if current_user_row.user_id is not null then
    new.created_by_type := 'user';
    new.created_by_user_id := current_user_row.user_id;
    new.created_by_name := current_user_row.full_name;
    new.created_by_email := current_user_row.email;
    new.owner_type := 'user';
    new.owner_user_id := current_user_row.user_id;
    new.owner_name := current_user_row.full_name;
    new.owner_email := current_user_row.email;
  else
    new.created_by_type := 'system';
    new.created_by_user_id := null;
    new.created_by_name := 'Sistema Neural Hub';
    new.created_by_email := 'sistema@neuralhub.ia.br';
    new.owner_type := 'system';
    new.owner_user_id := null;
    new.owner_name := 'Sistema Neural Hub';
    new.owner_email := 'sistema@neuralhub.ia.br';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proposal_requests_ownership_insert on public.proposal_requests;
create trigger trg_proposal_requests_ownership_insert
  before insert on public.proposal_requests
  for each row execute function public.normalize_proposal_request_ownership();

create or replace function public.guard_proposal_request_owner_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if (
    new.owner_type is distinct from old.owner_type
    or new.owner_user_id is distinct from old.owner_user_id
    or new.owner_name is distinct from old.owner_name
    or new.owner_email is distinct from old.owner_email
    or new.created_by_type is distinct from old.created_by_type
    or new.created_by_user_id is distinct from old.created_by_user_id
    or new.created_by_name is distinct from old.created_by_name
    or new.created_by_email is distinct from old.created_by_email
  ) and (auth.jwt() -> 'user_metadata' ->> 'role') <> 'admin' then
    raise exception 'Somente administradores podem alterar responsavel ou criador do lead.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proposal_requests_owner_update_guard on public.proposal_requests;
create trigger trg_proposal_requests_owner_update_guard
  before update on public.proposal_requests
  for each row execute function public.guard_proposal_request_owner_update();

grant execute on function public.proposal_requests_current_crm_user() to authenticated;
grant execute on function public.list_crm_users() to authenticated;
