---
title: 'Quick Reference Commands no BMAD Guide'
type: 'feature'
created: '2026-10-13'
status: 'in-review'
route: 'one-shot'
---

# Quick Reference Commands no BMAD Guide

## Intenção

**Problema:** O usuário pediu para acrescentar ao guia os comandos da captura enviada em 13/10/2026.

**Abordagem:** Transcrever os nove comandos, organizados em entrada universal, planejamento, solução e implementação. Acrescentar cartão visual com comandos copiáveis e material Markdown para download, mantendo a lista atual de skills.

## Implementação

- Cartão `#quick-reference` na seção Fluxos, com identidade visual da captura, títulos/comentários em português e quatro botões de copiar.
- Novo recurso `recursos/quick-reference-commands.md`, acessível no cartão e no kit de consulta.
- A captura não identifica a versão: a referência está atribuída ao material enviado, com links separados para as instruções atuais v6.12/v7. Os comandos não foram executados como workflows.
- Alteração aplicada a `public/bmadguide/output/bmad-guide-neural-hub/`, `bmadguide/output/bmad-guide-neural-hub/` e `bmadguide/dist/`. Preservadas as mudanças de tipografia e o link Neural Hub existentes apenas em `bmadguide/dist/`.

## Verificação

- Node 24.21.0, npm 11.19.0. Typecheck, 127 testes e build passaram na árvore de trabalho local. Build repetido após os ajustes de leitura e impressão.
- `bmadguide/npm run check`: sintaxe dos scripts e 30 referências locais aprovadas.
- Lint global permanece bloqueado pelos 158 erros preexistentes no pacote original `bmadguide`; não foi declarado gate global verde. Nenhum JavaScript foi alterado nesta tarefa.
- Preview do build: nove comandos correspondem à captura; download retorna HTTP 200 e contém os nove comandos.
- Quatro botões de copiar testados com captura da chamada de `navigator.clipboard.writeText`: conteúdo enviado corresponde ao texto visível, incluindo quebras de linha.
- Cartão inspecionado em desktop e celular; cabe na largura de 320 px. Overflow já existente da demonstração fora do cartão permanece fora deste escopo.
- A referência permanece disponível ao alternar entre v6.12/v7. Links da nota têm cor `#111` com regras de impressão aplicadas.
- Console sem erros ou avisos. Cópias de `public`, do caminho solicitado e do build comparadas sem diferenças; `git diff --check` passou.
- Revisão independente encontrou três ajustes (atribuição da entrada universal, tradução do comentário e cor de links na impressão); todos corrigidos.
- Atualização local, sem commit, push ou deploy nesta tarefa. A publicação anterior permanece no commit `8102238999606c9d2ead0dbad34d0c2b000396bb`.

## Ordem sugerida de revisão

- Conteúdo solicitado e grupos copiáveis.
  [index.html:67](../../public/bmadguide/output/bmad-guide-neural-hub/index.html#L67)
- Referência para download.
  [quick-reference-commands.md:1](../../public/bmadguide/output/bmad-guide-neural-hub/recursos/quick-reference-commands.md#L1)
- Leitura, responsividade e impressão.
  [style.css:26](../../public/bmadguide/output/bmad-guide-neural-hub/assets/style.css#L26)

## Publicação autorizada — 13/10/2026

O usuário autorizou commit local, push para o GitHub e deploy em produção desta atualização. Escopo: HTML/CSS da referência, recurso Markdown e este registro. Destinos conferidos: `Andre-cardia/Mentoria-IA`, branch `master`, projeto Vercel `mentoria-ia` (`prj_aLFJPzWg79s87XBKngcmA4sXd1RX`), domínio `neuralhub.ia.br`. As demais mudanças locais e o pacote original `bmadguide/` permanecem fora deste commit.

A suíte e o lint do checkout versionado têm as falhas preexistentes já registradas na publicação anterior; esta atualização modifica apenas HTML, CSS e material para download. A evidência de 127 testes aprovados corresponde à árvore de trabalho local, com correções pendentes de outros trabalhos.
