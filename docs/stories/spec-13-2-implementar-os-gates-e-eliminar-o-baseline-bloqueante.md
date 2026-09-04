---
title: 'Story 13.2: Implementar os gates e eliminar o baseline bloqueante'
type: 'chore'
created: '2026-09-02'
status: 'done'
review_loop_iteration: 0
baseline_commit: 'e4b69687a52cd0681cfc848e794cfb907d976382'
context:
  - '{project-root}/docs/architecture/quality-gates.md'
  - '{project-root}/docs/stories/epic-13-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** O repositório não possui gates reais de lint e typecheck e aceita falha no lifecycle `prepare`, impedindo uma validação reproduzível da base JavaScript/JSX. O baseline precisa ser medido e eliminado sem alterar comportamento de produto nem ocultar diagnósticos.

**Approach:** Materializar integralmente o contrato aprovado da Story 13.1 em Node `>=24.20.0 <25`: preflight nativo, dependências fixas, ESLint flat, dois projetos `checkJs`, inventário dinâmico, canários negativos e remediações estritamente mecânicas, com evidência antes/depois.

## Boundaries & Constraints

**Always:** Preservar as remoções AIOX já presentes em `package.json`/lockfile; usar npm e os pins do contrato; executar preflight antes da instalação, repetir `npm ci` sobre o lockfile final e exigir `npm ls --all` válido; cobrir todo JS/JSX próprio; manter `test`/`build`; registrar runtime, exits, inventário, diagnósticos e hash do lockfile.

**Ask First:** Parar e pedir nova decisão se um diagnóstico exigir alteração de lógica, UI, API, autenticação, schema, dados, asserções ou timing; pedir autorização separada para commit, push, PR, release, deploy, secrets ou qualquer mudança externa.

**Never:** Editar `vite.config.js`, CI ou Vercel; antecipar 13.4/13.3; usar supressões amplas, gates permissivos, `--force`, `--legacy-peer-deps`, escopo artificial ou migração integral para TypeScript. `quality:test-scope` deve existir, mas só ficará verde na 13.4.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Runtime | Node estável na major 24, minor >=20 | Preflight informa versão e retorna `0` | Fora do range/formato retorna `1` |
| Escopo | Filesystem, ESLint e jsconfigs contêm os mesmos arquivos | `quality:scope` lista caminhos e retorna `0` | Falta, duplicidade, supressão ou erro interno retorna `1`/`2` |
| Canário concorrente | Caminho reservado já existe ou sua identidade muda | O arquivo alheio é preservado e a prova falha explicitamente | `finally` remove apenas o arquivo criado e ainda idêntico |

</frozen-after-approval>

## Code Map

