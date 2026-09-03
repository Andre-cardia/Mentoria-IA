# Epic 13 Context: Fundacao de Qualidade e Gates Executaveis

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Estabelecer uma fundacao de qualidade reproduzivel para o projeto JavaScript/JSX, com lint, typecheck, testes e build executados como gates reais antes de qualquer deploy. A epic deve eliminar falsos verdes, alinhar desenvolvimento local, CI e Vercel ao Node 24 LTS e tornar verificavel que todo codigo e teste de primeira parte relevante participa dos gates, sem alterar comportamento de produto, MVP, UI/UX, dados, APIs ou autenticacao.

## Stories

- Story 13.1: Definir o contrato de lint e typecheck para JavaScript/JSX
- Story 13.2: Implementar os gates e eliminar o baseline bloqueante
- Story 13.4: Garantir descoberta e ambiente corretos dos testes
- Story 13.3: Bloquear deploy quando os gates falharem

## Requirements & Constraints

- Os quatro gates canonicos sao lint, typecheck, testes e build. Todos devem executar em instalacao limpa, produzir exit code confiavel e falhar diante de erro; o lint deve operar sem warnings aceitos. O preflight de runtime e um guard auxiliar obrigatorio antes da instalacao e tambem a primeira operacao de cada script canonico, sem substituir nenhum dos quatro gates.
- O runtime-alvo e Node `>=24.20.0 <25`. Evidencias locais e de CI devem registrar as versoes efetivas de Node e npm e comprovar que o runtime satisfaz esse intervalo antes da instalacao e dos gates.
- A base permanece JavaScript/JSX. O typecheck deve usar TypeScript em modo `checkJs`, sem emissao e sem converter a aplicacao integralmente para TypeScript.
- O baseline bloqueante deve ser medido antes da remediacao, com inventario de arquivos, comandos, exit codes, ambiente, commit e hash do lockfile suficientes para repeticao e comparacao do resultado.
- Configuracoes e scripts que definem os gates tambem devem estar dentro do escopo de lint e typecheck; nao e aceitavel obter verde por ignores amplos, globs incompletos, supressoes globais ou reducao artificial de cobertura.
- A suite deve descobrir todos os testes de primeira parte existentes. Testes de browser e testes Node/API precisam ter ambientes explicitamente apropriados, sem um ambiente global que esconda incompatibilidades por contexto.
- A CI deve executar os quatro gates em ordem fail-closed antes do deploy. Um gate vermelho precisa impedir os passos posteriores e isso deve ser provado em fluxo seguro, nao produtivo e com restauracao do estado limpo; nao se cria deploy de pull request apenas para essa prova.
- O deploy continua restrito ao evento confiavel ja aprovado em `push` para `master`. Secrets e configuracao de deploy nao podem ser antecipados para etapas de instalacao ou verificacao.
- A configuracao efetiva da Vercel deve usar Node 24 conforme a fonte de verdade declarada pelo projeto e, apos configuracao ou deploy explicitamente autorizado, registrar o runtime efetivo de Build/Functions. Evidencia de CI nao substitui essa prova.
- Nenhuma story desta epic autoriza por si so commit, push, PR, release, mudanca de producao, deploy ou uso de secrets. Alteracoes devem permanecer limitadas a tooling, testes e CI previstos na story em execucao.

## Technical Decisions

