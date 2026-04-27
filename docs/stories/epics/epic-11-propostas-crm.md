---
id: "11"
title: "Propostas IA e CRM de Leads"
status: InProgress
type: brownfield
priority: High
created_at: "2026-04-27"
pm: "@pm"
analyst: "@analyst"
orchestrator: "@aiox-master"
---

# Epic 11 — Propostas IA e CRM de Leads

## Visao Geral

Criar um fluxo comercial completo para captar interessados em treinamentos corporativos de Inteligencia Artificial e permitir que a equipe Neural Hub administre esses leads em uma area restrita.

O fluxo comeca nos CTAs "Solicitar Proposta", leva o visitante para uma pagina persuasiva com formulario, grava a solicitacao em Supabase e disponibiliza os registros em um CRM administrativo com Kanban.

## Problema de Negocio

Os CTAs comerciais da Neural Hub precisam de um destino claro e mensuravel. Sem uma pagina dedicada e sem uma area de administracao, leads corporativos ficam dispersos, sem status, historico ou visibilidade operacional.

## Objetivo Estrategico

Transformar o interesse gerado pela landing page em pipeline comercial administravel:

- Captar leads qualificados para treinamento corporativo de IA
- Reduzir atrito no pedido de proposta
- Organizar acompanhamento comercial por status
- Dar visibilidade ao funil para administradores

## Planejamento

| Fase | Entrega | Responsavel | Status |
|------|---------|-------------|--------|
| 1 | Pagina publica `/solicitar-proposta` com conteudo persuasivo e formulario | @dev | Done |
| 2 | Persistencia de solicitacoes em `proposal_requests` | @dev | Done |
| 3 | CRM restrito em `/plataforma/admin/leads` | @dev | Done |
| 4 | Kanban com atualizacao de status e notas internas | @dev | Done |
| 5 | QA visual autenticado e validacao em Supabase remoto | @qa | Pending |

## Metricas de Sucesso

- 100% dos CTAs "Solicitar Proposta" apontam para `/solicitar-proposta`
- 100% dos formularios validos geram registro em `proposal_requests`
- Administradores conseguem visualizar, filtrar e movimentar leads no Kanban
- Cada lead possui status comercial atualizado e notas internas

## Escopo

### IN — Esta epic cobre:

- Pagina publica de solicitacao de proposta
- Formulario de lead corporativo
- Migration Supabase para `proposal_requests`
- RLS: insert publico e select/update restrito a admins
- CRM administrativo restrito
- Kanban por status comercial
- Drawer de detalhes com notas internas
- Navegacao administrativa para "Leads"

### OUT — Fora do escopo:

- Envio automatico de e-mail para o time comercial
- Integracao com WhatsApp ou CRM externo
- SLA, tarefas comerciais e lembretes
- Relatorios avancados de conversao
- Exportacao CSV

## Stories

| ID | Titulo | Prioridade | Dependencias |
|----|--------|------------|-------------|
| 11.1 | Pagina "Solicitar Proposta" | High | Design system Neural Hub |
| 11.2 | CRM Kanban de Leads | High | 11.1, tabela `proposal_requests` |

## Riscos

| Risco | Probabilidade | Mitigacao |
|-------|---------------|-----------|
| Formulario publico receber spam | Media | RLS restrita e futura protecao anti-spam/captcha |
| Admin sem permissao correta nao ver leads | Media | Reutilizar `AdminRoute` e policies por role admin |
| Kanban divergir do banco apos falha de update | Baixa | Recarregar dados apos update e exibir erro |
| Dados sensiveis ficarem expostos | Baixa | Select/update apenas para usuarios admin |

## Change Log

| Data | Agente | Acao |
|------|--------|------|
| 2026-04-27 | @aiox-master / Codex | Epic criada apos correcao de processo; stories 11.1 e 11.2 registradas |