- `docs/architecture/quality-gates.md:70` — contrato normativo; não rediscutir versões ou configuração.
- `package.json:5`, `package-lock.json:1` — ESM e árvore npm já alterada pela migração; preservar o delta existente.
- `eslint.config.js`, `jsconfig*.json` — novos gates separados de browser/Node.
- `scripts/check-node-version.js`, `scripts/verify-node-version.js` — novo preflight nativo e matriz de versões.
- `scripts/check-quality-scope.js`, `scripts/verify-quality-canaries.js` — cobertura dinâmica e provas negativas seguras.
- `landing_page_mentoria_ia_react.jsx:125`, `src/`, `server/`, `api/`, `*.jsx` — baseline próprio; só remediação mecânica nominalmente registrada.
- `vite.config.js:30`, `.github/workflows/deploy.yml:8`, `vercel.json` — somente leitura para 13.4/13.3.
- `docs/stories/quality-gate-logs/` — evidência bruta/final; testes ainda descobrem 15 de 17 arquivos até a 13.4.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json` — adicionar `engines`, scripts e pins exatos; tornar `prepare` fail-closed e reconstruir a árvore preservando a migração.
- [x] `eslint.config.js`, `jsconfig.quality.base.json`, `jsconfig.browser.json`, `jsconfig.node.json` — implementar contextos/escopos aprovados.
- [x] `scripts/*.js` — implementar preflight, inventário e canários com APIs nativas, exits definidos, timeout de 60 s e limpeza por identidade.
- [x] `src/**/*.{js,jsx}`, `server/**/*.js`, `api/**/*.js`, `*.jsx` — medir e remediar somente diagnósticos mecânicos/JSDoc comprovado, registrando cada path.
- [x] `docs/stories/quality-gate-logs/`, esta spec e `docs/stories/sprint-status.yaml` — registrar evidência, File List e estado BMAD.

### Review Findings

- [x] [Review][Patch] `quality:test-scope` não valida o projeto Node nem atribuição única [scripts/check-quality-scope.js:300]
- [x] [Review][Patch] Segundo sinal durante limpeza dos canários é ignorado [scripts/verify-quality-canaries.js:348]
- [x] [Review][Patch] Fingerprint dos canários exclui componentes JSX da raiz [scripts/verify-quality-canaries.js:58]
- [x] [Review][Patch] Symlink JSX na raiz é ignorado pelo inventário [scripts/check-quality-scope.js:122]
- [x] [Review][Patch] Listagem TypeScript descarta caminhos externos além dos permitidos [scripts/check-quality-scope.js:230]
- [x] [Review][Patch] Auto-testes obrigatórios do verificador de escopo não foram materializados [scripts/check-quality-scope.js:281]
- [x] [Review][Patch] Timeout do verificador de escopo não encerra a árvore de subprocessos [scripts/check-quality-scope.js:147]
- [x] [Review][Patch] Canários podem operar fora do checkout se diretório-fonte for symlink [scripts/verify-quality-canaries.js:28]
- [x] [Review][Patch] Escrita de arquivo-canário não trata gravação parcial [scripts/verify-quality-canaries.js:106]
- [x] [Review][Patch] Canário negativo pode aceitar subprocesso terminado por sinal [scripts/verify-quality-canaries.js:259]
- [x] [Review][Patch] Mutação concorrente não é conferida após falha de subprocesso [scripts/verify-quality-canaries.js:249]
- [x] [Review][Patch] Restaurar bloqueio do `ProfileGuard` até `checked` [src/plataforma/components/ProfileGuard.jsx:89] — decisão humana: preservar o comportamento de autenticação anterior.
- [x] [Review][Patch] Resposta antiga pode reexibir aviso dispensado [src/plataforma/components/AdminAnnouncements.jsx:128]
- [x] [Review][Patch] Interromper o fluxo de canários após `SIGINT` ou `SIGTERM` [scripts/verify-quality-canaries.js:343]
- [x] [Review][Patch] Rejeitar entrada não regular dentro do escopo da raiz [scripts/check-quality-scope.js:116]
- [x] [Review][Patch] Completar auto-testes de cleanup, segundo sinal e entrada desconhecida [scripts/check-quality-scope.js:285]
- [x] [Review][Patch] Exigir diagnóstico exclusivo no canário de supressão [scripts/verify-quality-canaries.js:283]
- [x] [Review][Patch] Cobrir a resposta tardia após dispensar aviso [src/plataforma/__tests__/AdminAnnouncements.test.jsx:43]
- [x] [Review][Patch] Encerrar a árvore de subprocessos também no Windows [scripts/verify-quality-canaries.js:29]

**Acceptance Criteria:**
- Given runtimes alvo e inválidos, when o preflight é verificado, then cada caso retorna o exit/diagnóstico normativo sem dependências.
- Given o lockfile final, when `npm ci`/`npm ls --all` rodam no Node alvo, then a árvore exata não tem peers inválidos ou `problems`.
- Given o filesystem próprio, when `quality:scope` roda, then ESLint/jsconfigs cobrem cada arquivo uma vez e rejeitam supressões proibidas.
- Given canários isolados, when a prova roda, then cada regra/contexto falha pelo motivo esperado, preserva concorrência e restaura lint/typecheck verdes.
- Given o baseline remediado, when lint, typecheck, teste e build rodam após instalação limpa, then retornam `0`, sem alegar descoberta integral antes da 13.4 nem mudar comportamento.

## Spec Change Log

- 2026-09-02: implementação concluída localmente; evidência em [quality-gate-logs/2026-09-02-story-13-2.md](quality-gate-logs/2026-09-02-story-13-2.md). `quality:test-scope` permanece deliberadamente vermelho até a Story 13.4.
- 2026-09-02: patches da revisão preservam callback assíncrono, detectam mutação concorrente por subprocesso, exercitam todos os marcadores de supressão, fecham extensões executáveis sem contrato na raiz e encerram subprocessos em sinais.
- 2026-09-04: revisão adversarial concluída; os gates normativos passaram em Node 24.20.0. O auto-teste agora prova dois sinais em subprocesso, a resposta tardia de avisos é coberta em `StrictMode` e o encerramento de árvores contempla Windows.

## File List

- Tooling: `package.json`, `package-lock.json`, `.npmrc`, `eslint.config.js`, `jsconfig*.json` e `scripts/*.js`.
- Patches de revisão: `src/components/blog/FeaturedPost.jsx` sincroniza `onFeaturedIdRef` por efeito dependente; `scripts/check-quality-scope.js` rejeita `.cjs`, `.mjs`, `.ts`, `.tsx`, `.cts`, `.mts` e variantes sem contrato também na raiz; `scripts/verify-quality-canaries.js` compara fingerprint após cada subprocesso, prova cada marcador proibido com limpeza por identidade e encerra grupos de subprocessos em `SIGINT`/`SIGTERM`; `package.json` declara `packageManager: npm@11.12.1` e `package-lock.json` foi reproduzido nesse npm.
- Remediações JavaScript/JSX: contratos JSDoc locais, estilos React, props, eventos, mocks e efeitos necessários para os gates, incluindo os novos módulos `src/plataforma/context/auth-context.js`, `src/plataforma/context/useAuth.js` e `src/plataforma/lib/lesson-embed.js`.
- Evidência: [quality-gate-logs/2026-09-02-story-13-2.md](quality-gate-logs/2026-09-02-story-13-2.md).

## Design Notes

O shell atual usa Node `25.9.0` e só serve à prova negativa. Instalação/gates usam Node alvo; o inventário é recalculado após criar os novos arquivos.

## Verification

**Commands:**
- `npm run verify:preflight && npm run preflight` — matriz correta e runtime alvo aceito.
- `npm ci && npm ls --all` — lockfile reproduzido sem problemas.
- `npm run quality:scope && npm run verify:quality-canaries` — cobertura e falhas negativas comprovadas com limpeza.
- `npm run lint && npm run typecheck && npm test && npm run build` — quatro gates verdes no Node alvo, com escopo provisório de testes documentado.
- `git diff --check` — sem erros de whitespace.

## Suggested Review Order

**Contrato executável**

- Centraliza preflight, gates canônicos e runtime npm reproduzível.
  [`package.json:7`](../../package.json#L7)

- Separa regras browser, Node e testes sem permitir supressões inline.
  [`eslint.config.js:11`](../../eslint.config.js#L11)

- Mantém `checkJs` sem emissão em projetos de contexto distintos.
  [`jsconfig.quality.base.json:3`](../../jsconfig.quality.base.json#L3)

**Provas negativas e cobertura**

- Valida runtime-alvo com função pura e entrypoint nativo.
  [`check-node-version.js:6`](../../scripts/check-node-version.js#L6)

- Compara inventário, ESLint e TypeScript, bloqueando supressões e extensões inválidas.
  [`check-quality-scope.js:240`](../../scripts/check-quality-scope.js#L240)

- Exercita falhas negativas, concorrência e limpeza por identidade.
  [`verify-quality-canaries.js:221`](../../scripts/verify-quality-canaries.js#L221)

**Remediações de baseline**

- Sincroniza callback assíncrono sem reiniciar a consulta de destaque.
  [`FeaturedPost.jsx:9`](../../src/components/blog/FeaturedPost.jsx#L9)

- Preserva o fluxo temporal enquanto elimina estado síncrono no efeito.
  [`NeuralHubHome.jsx:221`](../../src/NeuralHubHome.jsx#L221)

**Evidência e limite conhecido**

- Registra runtime, lockfile, inventário e todos os exits finais.
  [`2026-09-02-story-13-2.md:3`](quality-gate-logs/2026-09-02-story-13-2.md#L3)

- Delimita explicitamente os dois testes ainda pertencentes à Story 13.4.
  [`2026-09-02-story-13-2.md:36`](quality-gate-logs/2026-09-02-story-13-2.md#L36)
