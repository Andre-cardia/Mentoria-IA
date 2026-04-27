-- ============================================================
-- Proposal Requests CRM fields
-- Adds lightweight CRM metadata for the restricted admin Kanban.
-- ============================================================

alter table public.proposal_requests
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'proposal_requests_status_check'
      and conrelid = 'public.proposal_requests'::regclass
  ) then
    alter table public.proposal_requests
      add constraint proposal_requests_status_check
      check (status in ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost'));
  end if;
end $$;

create or replace function public.update_proposal_requests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_proposal_requests_updated_at on public.proposal_requests;
create trigger trg_proposal_requests_updated_at
  before update on public.proposal_requests
  for each row execute function public.update_proposal_requests_updated_at();
