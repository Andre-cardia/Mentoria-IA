---
title: 'Menu Materiais — Bmad guide na homepage Neural Hub'
type: 'feature'
created: '2026-10-13'
status: 'in-review'
route: 'one-shot'
---

# Menu Materiais — Bmad guide na homepage Neural Hub

## Intenção

**Problema:** A homepage pública da Neural Hub não tinha acesso ao guia informado pelo usuário.

**Abordagem:** Acrescentar “Materiais” na navegação, com submenu “Bmad guide” apontando para `/bmadguide/output/bmad-guide-neural-hub/index.html`. Usar a Story 10.1 como contexto da homepage e preservar a alteração anterior do CTA.

## Implementação e aceite

- Menu com `details`/`summary` nativos, abertura por clique e teclado, fechamento com Escape e saída do foco.
- Estilo acompanha a homepage; navegação compacta até 1100 px para acomodar o item novo.
- Cópia integral, sem alterações de conteúdo, do guia indicado para `public/bmadguide/output/bmad-guide-neural-hub/`. Vite distribui HTML, CSS, JavaScript, fontes, PDFs e subpáginas no mesmo caminho da URL. A cópia pública não é ignorada pelo Git.
- ESLint ignora somente a cópia gerada para distribuição. A configuração do Vite permanece como estava antes desta tarefa.

## Verificação — 13/10/2026

- Runtime: Node 24.21.0, npm 11.19.0.
- `npm run typecheck`: passou.
- `npm test`: 127 testes passaram em 22 arquivos. Os testes existentes registraram abortos de iframes externos, sem falhas.
- `npm run build`: passou. Cópias de origem, `public` e `dist` comparadas byte a byte, sem diferenças.
- Lint de `src/NeuralHubHome.jsx` e `eslint.config.js`: passou. `git diff --check` passou.
- `npm run lint`: bloqueado por 158 erros preexistentes em `bmadguide/dist/assets/` e `bmadguide/output/bmad-guide-neural-hub/assets/`. Não foi declarado resultado global verde; pendência de integração dos artefatos externos com os gates da Epic 13.
- Chrome real no preview do build: submenu e navegação até o título do guia confirmados; Enter, Tab e Escape verificados. Layout inspecionado em 1440, 901, 390 e 320 px; revisão independente também conferiu 1101 px. Sem overflow horizontal.
- Guia, CSS, scripts, fonte, subpáginas `demo`/`about` e PDF retornaram HTTP 200. Console do guia sem erros ou avisos.
- Revisão independente encontrou dependência de output local ignorado e compressão do CTA em 901 px; ambos corrigidos. Nenhum bloqueador restante na revisão final.
- Implementação local. Sem commit, push ou deploy; status da Story 10.1 e tracker preservados.

## Ordem sugerida de revisão

- Submenu e destino do guia.
  [NeuralHubHome.jsx:432](../../src/NeuralHubHome.jsx#L432)
- Conteúdo estático servido na URL solicitada.
  [index.html:1](../../public/bmadguide/output/bmad-guide-neural-hub/index.html#L1)
- Exclusão da cópia gerada nos gates de lint.
  [eslint.config.js:23](../../eslint.config.js#L23)

## Publicação autorizada — 13/10/2026

O usuário autorizou explicitamente commit local, push para o GitHub e deploy em produção. Escopo de publicação: menu, guia estático, exclusão da cópia gerada no ESLint e esta evidência. A alteração anterior de `FinalCTA` e as demais mudanças locais permanecem fora deste commit. Destinos conferidos: `Andre-cardia/Mentoria-IA`, branch `master`, projeto Vercel `mentoria-ia`, domínio `neuralhub.ia.br`.

Validação da árvore exata preparada para publicação, em cópia isolada e com Node 24.21.0/npm 11.19.0: build, typecheck e lint dos arquivos alterados passaram; distribuição do guia foi comparada sem diferenças. O lint global dessa árvore encontrou 9229 erros e 4 avisos, principalmente no AIOX ainda versionado. Os testes dessa árvore têm 17 arquivos com falha e 5 aprovados: setup de browser com `expect` não definido e dois mocks de avatar inconsistentes. A mesma execução no baseline anterior produziu exatamente as mesmas falhas (41 testes aprovados, dois reprovados; demais suítes impedidas pelo setup). As correções locais desses testes e a remoção local do AIOX não pertencem à alteração do menu e foram preservadas fora da publicação. A evidência anterior de 127 testes aprovados corresponde à árvore de trabalho local, que contém essas correções pendentes.
