---
id: "4"
title: "Dashboard do Aluno"
status: Active
created_at: "2026-04-13"
---

# Epic 4 — Dashboard do Aluno

## Objetivo

Criar uma página inicial personalizada para o aluno, substituindo o redirect direto para `/modulos`. O dashboard centraliza motivação, progresso, descoberta de conteúdo e engajamento com a comunidade.

## Valor de Negócio

- **Retenção**: aluno vê progresso e se sente motivado a continuar
- **Descoberta**: "Últimos lançamentos" aumenta consumo de conteúdo novo
- **Engajamento**: ranking semanal cria senso de comunidade e competição saudável
- **Comunidade**: CTA WhatsApp converte alunos em membros ativos do grupo

## Stories

| Story | Título | Pontos | Status |
|-------|--------|--------|--------|
| 4.1 | Página Inicial — Dashboard | 8 | Ready |

## Dependências

- Epic 1 ✅ — autenticação, `lesson_progress`, `profiles`
- Epic 2 ✅ — módulos e aulas estruturados
- Epic 3 ✅ — tipos de aula e progresso

## Identidade Visual

Seguir padrão existente:
- Fontes: Space Grotesk (corpo) + Space Mono (labels/mono)
- Tokens: `var(--accent)` laranja, `var(--panel)`, `var(--text)`, `var(--muted)`, `var(--line)`
- Referência: https://mentoria.neuralhub.ia.br/brand.html
