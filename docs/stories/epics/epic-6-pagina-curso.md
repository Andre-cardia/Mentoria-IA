---
id: "6"
title: "Página de Detalhes do Curso"
status: Ready
created_at: "2026-04-13"
updated_at: "2026-04-13"
---

# Epic 6 — Página de Detalhes do Curso

## Visão

Elevar a experiência de descoberta de conteúdo: cada "módulo" passa a ser chamado de **curso**, ganha uma página própria com título, subtítulo, descrição ("Sobre o Curso") e lista dinâmica de aulas ("Conteúdo do Curso"). O aluno pode ver o que vai aprender antes de começar e iniciar o curso com um clique.

## Problema

Atualmente os módulos são exibidos como acordeões na `ModulosPage`. Não há subtítulo, não há página dedicada ao curso, e o rótulo "módulo" não transmite o valor pedagógico do conteúdo. O aluno não tem uma visão clara do que cada curso oferece antes de entrar na primeira aula.

## Objetivo

- Renomear "módulo" → "curso" em toda a UI (sem alterar nomes de tabelas no banco)
- Dar ao admin o campo `subtitle` no cadastro do curso
- Criar uma página de detalhes do curso (`/cursos/:moduleId`) com UX focada em conversão e clareza
- Manter a lista de aulas dinâmica: reflete automaticamente as aulas cadastradas

## Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Renomear tabela `modules`? | **Não** | Migration destrutiva sem ganho; labels de UI bastam |
| Campo "Sobre o Curso" | Reutilizar `modules.description` | Já existe; elimina migration extra |
| Campo novo | `subtitle text` em `modules` | Único campo ausente necessário |
| Rota do curso | `/cursos/:moduleId` | Semântica correta; compatível com rota de aula |
| Rota da aula | `/cursos/:moduleId/aulas/:lessonId` | Mantém hierarquia, muda prefixo |
| Rota legada `/modulos` | Redirecionar → `/cursos` | Evitar links quebrados |
| "Conteúdo do Curso" | Query de `lessons` por `module_id` ordenado por `order` | Dinâmico, zero config extra |
| Botão "Iniciar" | Link para `lessons[0]` (menor `order`) | Primeira aula = ponto de entrada natural |

## Escopo do Épico

### IN (Stories 6.1 e 6.2)

- Migration `subtitle` + admin com campo subtítulo
- Renomear labels "Módulo/Módulos" → "Curso/Cursos" em toda a UI do aluno e admin
- `ModulosPage` → `CursosPage`: lista de cards clicáveis (não accordion)
- Nova `CursoPage` (`/cursos/:moduleId`):
  - Breadcrumb: Cursos › [Título do Curso]
  - Título + subtítulo
  - Botão "Iniciar Curso" → primeira aula
  - Seção "Sobre o Curso" (conteúdo de `description`)
  - Seção "Conteúdo do Curso" (lista dinâmica de aulas)
- `LessonPage` breadcrumb: Cursos › [Curso] › [Aula]
- `AdminModulosPage` label + campo subtítulo

### OUT (fora do escopo)

- Thumbnail / imagem de capa do curso
- Tags / categorias de curso
- Avaliações ou reviews de curso
- Sistema de pré-requisitos entre cursos
- Renomear tabela `modules` no banco

## Stories

| Story | Título | Tipo | Complexidade |
|-------|--------|------|-------------|
| 6.1 | DB + Admin — subtítulo e labels | fullstack | S |
| 6.2 | CursoPage + CursosPage + rotas | frontend | M |

## Critério de Done do Épico

- [ ] Campo `subtitle` no banco (migration aplicada) e no admin
- [ ] Labels "módulo" → "curso" em toda a UI (aluno + admin)
- [ ] `CursosPage` exibe cards com título e subtítulo, clicáveis
- [ ] `CursoPage` renderiza todas as seções com dados reais
- [ ] Botão "Iniciar Curso" redireciona corretamente para a primeira aula
- [ ] Lista de aulas em "Conteúdo do Curso" atualiza sem código quando nova aula é cadastrada
- [ ] Breadcrumb correto em `CursoPage` e `LessonPage`
- [ ] Rotas `/modulos` e `/modulos/:id/aulas/:id` redirecionam para `/cursos`
- [ ] `npm test` passa sem regressões

---
*Epic criado por Morgan (PM) — 2026-04-13*
