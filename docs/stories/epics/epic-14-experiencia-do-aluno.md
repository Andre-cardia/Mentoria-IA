# Epic 14 — Redesign da experiência do aluno

## Vision

Renovar a plataforma da Mentoria: cursos organizados em trilhas, visual novo, gestão separada do ensino e uma gamificação que motive o aluno a voltar, com a Corrida Estelar como vitrine do progresso de cada um.

## Goals

1. Cursos agrupados nas trilhas Básica, Intermediária e Avançada
2. Gestão com login e entrada próprios; papéis lidos de `app_metadata`
3. Tema claro cinza e laranja, com tema escuro alternativo
4. Pontos, medalhas e ranking que recompensam aulas, acessos e participação
5. Corrida Estelar em 3D: uma galáxia por trilha, patentes e naves por nível
6. Comandante e Master só com aval de um administrador
7. Gestão de alunos com ordenação, filtros, exportação e alertas automáticos

## Scope

### IN
- Migrações `20261116000031` a `20261116000038`
- Plataforma do aluno: trilhas, cursos, aula, ranking, Corrida Estelar, blog
- Gestão: separação de ambiente, aval de patente, gestão de alunos

### OUT
- Conteúdo dos quizzes por módulo (decisão na Story 14.6)
- Avisos por e-mail ou tarefa agendada (os avisos são calculados ao abrir a tela)
- Site institucional `neuralhub.ia.br` (trabalho separado, ver PR #4)

## Stories

- 14.1: Trilhas de aprendizagem
- 14.2: Separar ensino de gestão
- 14.3: Novo design claro com tema escuro
- 14.4: Gamificação — pontos, medalhas e ranking
- 14.5: Corrida Estelar em 3D
- 14.6: Quiz de fim de módulo valendo pontos
- 14.7: Patentes, naves por nível e acessórios
- 14.8: Aval do administrador para Comandante e Master
- 14.9: Gestão de alunos — ordenação, avisos e exportação

## Acceptance

O épico é aceito quando as nove stories passarem pelo QA gate (`Done`). Retrospectiva: `docs/stories/epic-14-retro-2026-11-17.md`.