- O contrato separa configuracao de browser e configuracao Node para lint e typecheck, cobrindo tanto codigo de aplicacao quanto servidor, API, configuracoes e scripts operacionais.
- `package.json#engines.node` deve expressar o intervalo `>=24.20.0 <25` e servir como contrato compartilhado entre instalacao local, CI e Vercel; a CI pode resolver a linha Node 24, mas deve validar e registrar a versao concreta obtida.
- `.npmrc` deve aplicar `engine-strict=true`; os quatro scripts e verificadores auxiliares chamam o mesmo preflight compartilhado, impedindo execucao local verde fora do runtime alvo.
- As versoes de tooling e seus peers diretos e transitivos precisam formar uma arvore de dependencias valida e reproduzivel. Versoes normativas devem ser gravadas com `--save-exact`, reinstaladas por `npm ci` a partir do lockfile final e verificadas com `npm ls`, sem aceitar uma arvore npm marcada como invalida.
- O preflight deve residir em `scripts/check-node-version.js`, usar somente APIs nativas do Node, rejeitar versoes fora de `>=24.20.0 <25` com exit code `1` e permanecer coberto pelos escopos Node de lint e typecheck.
- `@vitest/eslint-plugin@1.6.27` nao pertence a arvore inicial porque seu peer transitivo aceita TypeScript `<6.1.0`; testes importam APIs Vitest explicitamente ate existir versao compativel com TypeScript 7 e ESLint 10.
- O snapshot de 118 arquivos e historico. `scripts/check-quality-scope.js` deve recalcular o inventario e provar igualdade entre filesystem, ESLint e a uniao disjunta dos projetos TypeScript; `scripts/**/*.js` e `eslint.config.js` pertencem ao contexto Node ESM, sem globals CommonJS.
- A descoberta/ambiente usa dois `test.projects` Vitest 4 com `globals: false`: `src/**/*.{test,spec}.{js,jsx}` em `happy-dom` com `src/test/setup.js` importando `@testing-library/jest-dom/vitest`, e `server/**/*.{test,spec}.{js,jsx}` + `api/**/*.{test,spec}.{js,jsx}` + `scripts/**/*.{test,spec}.{js,jsx}` em `node`; `quality:test-scope` usa `vitest list --project` e exige que todo teste case exatamente um projeto.
- Os canarios usam diretorios imprevisiveis dentro de `src/`/`scripts/`, validam o codigo TypeScript/ID ESLint esperado e uma fase corrigida, fingerprintam caminho/modo/conteudo, detectam mudanca concorrente e limpam somente arquivos de identidade comprovada, sem restauracao ampla do checkout.
- Supressoes TypeScript/ESLint inline sao proibidas byte a byte nesta epic, com `noInlineConfig: true`; qualquer excecao futura exige nova decisao arquitetural.
- A CI executa `preflight` antes de `npm ci`, roda lint/typecheck antes dos canarios, tem job `quality` em PR sem secrets/comando Vercel, job `deploy-eligibility` causal por `needs` e job `deploy` dependente de ambos, restrito a push em `master`; Actions e Vercel CLI sao fixados por SHA/versao exata.
- A Vercel executa preflight antes de `npm ci` no Install Command e novamente no Build Command; a prova de preview usa o workflow manual persistente e protegido da branch padrao, faz checkout apenas de SHA completo associado a PR/run `quality` verde, e usa probe local/metadata/cleanup temporarios e recuperaveis. A Story 13.3 tambem prova imediatamente antes do deploy que nao existe integracao produtiva paralela capaz de contornar o workflow protegido.
- Rollback de enforcement nao pode reabrir deploy sem protecao. Deve restaurar workflow anteriormente comprovado com gates ou desabilitar deploy ate nova validacao verde.

## Cross-Story Dependencies

- A Story 13.1 define e valida o contrato consumido pelas demais; a Story 13.2 so pode iniciar depois que a revisao independente estiver aprovada e todos os achados estiverem resolvidos ou explicitamente encaminhados sem lacuna normativa remanescente.
- A Story 13.2 implementa tooling, preflight de runtime, inventario e baseline. A Story 13.4 depende desses gates locais para corrigir e provar descoberta e ambientes dos testes.
- A Story 13.3 depende das Stories 13.2 e 13.4, pois a CI so pode ser considerada fail-closed depois que o comando de testes executar a suite completa no ambiente correto.
- A Story 11.9 permanece bloqueada ate a conclusao comprovada da Story 13.3; somente entao seu fluxo de UI pode ser revalidado sob os novos gates.
