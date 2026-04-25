# Epic 10 — Homepage Neural Hub (neuralhub.ia.br)

## Status
**Atual:** InProgress

## Objetivo

Criar a homepage pública do site institucional da Neural Hub em `neuralhub.ia.br`. A Neural Hub é a empresa-mãe; a Mentoria Zero-to-Hero IA é um produto dentro do portfólio. A homepage precisa posicionar a Neural Hub como referência em treinamentos in-company de IA para C-levels e executivos.

## Valor de Negócio

- Estabelece identidade institucional da Neural Hub separada da landing de vendas da Mentoria
- Captura leads de treinamentos corporativos (B2B) — segmento diferente do produto mentoria (B2C)
- URL própria: `neuralhub.ia.br` (domínio principal, não subdomínio)

## Referência Visual

Layout estrutural baseado em `https://aifounder.one/` — sequência de seções, hierarquia tipográfica, padrão visual e espaçamentos. Conteúdo adaptado para Neural Hub. Design tokens obrigatoriamente do brand guide `https://mentoria.neuralhub.ia.br/brand.html`.

## Produto

**Neural Hub** oferece:
- Treinamentos in-company: formatos 4H (Sprint Executivo), 8H (Imersão de Times), Customizado
- Público: C-levels, executivos, times de alta performance
- Founders: André Cardia (CEO) + Celso Ferreira (CTO)
- Produto existente: Mentoria Zero-to-Hero IA (mencionada como produto do portfólio)

## Arquitetura Técnica

- **Stack:** React 18 + Vite (mesmo projeto `d:\GitHub\Mentoria-IA`)
- **Entry point HTML:** `neuralhub.html` (raiz do projeto)
- **Entry point JS:** `src/neuralhub-main.jsx`
- **Componente raiz:** `src/NeuralHubHome.jsx` (arquivo único, sem subcomponentes externos)
- **Build:** `vite.config.js` — input `neuralhub: resolve(__dirname, 'neuralhub.html')`
- **Dev rewrite:** `/neuralhub` e `/neuralhub/*` → `neuralhub.html`
- **Assets:** `src/assets/neuralhub-background.png` (imagem hero, importada via módulo ES)

## Stories

| Story | Título | Status |
|-------|--------|--------|
| 10.1  | Homepage Neural Hub — Estrutura + Layout aifounder.one | Done |

## Histórico

| Data | Agente | Ação |
|------|--------|------|
| 2026-04-24 | @dev (Dex) | Epic criado retroativamente após implementação da Story 10.1 |
