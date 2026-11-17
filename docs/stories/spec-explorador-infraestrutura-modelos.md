---
title: 'Explorador interativo da infraestrutura de modelos'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'one-shot'
---

# Explorador interativo da infraestrutura de modelos

## Intent

**Problem:** O usuário quer um formulário interativo que demonstre o funcionamento e a infraestrutura do GPT-6 Astra e do DeepSeek V4.1 Flash.

**Approach:** Página educativa independente em `public/infra-modelos/`, com formulário, percurso selecionável, arquitetura, infraestrutura física e treinamento. O usuário autorizou explicitamente trabalhar neste diretório com alterações existentes. A página usa dados locais e fontes públicas verificadas em 15/09/2026, sem chamadas de inferência. A rota one-shot se aplica porque são apenas arquivos estáticos novos, sem consumidores existentes ou mudanças em configuração, autenticação e rotas.

## Tasks & Acceptance

- [x] Criar `public/infra-modelos/index.html`, `styles.css` e `app.js`.
- [x] Dado um modelo selecionado, quando o usuário mudar cenário ou etapa, então explicação e diagrama correspondem à seleção.
- [x] Dado DeepSeek, quando alterar contexto ou concorrência, então a estimativa parcial de KV global usa 890 bytes/token; para Astra, indicar indisponibilidade de dados.
- [x] Dado acesso móvel ou teclado, quando explorar todas as etapas, então controles e detalhes permanecem legíveis e operáveis.
- [x] Dado o cenário educativo, quando inserir prompt, então sua representação permanece texto inerte e nenhuma API é chamada.
- [x] Revisar os novos arquivos e executar os gates do projeto e a verificação real no navegador.

## Boundaries

Arquitetura do Astra não divulgada não recebe números ou mecanismos inventados. Infraestrutura de datacenter é esquema conceitual, não inventário dos provedores. Pesos, parâmetros ativos e cache são conceitos separados. Não há necessidade de autenticação: página educativa independente, sem fluxo de usuário protegido.

## Verification

- Execução em 15/09/2026, concluída aproximadamente às 03:15 UTC. Node 24.20.0 via `npm exec --package=node@24.20.0`; npm 11.12.1.
- `npm run lint`, `npm run typecheck` e `npm run build`: saída 0. O typecheck cobre os escopos existentes do projeto; o JavaScript estático novo foi verificado por lint, `node --check` e execução no navegador.
- `npm test`: 22 arquivos e 127 testes passaram. Houve mensagens de abort/network em iframes YouTube/Vimeo de testes existentes, sem falha de teste.
- Comparação `cmp` confirmou que os três arquivos publicados em `dist/infra-modelos/` são iguais aos de `public/infra-modelos/`.
- Navegador real: 78 asserções de DOM passaram, percorrendo ambos os modelos, quatro visões e todas as etapas. Cobriram anterior/próximo, ferramenta opcional, troca de hospedagem, prompt vazio, HTML inerte, prompt longo e envio com foco.
- Memória: 1.000 tokens × 1 sessão = 0,85 MiB; 1.000.000 × 64 = 53,05 GiB. Valores parciais de KV, nunca memória total.
- Mobile 320 px: oito combinações de modelo e visão, com prompt de 500 caracteres sem espaços, sem overflow horizontal. Inspeção visual de screenshots desktop 1360 px e mobile 390/320 px. Tab + Enter selecionou corretamente a segunda etapa e manteve foco visível.
- Revisão BMAD por subagente: 12 achados atendidos, incluindo precisão adaptativa da memória, entrada numérica, descrições acessíveis, anúncio curto de seleção, semântica das setas, quebra de texto e evidências. Nenhum item adiado.
- Acesso local: `http://127.0.0.1:4187/infra-modelos/index.html`. No Vite, usar explicitamente `index.html`: a URL apenas com diretório cai no fallback da landing page existente. A abertura no painel Codex foi solicitada e retornou `queued`.
- Sem commit, push ou deploy. Não houve mudanças nos arquivos existentes do aplicativo.

## Suggested Review Order

- Entrada e controles da experiência.
  [index.html](../../public/infra-modelos/index.html)
- Conteúdo, fontes e cálculo do simulador.
  [app.js](../../public/infra-modelos/app.js)
- Responsividade e foco de teclado.
  [styles.css](../../public/infra-modelos/styles.css)
