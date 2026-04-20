---
id: "7"
title: "Materiais por Curso"
status: Ready
created_at: "2026-04-13"
updated_at: "2026-04-16"
---

# Epic 7 — Materiais por Curso

## Visão

Dar contexto e relevância aos materiais de apoio: cada arquivo enviado pelo admin passa a ser associado a um curso específico (ou marcado como "Conteúdo Extra" quando não pertencer a nenhum). O aluno vê os materiais organizados por curso na página de Materiais, e também encontra os materiais diretamente na página do curso — sem precisar ir a outro menu.

## Problema

Atualmente, todos os materiais são listados em uma única fila plana sem qualquer organização. O aluno não sabe se um PDF é do Curso A ou do Curso B. O admin não tem como indicar a qual curso o material pertence no momento do upload. E a `CursoPage` (Epic 6) não exibe os materiais do curso — o aluno precisa navegar até uma seção separada para encontrá-los.

## Objetivo

- Criar relação `materials.module_id → modules.id` (nullable) no banco
- Admin seleciona o curso ao fazer upload (ou "Conteúdo Extra" para materiais genéricos)
- Página de Materiais do aluno agrupa arquivos por curso + seção "Conteúdo Extra" ao final
- `CursoPage` exibe seção "Materiais do Curso" para os materiais vinculados àquele curso

## Decisões de Arquitetura

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Tipo de relação | `module_id uuid REFERENCES modules(id) ON DELETE SET NULL` | Excluir curso não quebra os materiais — viram "Conteúdo Extra" automaticamente |
| "Conteúdo Extra" | `module_id IS NULL` | Zero campo extra; null = sem curso = extra |
| API `/api/materials/upload` | Aceitar `module_id` opcional | Backend precisa persistir o campo |
| Download em CursoPage | Reutilizar padrão de MateriaisPage (presigned URL) | Consistência; sem nova infraestrutura |
| Agrupar na MateriaisPage | JS client-side após fetch | Sem RPC extra; os dados já chegam com `modules(title)` |
| Ordem das seções | Cursos por `modules.order ASC` + "Conteúdo Extra" ao final | Segue a ordem definida pelo admin nos cursos |

## Escopo do Épico

### IN

- Migration `materials.module_id` + aplicar no remoto
- Admin upload: dropdown de seleção de curso (+ opção "Conteúdo Extra")
- Admin lista: badge do curso em cada material
- `MateriaisPage`: materiais agrupados por curso + seção "Conteúdo Extra"
- `CursoPage`: seção "Materiais do Curso" (oculta se vazia)

### OUT

- Upload em lote de materiais
- Edição de material (troca de curso após upload)
- Permissão de download por curso (todos os alunos autenticados podem baixar qualquer material)
- Drag-and-drop para reordenar materiais dentro de um curso
- Preview inline de PDFs

## Stories

| Story | Título | Tipo | Complexidade |
|-------|--------|------|-------------|
| 7.1 | DB: `materials.module_id` | backend | S |
| 7.2 | Admin: seletor de curso no upload | fullstack | S |
| 7.3 | MateriaisPage: agrupada por curso | frontend | M |
| 7.4 | CursoPage: seção "Materiais do Curso" | frontend | S |

## Critério de Done do Épico

- [ ] Coluna `module_id` existe em `materials` no remoto
- [ ] Admin associa material a curso ou "Conteúdo Extra" durante upload
- [ ] Badge de curso visível na lista de materiais do admin
- [ ] MateriaisPage exibe materiais agrupados por curso + "Conteúdo Extra"
- [ ] CursoPage exibe seção "Materiais do Curso" para materiais vinculados
- [ ] Material de curso excluído mantém vínculo `null` (não é excluído)
- [ ] `npm test` passa sem regressões

## Change Log

| Data | Agente | Ação |
|------|--------|------|
| 2026-04-13 | @pm (Morgan) | Epic criada com escopo de materiais por curso |
| 2026-04-16 | Codex | Manutenção posterior: autenticação adicionada aos endpoints de materiais, UX de erro de download ajustada em `MateriaisPage` e `CursoPage`, testes ampliados |

---
*Epic criado por Morgan (PM) — 2026-04-13*
