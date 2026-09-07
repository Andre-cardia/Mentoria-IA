-- ============================================================
-- Lead Follow-ups: tracking tasks, meetings and alert reminders
-- Allows CRM team (admin and comercial) to schedule follow-ups
-- and receive notifications in real time.
-- ============================================================

create table if not exists public.lead_follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.proposal_requests(id) on delete cascade,
  title text not null,
  notes text,
  scheduled_at timestamptz not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_by_user_id uuid references auth.users(id),
  created_by_name text not null default 'Usuário CRM',
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_follow_ups_lead_id
  on public.lead_follow_ups (lead_id);

create index if not exists idx_lead_follow_ups_scheduled
  on public.lead_follow_ups (scheduled_at, completed);

alter table public.lead_follow_ups enable row level security;

drop policy if exists "lead_follow_ups_crm_select" on public.lead_follow_ups;
create policy "lead_follow_ups_crm_select"
  on public.lead_follow_ups
  for select
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'));

drop policy if exists "lead_follow_ups_crm_insert" on public.lead_follow_ups;
create policy "lead_follow_ups_crm_insert"
  on public.lead_follow_ups
  for insert
  to authenticated
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'));

drop policy if exists "lead_follow_ups_crm_update" on public.lead_follow_ups;
create policy "lead_follow_ups_crm_update"
  on public.lead_follow_ups
  for update
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'))
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'));

drop policy if exists "lead_follow_ups_crm_delete" on public.lead_follow_ups;
create policy "lead_follow_ups_crm_delete"
  on public.lead_follow_ups
  for delete
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'));
