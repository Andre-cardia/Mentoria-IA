---
id: "3"
title: "Experiência de Aprendizado — Tipos de Aula, Quiz e Q&A"
status: Ready
type: brownfield
priority: High
created_at: "2026-04-12"
pm: "@pm (Morgan)"
---

# Epic 3 — Experiência de Aprendizado: Tipos de Aula, Quiz e Q&A

## Visão Geral

A plataforma hoje suporta apenas aulas em vídeo. Este epic expande o modelo de conteúdo para incluir **4 tipos de aula** (vídeo gravado, texto/leitura, atividade prática e prova objetiva), além de uma **seção de Q&A** contextual abaixo de cada aula — tornando a experiência de aprendizado mais rica, diversificada e interativa.

## Problema de Negócio

Mentorados aprendem de formas diferentes. Apenas vídeo limita o engajamento e não permite avaliação formal do conhecimento. Sem Q&A por aula, dúvidas específicas de conteúdo ficam perdidas no fórum geral ou no WhatsApp. O mentor precisa de ferramentas para criar trilhas de aprendizado completas — não só gravar vídeos.

## Objetivo

Transformar a plataforma de um repositório de vídeos em um **ambiente de aprendizado completo**, onde cada módulo pode ter aulas de diferentes naturezas e cada aula tem seu próprio espaço de interação.

## Stories

| ID | Título | Status |
|----|--------|--------|
| 3.1 | Tipos de Aula: Schema + Admin + Frontend | Draft |
| 3.2 | Provas Objetivas (Quiz) | Draft |
| 3.3 | Q&A por Aula | Draft |

## Requisitos Funcionais

- RF-01: A tabela `lessons` deve suportar 4 tipos: `video`, `text`, `activity`, `quiz`
- RF-02: Aulas do tipo `text` exibem conteúdo rich text (markdown) para leitura
- RF-03: Aulas do tipo `activity` exibem instruções da tarefa + campo de submissão do mentorado
- RF-04: Aulas do tipo `quiz` exibem questões de múltipla escolha com pontuação ao final
- RF-05: Admin pode criar/editar aulas de qualquer tipo com interface adequada a cada tipo
- RF-06: Toda aula (independente do tipo) tem seção de Q&A abaixo do conteúdo principal
- RF-07: Qualquer usuário autenticado pode fazer perguntas e responder no Q&A
- RF-08: Admin pode marcar uma resposta como "resposta oficial"
- RF-09: Progresso (marcar como concluída) funciona para todos os tipos de aula
- RF-10: Quiz registra tentativas e exibe score ao mentorado após conclusão

## Requisitos Não-Funcionais

- NFR-01: Interface segue Design System Mentoria IA (dark theme, Space Grotesk, accent #ff6a00)
- NFR-02: Novas tabelas com RLS adequada (aluno vê apenas seu progresso/tentativas)
- NFR-03: Q&A paginado — máximo 20 itens por página (não carregar tudo de uma vez)
- NFR-04: Quiz sem limite de tentativas, mas registra todas com timestamp

## Restrições

- CON-01: Reutilizar `LessonPage.jsx` como container — renderizar conteúdo diferente por tipo
- CON-02: Reutilizar cliente Supabase de `src/lib/supabase.js`
- CON-03: Migrations incrementais — não alterar migrations existentes, criar novas
- CON-04: Design System documentado em `docs/Detalhes do Design System.md`
- CON-05: Admin UI em `src/plataforma/pages/admin/AdminAulasPage.jsx` (já existente — estender)

## Schema Delta (novas tabelas e campos)

```sql
-- Adicionar a lessons
ALTER TABLE public.lessons
  ADD COLUMN lesson_type text NOT NULL DEFAULT 'video'
    CHECK (lesson_type IN ('video', 'text', 'activity', 'quiz')),
  ADD COLUMN content text; -- markdown para text/activity

-- Questões do quiz
CREATE TABLE public.quiz_questions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id  uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  question   text NOT NULL,
  "order"    integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Opções de cada questão
CREATE TABLE public.quiz_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  label       text NOT NULL,
  is_correct  boolean NOT NULL DEFAULT false,
  "order"     integer NOT NULL DEFAULT 0
);

-- Tentativas de quiz
CREATE TABLE public.quiz_attempts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score       integer NOT NULL, -- 0-100
  answers     jsonb NOT NULL,   -- { question_id: option_id }
  completed_at timestamptz NOT NULL DEFAULT now()
);

-- Q&A por aula
CREATE TABLE public.lesson_qa (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id     uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id     uuid REFERENCES public.lesson_qa(id) ON DELETE CASCADE, -- NULL = pergunta, NOT NULL = resposta
  body          text NOT NULL,
  is_official   boolean NOT NULL DEFAULT false, -- admin marca resposta oficial
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

## Dependências

- Epic 1 ✅ (plataforma base, autenticação, `lessons` table)
- Epic 2 ✅ (Admin Módulos & Aulas funcional)
- Supabase em produção com migrations aplicadas
- Deploy Vercel funcional

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Migration ALTER TABLE em produção com dados | Média | Alto | `ADD COLUMN ... DEFAULT 'video'` — não quebra linhas existentes |
| Quiz: complexidade de correção automática | Baixa | Médio | Corrigir no frontend com dados do Supabase — sem backend extra |
| Q&A: volume alto de mensagens sem moderação | Baixa | Baixo | RLS + flag `is_official`; moderação futura se necessário |
| Admin: form muito complexo para 4 tipos | Média | Médio | Tabs por tipo com campos condicionais — UX incremental |
