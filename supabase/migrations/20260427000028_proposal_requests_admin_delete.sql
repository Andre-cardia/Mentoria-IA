-- ============================================================
-- Proposal Requests: admin-only deletion
-- Allows administrators to remove CRM lead cards while keeping
-- commercial users limited to CRM operation.
-- ============================================================

drop policy if exists "proposal_requests_admin_delete" on public.proposal_requests;
create policy "proposal_requests_admin_delete"
  on public.proposal_requests
  for delete
  to authenticated
  using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
