-- ============================================================
-- Proposal Requests: fix ownership trigger unassigned record defect
-- Fixes PostgreSQL error 55000 ("record current_user_row is not assigned yet")
-- when inserting proposal requests with sources other than 'crm-manual'.
-- ============================================================

create or replace function public.normalize_proposal_request_ownership()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  crm_user_id uuid;
  crm_email text;
  crm_full_name text;
begin
  if new.source = 'crm-manual' then
    select user_id, email, full_name
    into crm_user_id, crm_email, crm_full_name
    from public.proposal_requests_current_crm_user()
    limit 1;
  end if;

  if crm_user_id is not null then
    new.created_by_type := 'user';
    new.created_by_user_id := crm_user_id;
    new.created_by_name := coalesce(crm_full_name, 'Usuário CRM');
    new.created_by_email := coalesce(crm_email, 'sistema@neuralhub.ia.br');
    new.owner_type := 'user';
    new.owner_user_id := crm_user_id;
    new.owner_name := coalesce(crm_full_name, 'Usuário CRM');
    new.owner_email := coalesce(crm_email, 'sistema@neuralhub.ia.br');
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
