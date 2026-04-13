-- Adiciona campo subtitle à tabela modules (Story 6.1 — Epic 6 Página de Curso)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS subtitle text;
