-- ============================================================
-- Migration: Platform Tables
-- Story: 1.1 — Criação da Plataforma da Mentoria
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
