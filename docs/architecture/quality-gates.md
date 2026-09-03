# Contrato Arquitetural de Quality Gates para JavaScript/JSX

## Metadados da decisao

- **Story:** 13.1 — Definir o contrato de lint e typecheck para JavaScript/JSX
- **Status da decisao:** Aprovada na Iteracao 6 apos revisao independente e patches documentais
- **Autor:** @architect (Aria); revisao de runtime @architect (Winston)
- **Data de verificacao:** 2026-09-02
- **Runtime de referencia:** baseline observado Node.js 20 no CI; alvo Node.js `24.x`
- **Implementacao:** Stories 13.2, 13.4 e 13.3

## 1. Resumo executivo

O repositorio deve adotar dois gates novos, reais e independentes do build:

1. `npm run lint`, executado por ESLint 10 em flat config ESM, cobrindo JavaScript e JSX de primeira parte nos contextos browser, Node, React e Vitest. Testes importam as APIs do Vitest explicitamente; o contrato nao instala `@vitest/eslint-plugin` enquanto seu peer transitivo nao aceitar TypeScript 7.
2. `npm run typecheck`, executado pelo compilador TypeScript 7 com `allowJs`, `checkJs` e `noEmit`, dividido em projetos browser e Node para impedir contaminacao de globals entre ambientes.

Os quatro gates normativos passam a ter uma unica fonte de verdade em `package.json`: `lint`, `typecheck`, `test` e `build`. A Story 13.2 deve implementar o tooling e remediar somente o baseline bloqueante em Node 24. A Story 13.4 deve tornar a descoberta e o ambiente dos testes explícitos antes de a Story 13.3 executar os mesmos comandos no CI em Node 24, depois de `npm ci` e antes do deploy, sem disponibilizar secrets aos passos de qualidade.

Esta decisao nao altera produto, codigo, dependencias ou CI. Ela define o contrato que as stories seguintes devem materializar.

## 2. Contexto brownfield verificavel

### 2.1 Stack e runtime atuais

| Item | Estado verificado | Evidencia local |
|---|---|---|
| Modulos | ESM por `"type": "module"` | `package.json:5` |
| React | `18.3.1` | `package.json:38-39`; `package-lock.json` |
| Vite | linha 6; lock atual `6.4.2` | `package.json:56`; `package-lock.json` |
| Vitest | `4.1.2` | `package.json:57`; `package-lock.json` |
| Plugin React/Vite | lock atual `4.7.0` | `package-lock.json` |
| Gerenciador | npm com `package-lock.json` | `package-lock.json` |
| CI | Node 20, `npm ci`, deploy direto — baseline histórico a migrar | `.github/workflows/deploy.yml:8-25` |
| Testes | `vitest run` | `package.json:12` |
| Build | `vite build` | `package.json:8` |
| Lint | ausente | `package.json:6-15` |
| Typecheck | ausente | `package.json:6-15` |

