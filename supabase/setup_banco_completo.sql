-- ============================================================
-- SETUP COMPLETO DO BANCO DE DADOS DA MENTORIA
-- Execute tudo de uma vez no Supabase > SQL Editor
-- ============================================================

-- ============================================================
-- 1. PLATFORM TABLES (Migrations 1)
-- ============================================================
-- Módulos (agrupam aulas)
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Aulas (pertencem a um módulo)
create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  title       text not null,
  video_url   text,
  duration    integer, -- segundos
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Tópicos do fórum
create table if not exists public.forum_topics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Respostas do fórum
create table if not exists public.forum_replies (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.forum_topics(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

-- Materiais (arquivos no S3)
create table if not exists public.materials (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  s3_key      text not null,
  file_size   bigint, -- bytes
  created_at  timestamptz not null default now()
);

-- Quadro de avisos
create table if not exists public.announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- Índices para performance
create index if not exists lessons_module_id_idx on public.lessons(module_id);
create index if not exists lessons_order_idx on public.lessons(module_id, "order");
create index if not exists forum_replies_topic_id_idx on public.forum_replies(topic_id);
create index if not exists announcements_published_at_idx on public.announcements(published_at desc);

-- ============================================================
-- 2. LESSON PROGRESS TABLES (Migrations 3)
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id     uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id   ON lesson_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress (lesson_id);

-- ============================================================
-- 3. APPLY RLS POLICIES (Migrations 2 e 4)
-- ============================================================

-- ── MODULES ──────────────────────────────────────────────────
alter table public.modules enable row level security;
create policy "modules: alunos autenticados leem" on public.modules for select to authenticated using (true);
create policy "modules: somente admin escreve" on public.modules for all to authenticated using ((auth.jwt()->'user_metadata'->>'role') = 'admin') with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── LESSONS ──────────────────────────────────────────────────
alter table public.lessons enable row level security;
create policy "lessons: alunos autenticados leem" on public.lessons for select to authenticated using (true);
create policy "lessons: somente admin escreve" on public.lessons for all to authenticated using ((auth.jwt()->'user_metadata'->>'role') = 'admin') with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── FORUM_TOPICS ──────────────────────────────────────────────
alter table public.forum_topics enable row level security;
create policy "forum_topics: autenticados leem" on public.forum_topics for select to authenticated using (true);
create policy "forum_topics: autenticados criam" on public.forum_topics for insert to authenticated with check (auth.uid() = user_id);
create policy "forum_topics: autor ou admin deletam" on public.forum_topics for delete to authenticated using (auth.uid() = user_id or (auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── FORUM_REPLIES ─────────────────────────────────────────────
alter table public.forum_replies enable row level security;
create policy "forum_replies: autenticados leem" on public.forum_replies for select to authenticated using (true);
create policy "forum_replies: autenticados criam" on public.forum_replies for insert to authenticated with check (auth.uid() = user_id);
create policy "forum_replies: autor ou admin deletam" on public.forum_replies for delete to authenticated using (auth.uid() = user_id or (auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── MATERIALS ─────────────────────────────────────────────────
alter table public.materials enable row level security;
create policy "materials: autenticados leem" on public.materials for select to authenticated using (true);
create policy "materials: somente admin escreve" on public.materials for all to authenticated using ((auth.jwt()->'user_metadata'->>'role') = 'admin') with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── ANNOUNCEMENTS ─────────────────────────────────────────────
alter table public.announcements enable row level security;
create policy "announcements: autenticados leem" on public.announcements for select to authenticated using (true);
create policy "announcements: somente admin escreve" on public.announcements for all to authenticated using ((auth.jwt()->'user_metadata'->>'role') = 'admin') with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── LESSON_PROGRESS ─────────────────────────────────────────────
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aluno gerencia progresso" ON lesson_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin le progresso" ON lesson_progress FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
