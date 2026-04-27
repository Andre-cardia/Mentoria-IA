-- ============================================================
-- Proposal Requests
-- Captures public CTA submissions from /solicitar-proposta.
-- ============================================================

create table if not exists public.proposal_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  whatsapp text not null,
  company text not null,
  role text not null,
  company_size text not null,
  objective text not null,
  urgency text not null,
  context text not null,
  source text not null default 'neural-hub-proposta',
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists idx_proposal_requests_created_at
  on public.proposal_requests (created_at desc);

create index if not exists idx_proposal_requests_status
  on public.proposal_requests (status);

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

alter table public.proposal_requests enable row level security;

drop policy if exists "proposal_requests_public_insert" on public.proposal_requests;
create policy "proposal_requests_public_insert"
  on public.proposal_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "proposal_requests_admin_select" on public.proposal_requests;
create policy "proposal_requests_admin_select"
  on public.proposal_requests
  for select
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

drop policy if exists "proposal_requests_admin_update" on public.proposal_requests;
create policy "proposal_requests_admin_update"
  on public.proposal_requests
  for update
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
