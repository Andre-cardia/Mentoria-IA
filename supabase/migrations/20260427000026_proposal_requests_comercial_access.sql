-- ============================================================
-- Proposal Requests: CRM commercial role access
-- Allows role "comercial" to operate only the CRM lead pipeline.
-- ============================================================

drop policy if exists "proposal_requests_admin_select" on public.proposal_requests;
drop policy if exists "proposal_requests_crm_select" on public.proposal_requests;
create policy "proposal_requests_crm_select"
  on public.proposal_requests
  for select
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'));

drop policy if exists "proposal_requests_admin_update" on public.proposal_requests;
drop policy if exists "proposal_requests_crm_update" on public.proposal_requests;
create policy "proposal_requests_crm_update"
  on public.proposal_requests
  for update
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'))
  with check ((auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'comercial'));
