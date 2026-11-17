-- ============================================================
-- Migration: Trilhas de aprendizagem
-- Story: 14.1 — Organizar cursos em trilhas (básico, intermediário, avançado)
-- ============================================================
-- Idempotente: pode ser reaplicada sem duplicar trilhas nem
-- sobrescrever cursos que já tenham trilha definida pelo admin.

create table if not exists public.tracks (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  level       text not null check (level in ('basico', 'intermediario', 'avancado')),
  "order"     integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.modules
  add column if not exists track_id uuid references public.tracks(id) on delete set null;

create index if not exists modules_track_id_idx on public.modules(track_id, "order");

-- ── RLS (mesmo padrão de modules) ────────────────────────────
alter table public.tracks enable row level security;

drop policy if exists "tracks: alunos autenticados leem" on public.tracks;
create policy "tracks: alunos autenticados leem"
  on public.tracks for select
  to authenticated
  using (true);

drop policy if exists "tracks: somente admin escreve" on public.tracks;
create policy "tracks: somente admin escreve"
  on public.tracks for all
  to authenticated
  using ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  with check ((auth.jwt()->'user_metadata'->>'role') = 'admin');

-- ── Trilhas iniciais ─────────────────────────────────────────
insert into public.tracks (slug, title, description, level, "order") values
  ('basico',        'Trilha Básica',        'Entenda a IA, domine prompts e prepare seu ambiente de trabalho.', 'basico',        0),
  ('intermediario', 'Trilha Intermediária', 'Construa aplicações e agentes: planejamento, backend, integrações e segurança.', 'intermediario', 1),
  ('avancado',      'Trilha Avançada',      'Método e engenharia: spec-driven, arquitetura e o projeto de certificação.', 'avancado',      2)
on conflict (slug) do nothing;

-- ── Distribuição dos cursos já gravados ──────────────────────
-- Casa pelo título atual do curso (sem diferenciar maiúsculas e
-- ignorando espaços nas pontas). Só toca cursos ainda sem trilha.
with plano(slug, pos, titulo) as (
  values
    ('basico',         0, 'Introdução a Inteligência Artificial'),
    ('basico',         1, 'Inteligência Artificial Generataiva (agosto 2026)'),
    ('basico',         2, 'LLM - Large Language Models'),
    ('basico',         3, 'Engenharia de Prompt'),
    ('basico',         4, 'LLMs Gratuitas e Ilimitadas'),
    ('basico',         5, 'Sobre a Pulsemind'),
    ('basico',         6, 'Stack de Ferramenta de Desenvolvimento de Aplicações com IA'),
    ('basico',         7, 'Conceitos Básicos de Git e GitHub'),
    ('basico',         8, 'Fazendo deploy no GitHub Pages'),
    ('intermediario',  9, 'Planejamento de Software'),
    ('intermediario', 10, 'Full-Stack com IA'),
    ('intermediario', 11, 'Fundamentos de Backend e Modelagem de Dados - Supabase'),
    ('intermediario', 12, 'MasterClass - Construindo Landing Pages com IA'),
    ('intermediario', 13, 'Tudo Sobre Skills'),
    ('intermediario', 14, 'Aula de API, MCP, SKILL e Agentes + Dify'),
    ('intermediario', 15, 'Agentes para Whatsapp e Telegram com Pulsemind'),
    ('intermediario', 16, 'RAG'),
    ('intermediario', 17, 'Pi Agent + OpenRouter'),
    ('intermediario', 18, 'Segurança para desenvolvimento com IA'),
    ('avancado',      19, 'Spec-Driven Development'),
    ('avancado',      20, 'Speckit + Loop Engineering'),
    ('avancado',      21, 'BMAD na prática'),
    ('avancado',      22, 'JEV na prática'),
    ('avancado',      23, 'Harness'),
    ('avancado',      24, 'REA – Reverse Engineer Anything | Engenharia Reversa com IA'),
    ('avancado',      25, 'System Design para Produtos com IA'),
    ('avancado',      26, 'Projeto de Certificação')
)
update public.modules m
   set track_id = t.id,
       "order"  = p.pos
  from plano p
  join public.tracks t on t.slug = p.slug
 where lower(trim(m.title)) = lower(p.titulo)
   and m.track_id is null;
