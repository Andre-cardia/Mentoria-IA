---
id: "2"
title: "Reestruturação Admin — Módulos & Aulas"
status: Ready
type: brownfield
priority: High
created_at: "2026-04-12"
pm: "@pm (Morgan)"
---

# Epic 2 — Reestruturação Admin: Módulos & Aulas

## Visão Geral

A página `AdminModulosPage` atual apresenta sérios problemas de usabilidade que dificultam o trabalho diário do administrador. O formulário de edição de módulos "flutua" no topo da página sem contexto, aulas não podem ser editadas (apenas excluídas e recriadas), a ordenação exige digitação manual de números, e não há feedback visual de sucesso. Esta reestruturação transforma a experiência de gerenciamento em algo fluido, inline e intuitivo.

## Problema de Negócio

O administrador precisa gerenciar dezenas de módulos e aulas frequentemente. A UX atual força fluxos lentos, destrutivos (deletar para editar) e confusos (form aparece em lugar inesperado). Isso aumenta o risco de erros operacionais (exclusão acidental, ordem errada) e reduz a velocidade de publicação de conteúdo.

## Objetivo Estratégico

Transformar o painel admin de módulos e aulas numa interface de nível profissional: **edição inline**, **drag-and-drop para ordenação**, **duplicação de aulas**, **modais de confirmação** e **feedback via toast** — tudo sem recarregar a página.

## Métricas de Sucesso

- Tempo médio para reordenar 5 aulas: de ~2min → <15s (drag-and-drop)
- Zero recriações de aulas para editar títulos/URLs
- Zero uso de `confirm()` nativo do browser
- 100% das ações com feedback visual (toast)

## Escopo

### IN — Incluído neste Epic

- Edição inline de aulas (título, URL, duração) com salvar/cancelar
- Drag-and-drop para reordenar módulos entre si
- Drag-and-drop para reordenar aulas dentro do módulo
- Duplicar aula (clone com mesmo conteúdo, ordem +1)
- Modal de confirmação para exclusão de módulo e aula
- Toast notifications para sucesso/erro em todas as operações
- Form de edição de módulo inline (no contexto do card, não no topo)
- Auto-persistência da ordem no Supabase após drop

### OUT — Não incluído neste Epic

- Mover aulas entre módulos (funcionalidade futura)
- Upload de vídeo direto (fora do escopo atual)
- Pré-visualização da aula no admin
- Bulk actions (selecionar múltiplas aulas)
- Histórico de alterações / audit log

## Arquitetura Técnica

### Stack Atual (não muda)
- React + JSX (sem TypeScript)
- Supabase (Postgres + RLS)
- Inline styles via objetos JS (`var(--token)`)
- `AdminLayout` como wrapper

### Dependências Novas

| Biblioteca | Versão | Uso |
|---|---|---|
| `@dnd-kit/core` | ^6.x | Engine de drag-and-drop acessível |
| `@dnd-kit/sortable` | ^8.x | Sortable list (módulos e aulas) |
| `@dnd-kit/utilities` | ^3.x | Utilitários CSS para drag |
| `sonner` | ^1.x | Toast notifications (já usado no projeto?) |

> **Verificar:** se `sonner` ou `react-hot-toast` já existir no `package.json`, reutilizar.

### Impacto no Banco (Supabase)

- Tabelas afetadas: `modules.order`, `lessons.order`
- Operações: `UPDATE` em lote para ordem (após drag)
- RLS: verificar se admin tem permissão de UPDATE nestas colunas
- Não há migrações DDL necessárias

## Stories

| ID | Título | Pontos | Prioridade | Executor |
|---|---|---|---|---|
| [2.1](../2.1.story.md) | Edição Inline + Modal Confirmação + Toast Feedback | 8 | MUST | @dev |
| [2.2](../2.2.story.md) | Drag-and-Drop para Reordenação | 13 | MUST | @dev |
| [2.3](../2.3.story.md) | Duplicar Aula + Campo Ordem Oculto | 5 | SHOULD | @dev |

**Total:** 26 story points

## Sequenciamento

```
Story 2.1 → Story 2.2 → Story 2.3
```

2.1 deve ser entregue primeiro pois refatora a estrutura base do componente.
2.2 depende da nova estrutura de 2.1.
2.3 é independente mas aproveita o padrão estabelecido.

## Riscos

| Risco | Probabilidade | Mitigação |
|---|---|---|
| dnd-kit conflitar com inline styles | Média | Testar DragOverlay com estilos existentes |
| UPDATE em lote de ordem causar race condition | Baixa | Debounce de 500ms após drop |
| RLS bloquear UPDATE de ordem | Média | Verificar policy antes de implementar |

## Critérios de Aceite do Epic

- [ ] Admin consegue editar título/URL/duração de uma aula sem excluir e recriar
- [ ] Admin consegue reordenar módulos arrastando e soltando
- [ ] Admin consegue reordenar aulas dentro de um módulo arrastando e soltando
- [ ] Admin consegue duplicar uma aula
- [ ] Nenhuma exclusão usa `confirm()` nativo — tudo via modal
- [ ] Toda operação (salvar, excluir, duplicar, reordenar) exibe toast de feedback
- [ ] Form de edição de módulo aparece inline no card (não no topo da página)
- [ ] Ordem é persistida no Supabase após drag

---
*Epic criado por Morgan (PM) — 2026-04-12*
