-- Story 3.1: Tipos de Aula — adiciona lesson_type e content à tabela lessons
-- Migration incremental: usa IF NOT EXISTS para ser idempotente

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'video'
    CHECK (lesson_type IN ('video', 'text', 'activity', 'quiz')),
  ADD COLUMN IF NOT EXISTS content text;

-- Índice para consultas por tipo (ex: listar todas as aulas quiz de um módulo)
CREATE INDEX IF NOT EXISTS idx_lessons_type ON public.lessons(lesson_type);

-- RLS existente (admin insert/update, authenticated select) cobre os novos campos
-- automaticamente — sem necessidade de alterar policies.