Node 20 é apenas o baseline verificável do workflow vigente; não é o runtime futuro desta epic. A linha está EOL e não recebe mais atualizações de segurança. O alvo ratificado é Node 24.x: é a LTS atual, é suportado como padrão pela Vercel e é aceito pelo ESLint 10. [Node.js EOL](https://nodejs.org/en/about/eol), [Vercel: versões Node.js suportadas](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [ESLint Getting Started](https://eslint.org/docs/latest/use/getting-started)

### 2.2 Inventario de JavaScript/JSX

O contrato preserva dois marcos distintos: o commit imutavel `e4b69687a52cd0681cfc848e794cfb907d976382` contem 117 arquivos no recorte (80 `src`, 17 `server`, 15 `api`, quatro JSX de raiz e `vite.config.js`); o snapshot do workspace usado na decisao contem 118 porque inclui `server/adapters/openai-conversions-adapter.js`, concorrente e nao rastreado. A tabela abaixo descreve o workspace, nao o commit isolado.

| Contexto no snapshot do workspace | Arquivos | Papel |
|---|---:|---|
| `src/` | 80 | browser, React, hooks e 11 testes Vitest/happy-dom |
| `server/` | 18 | Node/Express e 3 testes Vitest |
| `api/` | 15 | funcoes Node/Vercel e 3 testes Vitest |
| Raiz `*.jsx` | 4 | entry components browser importados por `src/` |
| `vite.config.js` | 1 | configuracao Node de Vite e Vitest |
| **Total do snapshot do workspace** | **118** | escopo integral observado de lint e typecheck |

O numero de 113 registrado na Epic 13 e um snapshot historico do workspace para `src/`, `server/` e `api/`, nao uma contagem reproduzivel do commit. O contrato inclui tambem os cinco arquivos executaveis da raiz, evitando um falso verde por omissao. Depois da criacao de `eslint.config.js` e de `scripts/**/*.js`, a Story 13.2 deve recalcular o conjunto a partir do filesystem e nunca comparar a cobertura contra 117/118 nem tratar o commit isolado como inventario completo do checkout.

Existem 17 arquivos de teste: 11 em `src/`, 3 em `server/` e 3 em `api/`. Todos entram em lint e typecheck. O `include` atual do Vitest referencia somente um teste de `api/`; a Story 13.4 deve eliminar essa omissao e declarar o ambiente de cada contexto sem ampliar a Story 13.2 ou alterar comportamento de produto.

### 2.3 Restricoes atuais relevantes

- Nao ha `eslint.config.*`, `.eslintrc*`, `tsconfig*.json` ou `jsconfig*.json` de projeto.
- O codigo browser usa JSX automatico em parte da base: 20 dos 75 arquivos JSX nao importam `React` diretamente.
- Importacoes browser usam extensoes omitidas, comportamento resolvido pelo bundler.
- `server/` e `api/` usam ESM com extensoes `.js` nas importacoes relativas.
- Os testes importam APIs do Vitest explicitamente; `vite.config.js` tambem declara `globals: true`.
- Scripts operacionais novos em `scripts/**/*.js`, inclusive o preflight e os verificadores de escopo/canario, sao codigo Node de primeira parte e entram em lint e typecheck.
- Artefatos gerados, de framework ou locais incluem `node_modules/`, `dist/`, `build/`, `.vite/`, `.vercel/`, coverage, `_bmad/`, `_bmad-output/`, `.agents/` e `.claude/`.

## 3. Decisoes de tooling e compatibilidade

### 3.1 Versoes iniciais normativas

A Story 13.2 deve instalar estas versoes iniciais como `devDependencies` por um comando npm normal, deixando o lockfile registrar a arvore exata:

| Pacote | Versao inicial | Motivo |
|---|---:|---|
| `eslint` | `10.9.1` | linha atual mantida; flat config; suporte oficial a Node `>=24` |
| `@eslint/js` | `10.0.1` | regras JavaScript recomendadas, peer de ESLint 10 |
| `globals` | `17.11.0` | globals separados para browser e Node |
| `eslint-plugin-react-hooks` | `7.1.1` | regras oficiais de Hooks e flat config |
| `eslint-plugin-react-refresh` | `0.5.5` | preset Vite para seguranca de Fast Refresh |
| `typescript` | `7.0.2` | `tsc` atual, usado apenas pela CLI para checkJs/noEmit |
| `@types/node` | `24.13.3` | tipos da linha 24, publicados no npm e compatíveis com o mínimo de runtime ratificado |
| `@types/react` | `18.3.31` | tipos alinhados ao React 18, sem trazer React 19 |
| `@types/react-dom` | `18.3.7` | tipos alinhados ao React DOM 18 |
| `@types/express` | `5.0.6` | Express 5 nao publica tipos proprios |
| `@types/cors` | `2.8.19` | `cors` nao publica tipos proprios |
| `@types/supertest` | `7.2.1` | `supertest` nao publica tipos proprios |

As versoes ESLint/React/Vite acima foram verificadas contra metadados versionados do registro npm. React 18.3.1 declara `>=0.10.0`; Vite 6.4.2 declara `^18.0.0 || ^20.0.0 || >=22.0.0`; Vitest 4.1.2 declara `^20.0.0 || ^22.0.0 || >=24.0.0`; ESLint 10.9.1 declara `^20.19.0 || ^22.13.0 || >=24`. Node `24.20.0` satisfaz todos esses intervalos. [Vite 6.4.2 no npm](https://registry.npmjs.org/vite/6.4.2), [Vitest 4.1.2 no npm](https://registry.npmjs.org/vitest/4.1.2), [ESLint 10.9.1 no npm](https://registry.npmjs.org/eslint/10.9.1)

TypeScript 7.0.2 e apropriado porque o contrato usa somente o binario `tsc`, nao sua API programatica. A versao 7 nao expoe API estavel, mas a documentacao oficial confirma compatibilidade de CLI/typechecking com a linha 6 e recomenda uso direto do compilador em cenarios sem plugins de language service. [Anuncio oficial TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)

Os tipos React sao deliberadamente fixados na linha 18. Instalar os `latest` atuais de `@types/react` e `@types/react-dom` traria tipos React 19 para um runtime React 18, criando diagnosticos artificiais.

`@vitest/eslint-plugin@1.6.27` foi retirado da arvore normativa: ele depende de `@typescript-eslint/utils@^8.58.0`, cujo peer de TypeScript e `>=4.8.4 <6.1.0`, incompatível com `typescript@7.0.2`. Como os 17 testes atuais importam `describe`, `it`, `expect`, `vi` e hooks diretamente de `vitest`, a configuracao de lint nao precisa declarar globals Vitest. Reavaliar o plugin exige nova story e uma versao cuja arvore aceite simultaneamente ESLint 10 e TypeScript 7. [Metadados versionados do plugin](https://registry.npmjs.org/@vitest%2feslint-plugin/1.6.27), [metadados de `@typescript-eslint/utils`](https://registry.npmjs.org/@typescript-eslint%2futils/8.69.0)

### 3.1.1 Prova reproduzivel da arvore normativa

Em 2026-09-02, uma copia temporaria de `package.json` e `package-lock.json` recebeu exatamente os pacotes da tabela, sem `@vitest/eslint-plugin`, usando Node `24.20.0` e npm `11.12.1`. O lockfile final temporario teve SHA-256 `2b7ce96c8bcfe44f98cd8a990ed17eee8bcdf3784460b1d0bedec374e9bc8740`. `npm ci` e `npm ls --all --json` terminaram com exit code `0`; o campo `problems` foi `[]`. O teste nao alterou o repositorio.

A Story 13.2 deve reproduzir, na raiz e no runtime alvo, esta sequencia normativa:

```sh
npm run preflight
npm ci
npm install --save-dev --save-exact eslint@10.9.1 @eslint/js@10.0.1 globals@17.11.0 eslint-plugin-react-hooks@7.1.1 eslint-plugin-react-refresh@0.5.5 typescript@7.0.2 @types/node@24.13.3 @types/react@18.3.31 @types/react-dom@18.3.7 @types/express@5.0.6 @types/cors@2.8.19 @types/supertest@7.2.1
npm ci
npm ls --all
```

O segundo `npm ci` e obrigatorio: os gates devem provar a arvore reconstruida pelo lockfile final, nao o `node_modules` incremental deixado por `npm install`. Qualquer `ERESOLVE`, peer `invalid`, item em `problems` ou exit code nao zero bloqueia a Story 13.2; `--force` e `--legacy-peer-deps` sao proibidos.

### 3.2 Politica de atualizacao

- A instalacao inicial deve usar as versoes exatas acima; `package-lock.json` e a fonte reproduzivel.
- Atualizacoes de major de ESLint, TypeScript, React types ou plugins exigem uma story propria com reexecucao dos quatro gates.
- Atualizacoes de patch/minor podem usar Renovate ou procedimento manual, mas nao podem ser mescladas sem os quatro gates verdes.
- `engines.node` deve ser `>=24.20.0 <25`: o mínimo ratificado é a LTS verificada em 2026-09-01; a Vercel resolve um range válido da major 24 para o patch corrente suportado.
- `.npmrc` deve conter `engine-strict=true`; assim `npm ci`/`npm install` diretos falham fora do range mesmo quando o operador ignora o comando recomendado. O preflight continua obrigatorio antes da instalacao para emitir o diagnostico canonico; o repositorio nao pode executar codigo antes de um usuario invocar o npm, portanto a garantia local e fail-closed por `engine-strict`, nao interceptacao de todo comando arbitrario.
- A Story 13.3 deve substituir o pin atual do CI por `actions/setup-node` em `24.x`, confirmar que a versão resolvida satisfaz `>=24.20.0 <25` e registrar `node --version`; o workflow atual em Node 20 continua somente como baseline até essa implementação.
- Atualizações de major de Node exigem story/correção de curso e reexecução dos quatro gates; patches do major 24 são absorvidos pela política `24.x` e revalidados pela CI.

## 4. Contrato de lint

### 4.1 Formato e comando canonico

- Arquivo: `eslint.config.js` na raiz.
- Formato: flat config ESM, coerente com `"type": "module"`.
- Script: `"lint": "npm run preflight && eslint . --max-warnings 0"`.
- Exit code: `0` somente com zero erros e zero warnings; `1` para violacoes; `2` para falha de configuracao/interna. [ESLint CLI](https://eslint.org/docs/latest/use/command-line-interface)

O orçamento de warnings e zero. Regras de corretude permanecem em `error`; regras de manutencao que presets classificarem como `warn` continuam visualmente distintas, mas tambem bloqueiam o gate por `--max-warnings 0`. Assim nao existe estoque invisivel de avisos novos.

### 4.2 Estrutura normativa da configuracao

O exemplo abaixo e o alvo da Story 13.2; ainda nao foi criado no repositorio:

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const testFiles = [
  '**/*.{test,spec}.{js,jsx}',
]

export default defineConfig([
  globalIgnores([
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.vite/**',
    '.vercel/**',
    '_bmad/**',
    '_bmad-output/**',
    '.agents/**',
    '.claude/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: 'error',
    },
  },
  {
    files: ['src/**/*.{js,jsx}', '*.jsx'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['server/**/*.js', 'api/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
    languageOptions: { globals: globals.nodeBuiltin },
  },
  {
    files: ['vite.config.js'],
    languageOptions: {
      globals: { ...globals.nodeBuiltin, __dirname: 'readonly' },
    },
  },
  {
    files: testFiles,
    // As APIs do Vitest devem ser importadas; nenhum global implicito e adicionado.
  },
])
```

Esta composicao segue o flat config oficial, no qual `files` e `ignores` sao avaliados por glob, e preserva o nucleo Hooks/Refresh do template React/JS fixado na secao 14. [Configuracao ESLint](https://eslint.org/docs/latest/use/configure/configuration-files), [ignores ESLint](https://eslint.org/docs/latest/use/configure/ignore)

### 4.3 Contextos e globals

| Contexto | Arquivos | Globals |
|---|---|---|
| Browser/React | `src/**/*.{js,jsx}`, `*.jsx` | `globals.browser` |
| Node ESM | `server/**/*.js`, `api/**/*.js`, `scripts/**/*.js`, `eslint.config.js` | `globals.nodeBuiltin`, sem `require`, `module`, `exports` ou `__dirname` CommonJS |
| Vite config | `vite.config.js` | `globals.nodeBuiltin` + `__dirname` readonly, excecao local exigida pelo loader/config atual |
| Vitest | `**/*.{test,spec}.{js,jsx}` | nenhum global adicional; APIs importadas de `vitest`, preservando globals do contexto hospedeiro |

Nao deve existir uma uniao global de browser e Node para toda a base. Isso esconderia, por exemplo, uso acidental de `process` no browser, `window` no servidor ou `require` em ESM. Arquivos auxiliares sem sufixo `test`/`spec`, mesmo sob `__tests__`, sao codigo hospedeiro comum e nao sao classificados como testes executaveis.

### 4.4 Regras e exclusoes deliberadas

- Habilitar `@eslint/js` recommended para erros JavaScript generalizaveis.
- Habilitar o preset flat recommended de `eslint-plugin-react-hooks`; as regras oficiais cobrem `rules-of-hooks`, `exhaustive-deps` e invariantes modernas do React. [React: eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
- Habilitar `reactRefresh.configs.vite`, coerente com o plugin React/Vite existente.
- Exigir imports explícitos das APIs do Vitest; nao instalar o plugin Vitest enquanto a arvore transitiva conflitar com TypeScript 7.
- Nao adicionar `eslint-plugin-react`: o template oficial Vite para JS/React usa Hooks e React Refresh sem esse plugin; adicionar outra superficie de regras nao e necessario para os objetivos desta epic.
- Nao adicionar Prettier ao gate: formatacao nao faz parte dos requisitos aprovados e nao deve ser acoplada a corretude.
- Nao usar `eslint:all`, pois novas versoes poderiam ativar regras sem revisao.
- Nao usar `eslint --fix` no comando de CI; correcoes devem ser deliberadas e revisaveis.

## 5. Contrato de typecheck para JavaScript/JSX

### 5.1 Mecanismo e comando canonico

O gate usa o compilador TypeScript sobre JavaScript real:

```json
{
  "typecheck": "npm run preflight && tsc -p jsconfig.browser.json && tsc -p jsconfig.node.json"
}
```

Cada projeto deve conter `allowJs: true`, `checkJs: true` e `noEmit: true`. `checkJs` reporta erros nos arquivos JavaScript incluidos, e `noEmit` impede que o gate gere ou substitua artefatos de build. [allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html), [checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html), [noEmit](https://www.typescriptlang.org/tsconfig/noEmit.html)

O comando nao chama Vite, nao e alias de `build`, nao usa `|| true`, nao redireciona exit code e nao aceita `--noCheck`. Um erro de qualquer projeto interrompe a cadeia com codigo diferente de zero.

### 5.2 Configuracao comum

Arquivo `jsconfig.quality.base.json`:

```json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noEmit": true,
    "target": "ES2022",
    "rootDir": ".",
    "moduleDetection": "force",
    "isolatedModules": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "strict": false,
    "noImplicitAny": false,
    "noImplicitThis": true
  },
  "files": []
}
```

`strict` e `noImplicitAny` ficam explicitamente desabilitados na adocao brownfield porque JavaScript sem anotacoes trata parametros nao documentados como `any`; habilita-los agora transformaria a Story 13.2 em migracao de tipos. Isso nao desativa o typecheck: `checkJs` continua produzindo diagnosticos semanticos sobre chamadas, propriedades, imports, JSX e JSDoc. Novos contratos criticos devem ganhar JSDoc, e o endurecimento de `strict` deve ocorrer por stories posteriores com baseline mensurado. [Type checking JavaScript](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html), [JSDoc suportado](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)

`skipLibCheck` se aplica apenas a declaracoes de dependencias; diagnosticos nos 118 arquivos de primeira parte continuam bloqueantes. Vite recomenda separar typecheck do build e documenta `tsc --noEmit` como gate independente. [Vite: TypeScript](https://vite.dev/guide/features.html#typescript)

### 5.3 Projeto browser/React

Arquivo `jsconfig.browser.json`:

```json
{
  "extends": "./jsconfig.quality.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "react", "react-dom"]
  },
  "include": ["src/**/*.js", "src/**/*.jsx", "*.jsx"]
}
```

`moduleResolution: "Bundler"` preserva o contrato real do Vite, inclusive imports relativos sem extensao. `jsx: "react-jsx"` corresponde ao runtime automatico usado pelos arquivos que nao importam React. `vite/client` fornece tipos para assets e `import.meta`. [moduleResolution](https://www.typescriptlang.org/tsconfig/moduleResolution), [JSX](https://www.typescriptlang.org/tsconfig/jsx.html), [Vite client types](https://vite.dev/guide/features.html#client-types)

### 5.4 Projeto Node/API/configuracao

Arquivo `jsconfig.node.json`:

```json
{
  "extends": "./jsconfig.quality.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "types": ["node", "vitest/config"]
  },
  "include": ["server/**/*.js", "api/**/*.js", "scripts/**/*.js", "vite.config.js", "eslint.config.js"]
}
```

`NodeNext` modela o ESM executado por Node e exige o mesmo comportamento de resolucao usado em runtime. `vitest/config` disponibiliza a extensao de tipos da propriedade `test` usada em `vite.config.js`, conforme a configuracao oficial do Vitest. `eslint.config.js` e todo `scripts/**/*.js` entram no mesmo projeto Node porque sao configuracoes/operacoes executaveis dos gates; eles nao podem escapar do typecheck que valida o proprio tooling. [Vitest config](https://vitest.dev/config/)

### 5.5 Prova de analise estatica real

A Story 13.2 deve criar `scripts/verify-quality-canaries.js`, usando somente APIs nativas, para executar provas negativas sem sobrescrever arquivos existentes:

1. criar por `mkdir` exclusivo, modo `0700`, dois diretorios imprevisiveis dentro do escopo, `src/.quality-gate-canary-<pid>-<nonce>/` e `scripts/.quality-gate-canary-<pid>-<nonce>/`, registrando identidade do diretorio; colisao falha sem reutilizar caminho;
2. antes dos canarios, calcular SHA-256 de caminho relativo, modo e bytes de todo arquivo coberto, excluindo apenas os dois diretorios-canario; repetir ao final e falhar como concorrencia se qualquer conteudo, modo ou conjunto de caminhos mudar;
3. executar cada linha da matriz isoladamente por uma funcao unica: criar somente o arquivo daquele caso por handle exclusivo (`open(..., 'wx')`), registrar `dev`/`ino`, gravar o conteudo quebrado, exigir o diagnostico exato, executar `truncate(0)` e gravar o conteudo corrigido a partir da posicao `0` pelo mesmo handle, exigir sucesso no mesmo comando e remover somente se `dev`/`ino` e o SHA-256 dos bytes ainda corresponderem ao arquivo criado e ao conteudo corrigido;
4. para ESLint usar `--format json`, parsear JSON e exigir no arquivo/linha do canario exatamente uma mensagem nao fatal com `ruleId` esperado e nenhuma outra mensagem; para TypeScript usar `--pretty false` e casar linha ancorada `<path>(linha,coluna): error TSNNNN:`, nunca substring solta. Falha de parser, configuracao, arquivo ausente, diagnostico em outro arquivo/linha ou mensagem adicional nao conta;
5. no `finally`, nunca executar `git checkout`, `git restore`, reset, limpeza recursiva ou restauracao ampla. Se houver entrada desconhecida ou identidade divergente, preservar o diretorio inteiro e falhar. Caso contrario, fechar o handle, remover somente os nomes imprevisiveis criados pelo processo e usar `rmdir` apenas se o diretorio continuar identico e vazio. Esta garantia protege contra colisao acidental entre agentes; Node nao oferece compare-and-unlink portavel contra um ator hostil de mesmo UID, limitacao registrada em vez de prometer atomicidade inexistente;
6. tratar `SIGINT` e `SIGTERM` com handler idempotente (`cleanupStarted`), aguardar o cleanup e encerrar respectivamente com `130`/`143`; segundo sinal durante cleanup forca exit nao zero preservando o diretorio para diagnostico. Cada subprocesso roda em grupo proprio com timeout de 60 segundos; no timeout, enviar termino ao grupo, aguardar no maximo 2 segundos, forcar encerramento, aguardar no maximo mais 5 segundos e falhar se algum descendente sobreviver; e
7. depois de todos os casos e do fingerprint final estavel, reexecutar `npm run lint` e `npm run typecheck` verdes.

O comando canonico da prova e `npm run verify:quality-canaries`, mapeado para `npm run preflight && node scripts/verify-quality-canaries.js`. Cada caso roda isoladamente em duas fases, quebrada e corrigida, com esta matriz normativa:

| Caso/path | Comando direcionado | Conteudo quebrado / diagnostico obrigatorio | Conteudo corrigido |
|---|---|---|---|
| browser `type.jsx` | `tsc -p jsconfig.browser.json --pretty false` | `/** @type {string} */ const qualityGateValue = 1` / `TS2322` | trocar `1` por `'1'` |
| Node `type.js` | `tsc -p jsconfig.node.json --pretty false` | `/** @type {string} */ const qualityGateValue = 1` / `TS2322` | trocar `1` por `'1'` |
| Node `identifier.js` | `eslint <path> --format json --max-warnings 0` | `qualityGateIdentifierThatDoesNotExist` / `no-undef` na linha 1 | `const qualityGateIdentifierThatDoesNotExist = 1; console.log(qualityGateIdentifierThatDoesNotExist)` |
| browser `process.jsx` | `eslint <path> --format json --max-warnings 0` | `console.log(process.version)` / `no-undef` na linha 1 | `console.log(globalThis.location.href)` |
| Node `window.js` | `eslint <path> --format json --max-warnings 0` | `console.log(window.location)` / `no-undef` na linha 1 | `console.log(globalThis.process.version)` |
| Node `require.js` | `eslint <path> --format json --max-warnings 0` | `const path = require('node:path'); export default path` / `no-undef` na linha 1 | `import path from 'node:path'; export default path` |
| browser `hook.jsx` | `eslint <path> --format json --max-warnings 0` | `import { useState } from 'react'; export function CanaryComponent({ enabled }) { if (enabled) { useState(0) } return null }` / somente `react-hooks/rules-of-hooks` na linha 1 | `import { useState } from 'react'; export function CanaryComponent({ enabled }) { useState(0); if (!enabled) return null; return <div /> }` |
| browser `refresh.jsx` | `eslint <path> --format json --max-warnings 0` | `export function CanaryComponent() { return <div /> } export function helper() { return 1 }` / somente `react-refresh/only-export-components` na linha 1 | remover o export `helper` e exportar somente `CanaryComponent`; constante nao serve como canario porque o preset Vite permite constant export |
| browser `implicit.test.jsx` | `eslint <path> --format json --max-warnings 0` | `describe('canary', () => {})` sem import / `no-undef` na linha 1 | `import { describe } from 'vitest'; describe('canary', () => {})` |

`<path>` e sempre o arquivo do caso dentro do diretorio imprevisivel do contexto correspondente. Cada fase quebrada deve falhar apenas pelo oraculo esperado para o canario, e a fase corrigida deve passar no mesmo comando direcionado. Uma unica falha no comando encadeado ou uma mensagem que apenas contenha o caminho nao e suficiente. Depois de todos os casos, o script limpa somente seus canarios, confirma o fingerprint do restante do escopo e exige `npm run lint` e `npm run typecheck` verdes.

## 6. Matriz de inclusao e exclusao

| Caminho/tipo | Lint | Typecheck | Decisao |
|---|---:|---:|---|
| `src/**/*.js` | inclui | browser | codigo browser de primeira parte |
| `src/**/*.jsx` | inclui | browser | React/JSX de primeira parte |
| `server/**/*.js` | inclui | Node | servidor Express e testes |
| `api/**/*.js` | inclui | Node | funcoes Vercel e testes |
| `scripts/**/*.js` | inclui, globals Node ESM | Node | preflight, inventario e canarios sao codigo operacional de primeira parte |
| `*.jsx` na raiz | inclui | browser | componentes importados pelos entrypoints |
| `vite.config.js` | inclui, Node builtin + `__dirname` | Node | configuracao executavel Vite/Vitest com excecao local existente |
| `eslint.config.js` | inclui, globals Node ESM | Node | configuracao executavel do gate de lint |
| `**/*.{test,spec}.{js,jsx}` | inclui | contexto hospedeiro | testes executaveis sao codigo de primeira parte e importam APIs Vitest |
| `node_modules/` | exclui | exclui | dependencias de terceiros |
| `dist/`, `build/`, `coverage/`, `.vite/`, `.vercel/` | exclui | exclui | artefatos gerados/cache |
| `_bmad/`, `_bmad-output/`, `.agents/`, `.claude/` | exclui | exclui | framework, skills e estado local fora do produto |
| HTML, CSS, imagens, Markdown | fora do parser | fora do compilador | nao sao JavaScript/JSX |

Nenhum arquivo em `src/`, `server/`, `api/`, `scripts/`, raiz JSX, `vite.config.js` ou `eslint.config.js` pode ser excluido apenas porque gera diagnosticos. Imports transitivos nao substituem inclusao explicita na matriz.

### 6.1 Inventario dinamico e prova de cobertura

A Story 13.2 deve criar `scripts/check-quality-scope.js`, apenas com APIs nativas, com dois comandos protegidos pelo preflight desde a origem: `quality:scope` valida filesystem/ESLint/TypeScript e deve ficar verde na 13.2; `quality:test-scope` valida a configuração Vitest ja definida e e executado pela 13.4/13.3, permanecendo vermelho enquanto a 13.4 ainda nao materializou `test.projects`. Assim a 13.4 nao altera o script nem `package.json`. O verificador deve:

1. executar primeiro auto-testes deterministas, sem Vitest, sobre fixtures em memoria/diretorio temporario: cada marcador proibido versus texto fragmentado permitido; extensoes canonicas versus caixa/variantes proibidas; predicado de tipo com stats sinteticos de arquivo regular/symlink/FIFO; subprocesso que termina e que excede timeout; cleanup normal, segundo sinal e entrada desconhecida. Qualquer caso divergente usa exit `2` e impede o inventario real;
2. enumerar recursivamente entradas sem diferenciar maiusculas/minusculas sob `src/`, `server/`, `api/` e `scripts/`, mais arquivos da raiz; aceitar somente arquivos regulares com extensao canonica minuscula `.js`/`.jsx` e os nomes `vite.config.js`/`eslint.config.js`. Qualquer variante `.mjs`, `.cjs`, `.mts`, `.cts`, `.ts`, `.tsx`, extensao em caixa nao canonica, FIFO, socket, device ou outro tipo falha como entrada sem contexto atribuido;
3. aplicar somente as exclusoes da matriz, normalizar caminhos relativos POSIX, ordenar e imprimir a contagem por contexto e o conjunto completo; links simbolicos dentro do escopo sao proibidos e geram exit `1`, sem serem seguidos. Arquivo cujo basename case de modo case-insensitive com sufixo `.test.*`/`.spec.*`, mas nao use exatamente `.test.js`, `.test.jsx`, `.spec.js` ou `.spec.jsx` em minusculas, falha como teste nao canonico;
4. obter a lista efetivamente processada pelo ESLint em JSON e exigir igualdade de conjuntos com o inventario, sem arquivos esperados ignorados; exit `0` ou `1` do ESLint permite analisar o JSON (`1` representa diagnosticos do baseline), enquanto exit `2`, timeout ou JSON invalido e erro interno do verificador;
5. executar os dois projetos TypeScript com `--listFilesOnly`; classificar como externo somente caminho real sob `node_modules/` ou sob o diretorio `lib/` da instalacao TypeScript resolvida. Todo caminho real dentro da raiz do projeto que nao pertença ao inventario esperado e erro, nunca item filtravel. Exigir que a uniao dos arquivos de primeira parte seja igual ao inventario;
6. exigir atribuicao exatamente uma vez: browser para `src/**/*.{js,jsx}` e `*.jsx`; Node para `server/**/*.js`, `api/**/*.js`, `scripts/**/*.js`, `vite.config.js` e `eslint.config.js`;
7. no modo `--tests`, executar `vitest list --project browser --filesOnly --no-color` e `vitest list --project node --filesOnly --no-color`, normalizar cada linha como caminho relativo POSIX e exigir que cada arquivo com sufixo `test`/`spec` apareca exatamente uma vez no projeto normativo; exit nao zero, linha nao reconhecida ou sobreposicao e erro do verificador. O ambiente nao deve ser inferido dessa listagem: a Story 13.4 o prova por canario executado em cada projeto;
8. configurar `linterOptions.noInlineConfig: true` e proibir qualquer sequencia de bytes `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error` ou `eslint-disable` em arquivos de primeira parte, inclusive em strings; a proibicao byte a byte e deliberadamente mais estrita que um parser e elimina ambiguidades de regex/template e auto-supressao. O proprio verificador monta cada marcador por fragmentos que nao contenham a sequencia completa em seus bytes; e
9. falhar com exit code `1` diante de arquivo ausente, duplicado, suprimido ou fora dos projetos; `0` significa igualdade comprovada, e erro interno/timeout/auto-teste usa `2`. Todo subprocesso tem timeout e encerramento de arvore equivalentes aos canarios.

O snapshot pre-tooling permanece 118 para rastreabilidade, mas nao e assert de aprovacao. A evidencia da 13.2 registra o numero recalculado e o diff nominal entre snapshot e inventario final. A Story 13.4 executa `npm run quality:test-scope` e os canarios de ambiente por projeto; nenhum total historico ou inferencia de glob substitui a lista efetivamente descoberta e a execucao no ambiente correto.

## 7. Politica de baseline e remediacao para a Story 13.2

### 7.1 Preflight normativo de runtime

A Story 13.2 deve criar `scripts/check-node-version.js` e `.npmrc` com `engine-strict=true` antes de qualquer instalacao. O script usa somente APIs nativas e exporta exatamente `validateNodeVersion(version)`, funcao pura consumida pelo proprio entrypoint e por `scripts/verify-node-version.js`; nao pode existir segunda implementacao da regra. O entrypoint so executa quando `import.meta.url === pathToFileURL(process.argv[1]).href`, usando `node:url`, de modo que importar o modulo nao finalize o processo. O algoritmo normativo e:

1. aceitar somente `process.versions.node` que corresponda integralmente a `^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$`;
2. converter os tres grupos em inteiros;
3. aceitar apenas major `24` e minor `>=20` — equivalencia exata ao intervalo `>=24.20.0 <25` para versoes estaveis;
4. imprimir a versao aceita e sair `0`; e
5. para formato invalido ou versao fora do intervalo, imprimir em stderr o recebido e o intervalo requerido e sair `1`. Excecao interna nao tratada permanece exit code diferente de zero.

O comando canonico e `"preflight": "node scripts/check-node-version.js"`. `scripts/verify-node-version.js` importa `validateNodeVersion` desse mesmo arquivo e executa, por APIs nativas, casos `24.20.0`, `24.20.1` e `24.21.0` (aceitos) e `24.19.1`, `23.11.0`, `25.0.0`, `24.20.0-rc.1` (rejeitados); imprime uma linha por caso, falha no primeiro resultado divergente e retorna `0` somente com sete resultados esperados. Tambem executa `node scripts/check-node-version.js` como subprocesso, exige exit `0`, a versao efetiva em stdout e nenhum stderr; assim a prova cobre a funcao e o entrypoint real. O comando canonico e `"verify:preflight": "npm run preflight && node scripts/verify-node-version.js"`. A 13.3 executa `npm run preflight` e `npm run verify:preflight` depois de `setup-node`/registro de versoes e antes de `npm ci`; a 13.2 registra ambos os comandos e prova que `npm ci` falha sob Node 25 por `engine-strict`.

### 7.2 Medicao inicial

1. Criar o preflight, `engines.node`, os scripts canonicos e substituir o `prepare` atual `husky || true` por `husky`; nenhum lifecycle pode esconder falha. Na CI, `HUSKY=0` pode ser definido somente no step de `npm ci` para desabilitar instalacao de hooks, sem alterar o exit code do npm.
2. Executar `npm run preflight`, registrar `node --version` e `npm --version` e somente entao executar o primeiro `npm ci`.
3. Instalar as `devDependencies` aprovadas com o comando exato da secao 3.1.1, criar uma ESLint e tres jsconfig, e atualizar o lockfile somente pelo npm.
4. Repetir `npm run preflight`, `npm ci` sobre o lockfile final e `npm ls --all`; qualquer conflito bloqueia a entrega.
5. Executar `npm run quality:scope`, lint e os dois projetos de typecheck sem alterar severidades para obter o baseline bruto.
6. Registrar em `docs/stories/quality-gate-logs/` o commit, hash do lockfile, SO, resultado do preflight, `node --version`, `npm --version`, cada comando/exit code, inventario dinamico e contagem por regra/codigo de diagnostico, arquivo e contexto.
7. Classificar cada item como correcao mecanica, anotacao JSDoc local, erro real ou mudanca funcional.

### 7.3 Remediacao permitida

- Imports ausentes ou nao usados, globals incorretos e erros sintaticos inequívocos.
- Ajustes mecanicos que nao mudem comportamento observavel.
- JSDoc local e preciso quando o contrato ja e comprovado pelo uso/testes.
- Tipos de bibliotecas alinhados as versoes runtime existentes.
- Ajustes em testes para satisfazer regras do proprio Vitest, desde que sem reduzir cobertura ou assercoes.

### 7.4 Remediacao proibida

- qualquer ocorrencia byte a byte de `@ts-nocheck`, `@ts-ignore`, `@ts-expect-error` ou `eslint-disable`, alem de `checkJs: false`, `noCheck` e `linterOptions.noInlineConfig: false`.
- `|| true`, `exit 0`, `continue-on-error`, redirecionamento que esconda falhas ou scripts que chamem apenas build.
- Reduzir `include`, ampliar `exclude` ou ignorar diretorios de primeira parte para fabricar verde.
- Desligar presets inteiros depois de observar o baseline.
- Alterar logica funcional, UI, API, autenticacao, schema ou dados para satisfazer o gate sem story propria.
- Gerar uma lista de bulk suppressions do ESLint como substituto da remediacao.

### 7.5 Excecoes locais futuras

Qualquer supressao futura, TypeScript ou ESLint, exige nova decisao arquitetural que altere de modo explicito o verificador e a configuracao; comentario local nao e aceito por esta epic. A nova decisao deve nomear regra/codigo, menor escopo, justificativa e Story, provar comportamento e manter `reportUnusedDisableDirectives: "error"`; ate la, todo marcador permanece bloqueante.

Se um diagnostico exigir decisao funcional, a Story 13.2 deve parar, registrar o erro e abrir correcao de curso ou nova story. O gate nao deve ser enfraquecido.

## 8. Contrato de comandos e CI

### 8.1 Scripts de `package.json`

```json
{
  "scripts": {
    "preflight": "node scripts/check-node-version.js",
    "verify:preflight": "npm run preflight && node scripts/verify-node-version.js",
    "quality:scope": "npm run preflight && node scripts/check-quality-scope.js",
    "quality:test-scope": "npm run preflight && node scripts/check-quality-scope.js --tests",
    "verify:quality-canaries": "npm run preflight && node scripts/verify-quality-canaries.js",
    "lint": "npm run preflight && eslint . --max-warnings 0",
    "typecheck": "npm run preflight && tsc -p jsconfig.browser.json && tsc -p jsconfig.node.json",
    "test": "npm run preflight && vitest run",
    "build": "npm run preflight && vite build",
    "prepare": "husky"
  },
  "engines": {
    "node": ">=24.20.0 <25"
  }
}
```

Os quatro gates canonicos continuam `lint`, `typecheck`, `test` e `build`; cada um chama o preflight como primeira operacao para que a execucao local direta tambem falhe fora de `>=24.20.0 <25`. Os scripts auxiliares tornam cobertura e provas negativas auditaveis. `test` e `build` preservam o comando funcional depois do preflight. O lockfile deve ser atualizado somente por npm, nunca editado manualmente. O `prepare` deixa de esconder falhas; ele nao e gate, mas sua execucao durante `npm ci` tambem deve ser fail-closed.

### 8.1.1 Integridade da execucao de testes — Story 13.4

Antes de a Story 13.3 usar `npm test` como gate de CI, a Story 13.4 deve substituir o `environment`, `globals`, `setupFiles` e `include` globais por `test.projects`, mecanismo requerido no Vitest 4, com exatamente dois projetos inline de nomes unicos. Cada projeto fixa `globals: false`, inclusive se `extends: true` voltar a herdar alguma opcao raiz durante a transicao:

```js
test: {
  coverage: { provider: 'v8', reporter: ['text', 'html'] },
  projects: [
    {
      extends: true,
      test: {
        name: 'browser',
        environment: 'happy-dom',
        globals: false,
        setupFiles: ['./src/test/setup.js'],
        include: ['src/**/*.{test,spec}.{js,jsx}'],
      },
    },
    {
      extends: true,
      test: {
        name: 'node',
        environment: 'node',
        globals: false,
        include: [
          'server/**/*.{test,spec}.{js,jsx}',
          'api/**/*.{test,spec}.{js,jsx}',
          'scripts/**/*.{test,spec}.{js,jsx}',
        ],
      },
    },
  ],
}
```

Os globs sao disjuntos e cobrem sufixos `test` e `spec`; nenhuma lista especial por arquivo e permitida. `src/test/setup.js` pertence somente ao projeto browser e deve trocar `import '@testing-library/jest-dom'` por `import '@testing-library/jest-dom/vitest'`, adaptador que importa `expect` do Vitest sem depender de API global. Testes operacionais futuros ficam em `scripts/` no projeto Node; testes na raiz sao proibidos ate que uma story lhes atribua contexto. Todo teste de primeira parte deve casar exatamente um projeto; zero ou dois matches falham `quality:test-scope`. O Vitest 4 removeu `environmentMatchGlobs` e orienta usar `projects`. [Vitest 4: projetos](https://vitest.dev/guide/projects.html), [Vitest 4: migracao](https://vitest.dev/guide/migration.html), [`jest-dom` com Vitest](https://github.com/testing-library/jest-dom#with-vitest)

O exemplo foi executado em copia temporaria com `npx vitest run --config vitest.config.js --reporter verbose`: um teste `src` apareceu como `|browser|`/`happy-dom`, um teste `server` como `|node|`, e ambos passaram (`2 files`, `2 tests`). Na mesma copia, `npx eslint ... --max-warnings 0`, `npx tsc -p jsconfig.browser.json` e `npx tsc -p jsconfig.node.json` retornaram `0`; `--showConfig` listou o arquivo browser somente no projeto browser e os arquivos Node/config somente no projeto Node.

Evidência mínima da Story 13.4:

1. `node --version`, `npm --version` e `npm run preflight` verdes antes da descoberta e dos testes;
2. inventário dinamico antes/depois, usando 17 apenas como snapshot inicial, com cada arquivo e seu projeto/ambiente esperado;
3. saidas de `vitest list --project browser --filesOnly --no-color` e `vitest list --project node --filesOnly --no-color`, seguidas de `npm test`, demonstrando que nenhum dos três testes em `api/` foi omitido;
4. canarios temporarios importando APIs do Vitest explicitamente que mostrem `document` definido no projeto browser e ausente no projeto Node, além de `globals: false` nos dois projetos e `src/test/setup.js` operacional via `@testing-library/jest-dom/vitest`; a separacao estatica adicional prova que `process` falha no lint browser e `window`/`require` falham no lint Node ESM;
5. diff que preserve asserções e comportamento de produto.

Se a configuração correta revelar falha funcional, a Story 13.4 deve parar e abrir nova correção de curso; não pode ocultar o caso por ignore ou alteração de asserções.

### 8.2 Ordem fail-closed da Story 13.3

```text
checkout
  -> setup Node 24.x (versão resolvida deve satisfazer >=24.20.0 <25)
  -> registrar node --version e npm --version
  -> npm run preflight
  -> npm run verify:preflight
  -> npm ci
  -> npm ls --all
  -> npm run quality:scope
  -> npm run quality:test-scope
  -> npm run lint
  -> npm run typecheck
  -> npm run verify:quality-canaries
  -> npm test
  -> npm run build
  -> deploy
```

Cada comando deve ser um step sem `continue-on-error`; `npm ci` usa `HUSKY=0` apenas para nao instalar hooks na CI. O comportamento padrao do GitHub Actions interrompe passos posteriores quando um step falha. `npm ci` exige lockfile consistente, remove `node_modules` existente e nao reescreve `package.json` ou lockfile. [npm ci](https://docs.npmjs.com/cli/commands/npm-ci/)

Os secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` devem existir somente no `env` do step de deploy. GitHub Actions somente disponibiliza um secret quando ele e explicitamente referenciado; nao declarar secrets no nivel do job ou workflow. [GitHub Actions secrets](https://docs.github.com/en/actions/concepts/security/secrets)

O workflow deve disparar `quality` tanto em `pull_request` quanto em `push` para `master`; o deploy continua exclusivamente no segundo evento. A configuracao YAML deve declarar ambos os gatilhos e deve conter um job `quality` sem `if` que o restrinja a PR. No nivel do workflow, `permissions: contents: read` e o maximo permitido. Um job `deploy-eligibility`, sem checkout, secrets ou permissao de escrita, declara `needs: quality`, roda em PR e push e imprime somente o SHA aprovado. O job real `deploy` declara `needs: [quality, deploy-eligibility]` e `if: github.event_name == 'push' && github.ref == 'refs/heads/master'`. Assim a run de PR prova causalmente o mesmo elo intermediario exigido pelo deploy real: `deploy-eligibility` executa na run verde e fica skipped por dependencia na vermelha; a revisao estatica confirma que o deploy depende dele. Nenhum secret, comando Vercel ou permissao de escrita/deploy aparece nos jobs `quality`/`deploy-eligibility`; secrets permanecem somente no step do job `deploy`. Falha ou skip de `quality` impede consumidores por `needs`, conforme a semantica oficial do GitHub Actions. [GitHub Actions: `needs` e `if`](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

Antes de a Story 13.3 permitir deploy, e mediante confirmacao humana imediata por alterar a configuracao externa do repositorio, `master` deve receber uma regra de protecao que exija pull request aprovado, invalide aprovacoes obsoletas, aplique a regra tambem a administradores, bloqueie force-push/delecao e torne obrigatorios os checks de nomes unicos `quality` e `deploy-eligibility` para o SHA a integrar. A evidencia somente leitura deve registrar timestamp, URL da regra e a resposta de `GET /repos/{owner}/{repo}/branches/master/protection`, incluindo `required_status_checks`, `required_pull_request_reviews` e `enforce_admins`; ausencia da regra, check ausente ou bypass permitido bloqueia a Story 13.3. A protecao de branch complementa — nunca substitui — a condicao `needs` no YAML. [GitHub: protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [GitHub REST: get branch protection](https://docs.github.com/en/rest/branches/branch-protection#get-branch-protection)

Para serializar pushes produtivos, o workflow deve declarar o bloco abaixo; assim nunca ha dois deploys concorrentes e uma execucao em curso nao e abortada no meio da publicacao. PRs usam grupo derivado do numero e nao compartilham o grupo produtivo.

```yaml
concurrency:
  group: ${{ github.event_name == 'push' && 'production-master' || github.event_name == 'pull_request' && format('quality-pr-{0}', github.event.pull_request.number) || format('runtime-preview-{0}', github.run_id) }}
  cancel-in-progress: false
```

Como `quality` e `deploy` sao jobs distintos, `deploy` nao herda workspace. Ambos fixam `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` (`v4.2.2`) e `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` (`v4.4.0`), com comentario da tag humana para atualizacao auditavel. O deploy repete checkout, setup com `24.x`, registro de versoes, `npm run preflight` e `npm ci` com `HUSKY=0`; imediatamente antes de publicar, reexecuta a assercao somente leitura de que nenhuma integracao/automacao paralela esta habilitada. Somente depois executa exatamente `npm exec -- vercel --prod --yes --token "$VERCEL_TOKEN"`, usando `vercel@59.11.2` instalado e fixado no lockfile pela Story 13.3 e os IDs Vercel existentes apenas no `env` desse step. Nao repete os quatro gates, pois `needs` vincula o mesmo SHA aprovado. Nenhum artefato de outro SHA pode ser baixado ou implantado.

A prova fail-closed da Story 13.3 e deterministica e requer autorizacao explicita para commit/PR:

1. abrir PR de verificacao sem secrets e confirmar uma execucao verde do job `quality`, com `deploy` skipped pela condicao de evento;
2. adicionar em commit temporario exatamente `scripts/__ci_lint_failure_canary__.js` com uma unica linha `qualityGateCiUndefinedIdentifier`; `quality:scope` deve aceitar o novo arquivo e o step `lint` deve falhar por `no-undef` nesse path/linha, antes de typecheck/canarios;
3. comprovar que o step `lint` falha antes de `verify:quality-canaries`, steps posteriores nao executam, `deploy-eligibility` fica skipped por dependencia e `deploy` permanece inelegivel pela condicao de evento, sem comando Vercel;
4. reverter o commit-canario, comprovar `quality` e `deploy-eligibility` verdes e somente entao permitir merge; e
5. registrar URLs/IDs das duas runs e os status dos jobs/steps.

Se commit/PR externo nao for autorizado, a 13.3 permanece incompleta; validacao YAML local nao substitui esta prova. Nao se cria deploy de pull request, nao se usa secret de producao e nao se promove deployment apenas para o canario.

### 8.3 Fonte de verdade do runtime Vercel

`package.json#engines.node` é a fonte de verdade do runtime de Build e Functions: na Vercel, um range válido da major 24 em `engines` substitui a configuração de versão do projeto. A Story 13.3 deve manter `">=24.20.0 <25"`. Não é aceitável considerar CI em Node 24 ou uma unica linha de log como prova de ambos os runtimes. [Vercel: versões Node.js suportadas](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)

Antes de concluir a Story 13.3, uma verificacao somente leitura deve provar que nenhuma integracao Git, hook, workflow ou automacao paralela da Vercel consegue publicar `master` fora do job protegido. A evidencia registra timestamp, repositorio/projeto/escopo consultados, identidade somente leitura e o JSON ou captura imutavel de: (1) `GET /repos/{owner}/{repo}/actions/workflows`, `GET /repos/{owner}/{repo}/hooks` e a arvore `.github/workflows/` no SHA aprovado; (2) configuracao Git, Deploy Hooks e automacoes do projeto Vercel no Dashboard/API oficial; e (3) lista paginada de deployments Vercel do projeto, identificando criador, metadados e origem. O resultado deve mapear cada caminho capaz de disparar deploy para o job `deploy` protegido ou declarar explicitamente que nao existe; resposta parcial, token sem permissao de leitura, pagina nao consultada ou origem desconhecida falha. Se existir caminho alternativo, desabilita-lo ou protege-lo exige confirmacao humana imediata por alterar producao; sem essa autorizacao/evidencia, a Story permanece incompleta. [GitHub REST: workflows](https://docs.github.com/en/rest/actions/workflows), [GitHub REST: repository webhooks](https://docs.github.com/en/rest/repos/webhooks), [Vercel REST: list deployments](https://vercel.com/docs/rest-api/deployments/list-deployments)

Depois de autorizacao externa explicita, a evidencia deve separar:

- **Install/Build:** a Story 13.3 altera `vercel.json#installCommand` exatamente para `npm run preflight && HUSKY=0 npm ci` e `vercel.json#buildCommand` para `npm run preflight && npm run build`. No deployment autorizado, captura deployment ID, timestamp e linhas que comprovem preflight antes da instalacao e no Build, ambas dentro do intervalo.
- **Function:** a Story 13.3 cria e mantem `.github/workflows/runtime-preview-proof.yml` na branch padrao. Esse e o unico workflow de prova manual: usa apenas `workflow_dispatch`, `permissions: { contents: read, pull-requests: read, actions: read }`, `concurrency.group: runtime-preview-proof`, `cancel-in-progress: false`, e job associado ao environment protegido `runtime-quality-proof`, com aprovacao humana obrigatoria. O arquivo e permanente porque o GitHub somente despacha `workflow_dispatch` quando o workflow existe na branch padrao; sua presenca nao autoriza execucao, preview, secrets ou deploy por esta Story. [GitHub Actions: workflow_dispatch](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)

  O workflow recebe obrigatoriamente `pull_number`, `commit_sha` (SHA completo) e `quality_run_id`. Ele rejeita PR de fork e exige que `runtime-quality-proof` tenha ao menos um reviewer diferente do ator que disparou a run e bloqueie autoaprovacao; a configuracao do environment, o revisor e timestamp da aprovacao entram no resumo de evidencia. A aprovacao humana torna aquele SHA explicitamente confiavel para a prova; fora desse limite, nenhum secret pode ser usado em codigo de PR. Antes de checkout, com o `GITHUB_TOKEN` de somente leitura, consulta `GET /repos/{owner}/{repo}/pulls/{pull_number}` e `GET /repos/{owner}/{repo}/actions/runs/{quality_run_id}`; falha diante de JSON/campo/owner/repo inesperado, PR nao aberto, `head.sha` diferente de `commit_sha`, `event` diferente de `pull_request`, `conclusion` diferente de `success`, `head_sha` diferente, ou `path` diferente de `.github/workflows/deploy.yml`. Em seguida pagina `GET /repos/{owner}/{repo}/actions/runs/{quality_run_id}/jobs?filter=latest&per_page=100&page=N` ate esgotar; exige exatamente um job `quality` com `conclusion: success`. [GitHub REST: workflow runs](https://docs.github.com/en/rest/actions/workflow-runs#get-a-workflow-run), [jobs da run](https://docs.github.com/en/rest/actions/workflow-jobs#list-jobs-for-a-workflow-run)

  So entao usa `actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683` com `ref` igual a `commit_sha`, confirma `git rev-parse HEAD` igual ao input, usa `actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020` com `24.x`, registra Node/npm e exige npm `11.12.1` (declarado tambem como `packageManager` em `package.json`). Executa `npm run preflight`, `HUSKY=0 npm ci`, `npm ls --all --json` com `problems: []`, `npm run quality:scope`, `npm run quality:test-scope`, lint, typecheck, canarios, testes e build, nessa ordem. Nenhum checkout por branch, tag ou ref parcial e aceito; toda Action de terceiro e CLI externa deve obedecer a origem imutável definida abaixo. Depois do checkout, nenhum comando que execute fonte do PR recebe secret: os tres secrets Vercel ficam somente nos steps fixos de deploy e cleanup, e um eventual bypass de protecao fica somente no step HTTP de invocacao.

  Antes do preview, a auditoria enumera todo `api/**/*.js` e `vercel.json`, prova que nao existe override de runtime Node por Function e bloqueia a Story se houver um; com uma unica politica global, um probe representa todas as Functions Node. Depois dos gates e ainda sem secrets, o runner cria somente no workspace `api/__quality_runtime_probe.js`. O handler aceita somente `GET` quando `VERCEL_ENV === 'preview'`, responde `404` em outro ambiente e retorna exatamente JSON `{ runtime: process.version, deploymentId: process.env.VERCEL_DEPLOYMENT_ID }`; ID ausente, campos extras, JSON invalido, status diferente de `200`, runtime fora de `>=24.20.0 <25` ou ID diferente do deployment criado falham a prova. O probe e apagado localmente no cleanup e nunca e commitado ou mergeado.

  Nenhuma Action de terceiro pode usar tag ou ref mutavel: cada `uses:` aponta SHA completo e o comentario registra a tag humana. CLI externa deve ser dependência direta em versão exata e presente no lockfile; scripts do repositorio sao permitidos porque o workflow faz checkout do `commit_sha` completo ja ligado ao job `quality` verde, e lifecycle npm somente pode vir desse lockfile por `npm ci`. A auditoria falha se algum `uses:`, pacote executavel externo ou checkout nao cumprir essa origem imutavel.

  O workflow usa `concurrency.group: runtime-preview-proof` e `cancel-in-progress: false`, serializando toda prova de runtime. Depois da aprovacao do environment e confirmacao externa imediata, o job gera `run_id` como metadado. Na recuperacao, pagina previews com `quality-proof-run`: para cada preview de outra run com mais de 30 minutos, consulta a run correspondente no GitHub; remove somente se essa run estiver `completed`. Se a run estiver `queued`, `in_progress`, `waiting`, desconhecida ou a consulta falhar, nao remove nada e falha para intervencao humana. Imediatamente antes do deploy, repete a consulta do PR e exige que `head.sha` ainda seja `commit_sha`; mudanca no head invalida a run. Um step exclusivo com `VERCEL_TOKEN`, `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` executa exatamente `npm exec -- vercel --yes --meta quality-proof-run=$GITHUB_RUN_ID --token "$VERCEL_TOKEN"`. O step nao aceita stdout ambiguo: resolve o deployment da run pelo metadado em todas as paginas, exige exatamente um resultado e confirma que URL HTTPS e ID capturados correspondem a esse mesmo resultado. Um step de invocacao sem token Vercel chama `/api/__quality_runtime_probe`; se a protecao de deployment bloquear o acesso, a Story permanece incompleta ate uma confirmacao humana criar e limitar `VERCEL_AUTOMATION_BYPASS_SECRET` somente a esse step. Em `always()`, outro step isolado com token remove somente deployments do metadado da run atual e consulta novamente todas as paginas, exigindo zero previews remanescentes dessa run. Cancelamento/perda do runner deixa a run incompleta: a proxima execucao autorizada ou recuperacao manual aplica o mesmo protocolo, sem apagar preview de run ativa. [Listar deployments](https://vercel.com/docs/rest-api/deployments/list-deployments), [remover deployment](https://vercel.com/docs/rest-api/deployments/delete-a-deployment)

Build Logs e Runtime Logs sao superficies distintas na Vercel. Sem ambas as evidencias, a Story 13.3 nao pode ser concluida. [Vercel Build Logs](https://vercel.com/docs/deployments/logs), [Vercel Runtime Logs](https://vercel.com/docs/logs/runtime)

## 9. Impacto e handoff

### 9.1 Story 13.2 — implementacao local

Arquivos esperados:

- `package.json` e `package-lock.json`;
- `.npmrc` com `engine-strict=true`;
- `eslint.config.js`;
- `jsconfig.quality.base.json`;
- `jsconfig.browser.json`;
- `jsconfig.node.json`;
- `scripts/check-node-version.js`, `scripts/verify-node-version.js`, `scripts/check-quality-scope.js` e `scripts/verify-quality-canaries.js`;
- somente arquivos de primeira parte estritamente necessarios a remediacao mecanica;
- Story 13.2 e logs de evidencia.

Evidencia minima:

- preflight positivo/negativo, instalacao exata, segundo `npm ci` e `npm ls --all` sem problemas em Node que satisfaca `>=24.20.0 <25`, com `node --version`, `npm --version`, hash do lockfile e commit registrados;
- `quality:scope` com auto-testes deterministas em memoria/temporario para cada marcador proibido, extensao/tipo de entrada, timeout e cleanup, seguidos do inventario dinamico e igualdade comprovada entre filesystem, ESLint e os dois projetos TypeScript; a evidencia registra cada caso e resultado;
- lint, typecheck, build e testes verdes; o resultado de `npm test` da 13.2 deve ser rotulado explicitamente como baseline parcial de 15/17 arquivos, sem alegar integridade da suite antes da 13.4;
- provas negativas de lint e typecheck;
- prova negativa do preflight fora do range e prova positiva no runtime alvo;
- inventario do baseline antes/depois;
- diff sem mudanca funcional inesperada.

### 9.2 Story 13.3 — enforcement no CI

Arquivos esperados: `.github/workflows/deploy.yml`, `vercel.json`, `.npmrc`, `package.json` e `package-lock.json` para fixar Actions, `vercel@59.11.2`, Install/Build Commands com preflight e a prova `deploy-eligibility` sem secrets; `.github/workflows/runtime-preview-proof.yml` permanece na branch padrao como workflow manual protegido, enquanto `api/__quality_runtime_probe.js` existe apenas no workspace da run e e removido no cleanup.

Evidencia minima:

- sintaxe do workflow validada;
- ordem exata dos quatro gates, com lint/typecheck antes dos canarios e test/build depois deles;
- teste fail-closed em PR, sem secrets/comando Vercel, com `deploy-eligibility` causal, run vermelha e restauracao verde;
- secrets restritos ao step de deploy;
- mesmos scripts de `package.json`, sem logica duplicada.
- ausencia comprovada de caminho produtivo alternativo que contorne o workflow protegido;
- provas distintas de Install/Build e Function Vercel em preview depois de autorizacao externa explicita.

### 9.3 Story 13.4 — integridade do runner de testes

Arquivos principais esperados: `vite.config.js` e `src/test/setup.js`; a Story pode criar somente evidências e canarios auxiliares estritamente necessários à configuração aprovada.

Evidência mínima:

- `node --version`, `npm --version` e `npm run preflight` verdes antes da descoberta e dos testes;
- inventário dinamico dos testes, preservando 17 apenas como snapshot inicial, e seus ambientes;
- inclusão comprovada dos três testes de `api/`;
- execução local de `npm test` no ambiente correto por contexto;
- ausência de exclusão ampla, redução de asserções ou mudança funcional.

### 9.4 Story 11.9

A Story 11.9 permanece em `backlog` ate a conclusao comprovada da Story 13.3. A aprovacao deste contrato nao remove seu bloqueio.

## 10. Alternativas consideradas

| Alternativa | Decisao | Motivo |
|---|---|---|
| ESLint 9 | rejeitada | linha 9 entrou em EOL em 2026-08-06; nao iniciar fundacao nova em major sem manutencao. [ESLint version support](https://eslint.org/version-support/) |
| Oxlint | rejeitada nesta epic | Vite atual oferece essa opcao, mas o requisito aprovado nomeia estrategia ESLint e exige contrato rastreavel para seus contextos |
| `eslint-plugin-react` | nao adotada | template oficial Vite usa Hooks/Refresh; superficie extra nao e necessaria para o objetivo atual |
| `@vitest/eslint-plugin@1.6.27` | rejeitada nesta versao | peer transitivo de TypeScript aceita `<6.1.0`; conflita com TypeScript 7 e torna `npm ls` invalido |
| TypeScript 6 | reserva de rollback | API JS estavel, mas o gate usa apenas CLI; TypeScript 7 e atual e oficialmente recomendado para CLI |
| Manter Node 20 como alvo | rejeitada | a linha está EOL; a Vercel desabilitará Node 20 para novos Builds e Functions em 2026-10-01, enquanto Node 24.x é suportado e padrão |
| Um unico jsconfig com DOM + Node | rejeitada | mascara uso de globals no ambiente errado |
| `moduleResolution: Bundler` em toda a base | rejeitada | nao modela com fidelidade o ESM Node de `server/` e `api/` |
| `strict: true` imediato | adiado | exigiria migracao ampla de anotacoes em JS brownfield; endurecimento deve ser incremental e mensurado |
| Build como typecheck | rejeitada | Vite transpila e documenta que nao realiza typecheck do grafo |
| Bulk suppressions/exclusoes | rejeitada | produz falso verde e viola a proposta aprovada |

## 11. Riscos e mitigacoes

| Risco | Impacto | Mitigacao |
|---|---|---|
| Baseline maior que o previsto | prazo da 13.2 | inventario bruto, remediacao mecanica e parada em mudanca funcional |
| Regressão de compatibilidade no salto Node 20 → 24 | gates ou build indisponíveis | executar `npm ci`, lint, typecheck, testes e build em Node `>=24.20.0 <25`, registrando a versão efetiva; parar e abrir nova story se houver mudança funcional |
| Runtime CI/Vercel divergir do validado | falso verde ou Function incompatível | `engines` é fonte de verdade; CI registra versão e a Story 13.3 prova separadamente Build Log e invocacao de Function |
| Suite de testes parcial ou em ambiente incorreto | CI verde sem validar o comportamento relevante | Story 13.4 declara descoberta/ambiente por contexto e prova os 17 testes antes do enforcement |
| Tipos React 19 em runtime React 18 | falsos diagnosticos | fixar `@types/react` e `@types/react-dom` na linha 18 |
| Globals browser/Node mascararem erro | falso verde | configs e overrides separados |
| `skipLibCheck` esconder erro proprio | baixo | inclui somente `.d.ts` de terceiros; todos os JS/JSX proprios permanecem incluidos |
| Config permissiva estagnar | divida crescente | warning budget zero, politica de supressoes da secao 7.5 e stories de endurecimento |
| Mudanca funcional durante remediacao | regressao | interromper 13.2 e abrir story/correcao de curso |
| Secrets expostos antes do deploy | seguranca | secrets somente no `env` do step final |

## 12. Rollback e manutencao

### 12.1 Rollback da Story 13.2

Reverter como unidade isolada os scripts, `devDependencies`, lockfile, quatro arquivos de configuracao e correcoes mecanicas associadas. Antes e depois, manter `package.json`/lockfile coerentes e provar a arvore restaurada com `npm ci`; nao deixar scripts apontando para arquivos removidos. Nenhuma migration, dado ou ambiente externo e afetado. Se os gates revelarem defeito funcional, nao fazer rollback do diagnostico: registrar uma story separada. O rollback não restabelece Node 20 como runtime alvo; ele preserva Node 24 como decisão arquitetural e retorna somente a implementação isolada.

### 12.2 Rollback da Story 13.3

Nunca reverter somente os gates preservando um deploy ativo. A unidade segura inclui jobs `quality`/`deploy-eligibility`/`deploy`, pins de Actions, `vercel@59.11.2` e lockfile, `vercel.json#installCommand`/`buildCommand`, configuracao de integracao Git e qualquer probe/job temporario de runtime:

1. preferir restaurar a ultima versao comprovadamente verde que ainda tenha os quatro gates antes do deploy;
2. restaurar em conjunto os Install/Build Commands e a CLI fixada somente para uma versao anterior que tambem execute preflight antes da instalacao e do build; nunca voltar ao install/build automatico sem essa protecao;
3. remover probe e preview temporarios pelo fluxo autorizado, confirmando que nenhuma rota diagnostica permaneceu; restaurar a integracao Git somente se o estado anterior tambem era comprovadamente protegido pelos gates;
4. se nao existir versao segura, desabilitar temporariamente o job `deploy` (`if: false` com comentario/ID de incidente, ou remover o gatilho produtivo) e manter diagnostico local/CI;
5. validar sintaxe e provar que push/PR/integracao Git nao alcancam Vercel durante o rollback; e
6. reabilitar deploy somente depois de `preflight`, instalacao, escopo, canarios e quatro gates verdes em nova revisao.

O workflow baseline que publica diretamente depois de `npm ci` nao e alvo de rollback aceitavel. Se o runtime Node 24 exigir reversão operacional, abrir nova decisão; não reintroduzir Node 20 EOL por rollback tácito.

### 12.3 Manutencao continua

- Todo novo arquivo JS/JSX de primeira parte deve estar coberto por `eslint .` e por um dos jsconfig.
- Toda nova excecao local segue a politica da secao 7.5.
- Majors de tooling exigem story e validacao de Node/React/Vite/Vitest.
- O quality gate deve revisar mudancas de escopo, ignores e severidades com o mesmo rigor de codigo.
- O objetivo de longo prazo e endurecer verificacoes selecionadas, nao migrar todo o repositorio para TypeScript sem decisao de produto/arquitetura propria.

## 13. Mapeamento aos criterios e stories consumidoras

| Decisao | AC 13.1 | Consumidor |
|---|---|---|
| Documento, objetivo, escopo, contexto brownfield e decisões normativas | 1 | 13.1, revisão independente |
| Baseline de 118 e inventario dinamico filesystem/ESLint/TypeScript | 2, 6, 11 | 13.2 |
| ESLint flat config e contextos | 3, 5, 6 | 13.2 |
| TypeScript checkJs/noEmit em dois projetos | 4, 5, 6 | 13.2 |
| Arvore exata sem plugin Vitest conflitante, segundo `npm ci` e `npm ls --all` | 5, 8, 11 | 13.2 |
| Distinção baseline Node 20 / alvo Node 24 e compatibilidade verificada | 2, 5 | 13.2, 13.3 |
| Baseline, proibicoes e excecoes locais | 7, 9 | 13.2 |
| Scripts canonicos | 8 | 13.2 |
| Ordem fail-closed, PR sem deploy e isolamento de secrets | 8, 9 | 13.3 |
| Sentinela causal por `needs`, Actions/CLI fixados e ausencia de bypass produtivo | 8, 9, 11 | 13.3 |
| Fonte de verdade Vercel, preflight antes da instalacao e provas distintas de Build/Function | 8, 9 | 13.3 |
| Rollback que restaura gates seguros ou desabilita deploy | 9 | 13.2, 13.3 |
| Preflight nativo em `scripts/check-node-version.js` antes da instalação | 2, 6, 8 | 13.2 |
| Canarios deterministas com restauracao em `finally` | 4, 7, 8, 11 | 13.2 |
| Projetos Vitest com globs/ambientes inequívocos | 6, 8, 9 | 13.4, 13.3 |
| Escopo apenas documental desta entrega | 10 | 13.1 |
| Fontes e consistencia dos exemplos | 11 | 13.1 |

## 14. Fontes oficiais primarias

As fontes foram revalidadas em 2026-09-02. Versoes normativas usam endpoints versionados do registro npm; referencias Git mutaveis nao sustentam pins:

- [Node.js: End-of-Life e LTS atual](https://nodejs.org/en/about/eol)
- [Vercel: depreciação do Node 20](https://vercel.com/changelog/node-js-20-is-being-deprecated)
- [Vercel: versões Node.js suportadas e `engines`](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Registro npm de `@types/node@24.13.3`](https://registry.npmjs.org/@types/node/24.13.3)
- [ESLint Getting Started e requisitos Node](https://eslint.org/docs/latest/use/getting-started)
- [ESLint flat configuration](https://eslint.org/docs/latest/use/configure/configuration-files)
- [ESLint CLI e exit codes](https://eslint.org/docs/latest/use/command-line-interface)
- [ESLint version support](https://eslint.org/version-support/)
- [Template `create-vite@9.2.0` fixado na tag/commit `c32e784c95b51f7969cebc7522a5037f14fb6606`](https://github.com/vitejs/vite/tree/c32e784c95b51f7969cebc7522a5037f14fb6606/packages/create-vite)
- [Vite: TypeScript, typecheck separado e client types](https://vite.dev/guide/features.html#typescript)
- [React: eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks)
- [`@vitest/eslint-plugin@1.6.27` fixado na tag/commit `aad57d121647efe764463c37414a8cd67ec9cf92`](https://github.com/vitest-dev/eslint-plugin-vitest/tree/aad57d121647efe764463c37414a8cd67ec9cf92)
- [Vitest configuration](https://vitest.dev/config/)
- [Vitest 4 projects](https://vitest.dev/guide/projects.html)
- [Vitest 4 migration](https://vitest.dev/guide/migration.html)
- [TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)
- [TypeScript allowJs](https://www.typescriptlang.org/tsconfig/allowJs.html)
- [TypeScript checkJs](https://www.typescriptlang.org/tsconfig/checkJs.html)
- [TypeScript noEmit](https://www.typescriptlang.org/tsconfig/noEmit.html)
- [TypeScript moduleResolution](https://www.typescriptlang.org/tsconfig/moduleResolution)
- [TypeScript JSX](https://www.typescriptlang.org/tsconfig/jsx.html)
- [Type checking JavaScript](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
- [npm ci](https://docs.npmjs.com/cli/commands/npm-ci/)
- [GitHub Actions secrets](https://docs.github.com/en/actions/concepts/security/secrets)
- [GitHub Actions workflow syntax: `needs` e `if`](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub REST: branch protection](https://docs.github.com/en/rest/branches/branch-protection#get-branch-protection)
- [GitHub REST: workflows](https://docs.github.com/en/rest/actions/workflows)
- [GitHub REST: repository webhooks](https://docs.github.com/en/rest/repos/webhooks)
- [`actions/checkout` fixado em `v4.2.2`](https://github.com/actions/checkout/commit/11bd71901bbe5b1630ceea73d27597364c9af683)
- [`actions/setup-node` fixado em `v4.4.0`](https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020)
- [Registro npm de `vercel@59.11.2`](https://registry.npmjs.org/vercel/59.11.2)
- [Vercel Build Logs](https://vercel.com/docs/deployments/logs)
- [Vercel Runtime Logs](https://vercel.com/docs/logs/runtime)
- [Registro npm de `eslint@10.9.1`](https://registry.npmjs.org/eslint/10.9.1)
- [Registro npm de `@eslint/js@10.0.1`](https://registry.npmjs.org/@eslint%2fjs/10.0.1)
- [Registro npm de `globals@17.11.0`](https://registry.npmjs.org/globals/17.11.0)
- [Registro npm de `eslint-plugin-react-hooks@7.1.1`](https://registry.npmjs.org/eslint-plugin-react-hooks/7.1.1)
- [Registro npm de `eslint-plugin-react-refresh@0.5.5`](https://registry.npmjs.org/eslint-plugin-react-refresh/0.5.5)
- [Registro npm de `@vitest/eslint-plugin@1.6.27`](https://registry.npmjs.org/@vitest%2feslint-plugin/1.6.27)
- [Registro npm de `@typescript-eslint/utils@8.69.0`](https://registry.npmjs.org/@typescript-eslint%2futils/8.69.0)
- [Registro npm de `typescript@7.0.2`](https://registry.npmjs.org/typescript/7.0.2)
- [Registro npm de `@types/react@18.3.31`](https://registry.npmjs.org/@types%2freact/18.3.31)
- [Registro npm de `@types/react-dom@18.3.7`](https://registry.npmjs.org/@types%2freact-dom/18.3.7)
- [Registro npm de `@types/express@5.0.6`](https://registry.npmjs.org/@types%2fexpress/5.0.6)
- [Registro npm de `@types/cors@2.8.19`](https://registry.npmjs.org/@types%2fcors/2.8.19)
- [Registro npm de `@types/supertest@7.2.1`](https://registry.npmjs.org/@types%2fsupertest/7.2.1)

## 15. Decisao final do arquiteto

Node 20 permanece documentado apenas como baseline observável do CI vigente. O contrato ratifica Node `>=24.20.0 <25` como runtime único alvo de desenvolvimento, `engines`, CI e Builds/Functions Vercel para as Stories 13.2, 13.4 e 13.3; `@types/node` deve iniciar em `24.13.3`. A Story 13.2 materializa o preflight nativo, a arvore exata sem o plugin Vitest incompatível, inventario dinamico e canarios seguros; a 13.4 aplica os dois projetos Vitest definidos; a 13.3 usa PR para prova fail-closed e separa as evidencias Vercel de Build e Function. A arvore proposta passou em `npm ci` e `npm ls --all` numa copia temporaria com Node 24.20.0, sem alterar codigo ou dependencias do repositorio.

O contrato aprovado na Iteracao 2 foi reaberto nas Iteracoes 3–6 para fechar globals Vitest, oraculos/lifecycle de canarios, preflight local fail-closed, supressoes, causalidade da prova CI e o caminho completo de deploy/preview/rollback Vercel. A Iteracao 6 substitui o workflow temporario no PR por prova manual permanente e protegida na branch padrao, e a revisao independente aprovou a versao resultante. A Story 13.2 pode consumir as decisoes ratificadas em seu proprio workflow; isso nao autoriza commit, push, PR, secrets, preview ou deploy. As Stories 13.2, 13.4 e 13.3 nao podem redefinir tooling, escopo, ambientes, preflight, prova de CI ou rollback.
