-- ============================================================
-- Migration: RLS Policies — Platform Tables
-- Story: 1.1 — Criação da Plataforma da Mentoria
-- ============================================================
-- Admin check: role stored in auth.users.raw_user_meta_data->>'role'
-- Helper: (auth.jwt()->'user_metadata'->>'role') = 'admin'
-- ============================================================

-- ── MODULES ──────────────────────────────────────────────────
alter table public.modules enable row level security;

create policy "modules: alunos autenticados leem"
  on public.modules for select
  to authenticated
  using (true);

create policy "modules: somente admin escreve"
  on public.modules for all
  to authenticated
  using ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── LESSONS ──────────────────────────────────────────────────
alter table public.lessons enable row level security;

create policy "lessons: alunos autenticados leem"
  on public.lessons for select
  to authenticated
  using (true);

create policy "lessons: somente admin escreve"
  on public.lessons for all
  to authenticated
  using ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── FORUM_TOPICS ──────────────────────────────────────────────
alter table public.forum_topics enable row level security;

create policy "forum_topics: autenticados leem"
  on public.forum_topics for select
  to authenticated
  using (true);

create policy "forum_topics: autenticados criam"
  on public.forum_topics for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "forum_topics: autor ou admin deletam"
  on public.forum_topics for delete
  to authenticated
  using (
    auth.uid() = user_id
    or (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- ── FORUM_REPLIES ─────────────────────────────────────────────
alter table public.forum_replies enable row level security;

create policy "forum_replies: autenticados leem"
  on public.forum_replies for select
  to authenticated
  using (true);

create policy "forum_replies: autenticados criam"
  on public.forum_replies for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "forum_replies: autor ou admin deletam"
  on public.forum_replies for delete
  to authenticated
  using (
    auth.uid() = user_id
    or (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- ── MATERIALS ─────────────────────────────────────────────────
alter table public.materials enable row level security;

create policy "materials: autenticados leem"
  on public.materials for select
  to authenticated
  using (true);

create policy "materials: somente admin escreve"
  on public.materials for all
  to authenticated
  using ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── ANNOUNCEMENTS ─────────────────────────────────────────────
alter table public.announcements enable row level security;

create policy "announcements: autenticados leem"
  on public.announcements for select
  to authenticated
  using (true);

create policy "announcements: somente admin escreve"
  on public.announcements for all
  to authenticated
  using ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');
