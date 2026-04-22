# Spec: Segundo Cérebro - Integração Obsidian + Chatbot IA

> **Story ID:** EPIC-SEGUNDO-CEREBRO  
> **Complexity:** COMPLEX (estimado: ~20 pontos)  
> **Generated:** 2026-04-22  
> **Status:** Draft  
> **Version:** 1.0

---

## 1. Overview

Este épico implementa um segundo cérebro para a Mentoria IA, permitindo que alunos façam perguntas sobre o conteúdo dos cursos através de um chatbot IA autenticado. O sistema ingere notebooks do NotebookLM, armazena em Obsidian, e utiliza RAG híbrido (ChromaDB + BM25) para busca semântica. Admins gerenciam notebooks, LLMs e skills customizadas, com observabilidade completa via dashboard.

_Derivado de: FR-1 a FR-8, requirements.json_

### 1.1 Goals

- **[FR-1]** Permitir importação automatizada de notebooks do NotebookLM para Obsidian
- **[FR-2]** Fornecer chatbot autenticado com respostas fundamentadas em streaming
- **[FR-3]** Permitir admin selecionar modelo LLM dinamicamente via OpenRouter
- **[FR-4]** Permitir criação de skills customizadas (cookbooks, resumos, tabelas comparativas)
- **[FR-5]** Fornecer observabilidade completa (latência, tokens, custos, erros)
- **[FR-6]** Manter histórico de conversas persistente por aluno
- **[FR-7]** Suportar múltiplos formatos de output (resumos, relatórios, tabelas, cookbooks)
- **[FR-8]** Detectar automaticamente skills via triggers/keywords

### 1.2 Non-Goals

- ❌ Suporte a múltiplas fontes além de NotebookLM (ex: Google Drive, PDFs diretos)
- ❌ Fine-tuning de modelos LLM customizados
- ❌ Chatbot multi-idioma (foco em português)
- ❌ Integração com ferramentas externas (Slack, Discord) - apenas web app
- ❌ Mobile app nativo (apenas responsive web)
- ❌ Voice input/output para chatbot
- ❌ Collaborative features (alunos não compartilham conversas)

---

## 2. Requirements Summary

### 2.1 Functional Requirements

| ID | Description | Priority | Source |
|----|-------------|----------|--------|
| FR-1 | Ingestão de notebooks do NotebookLM para Obsidian via MCP jacob-bd/notebooklm-mcp-cli | P0 | requirements.json |
| FR-2 | Chatbot Q&A autenticado com streaming de resposta e citação de fontes | P0 | requirements.json |
| FR-3 | Admin seleciona LLM via dropdown populado dinamicamente da API OpenRouter | P0 | requirements.json |
| FR-4 | Admin cria/importa skills customizadas (upload .json/.yaml ou formulário) | P1 | requirements.json |
| FR-5 | Dashboard de observabilidade com métricas de uso, custo e performance | P1 | requirements.json |
| FR-6 | Histórico de conversas persistente e acessível por aluno | P1 | requirements.json |
| FR-7 | Agente capaz de gerar múltiplos tipos de conteúdo (resumos, relatórios, tabelas comparativas, análises, cookbooks) | P0 | requirements.json |
| FR-8 | Sistema de skills com detecção automática e triggers/keywords | P1 | requirements.json |

### 2.2 Non-Functional Requirements

| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| NFR-1 | Performance | Resposta do chatbot deve completar em menos de 60 segundos | 95th percentile de latência end-to-end < 60s |
| NFR-2 | Performance | Sistema deve suportar 20 usuários simultâneos sem degradação | Latência p95 < 60s com 20 requests concorrentes |
| NFR-3 | Security | Todas conversas devem ser auditadas e registradas em log | 100% de mensagens registradas em chatbot_sessions com timestamps |
| NFR-4 | Security | RLS policies garantem que aluno vê apenas próprias conversas | Tentativa de acesso a sessão de outro aluno retorna 403 Forbidden |
| NFR-5 | Usability | Respostas do chatbot devem usar streaming (progressive rendering) | TTFB (Time To First Byte) < 2s, tokens aparecem progressivamente |
| NFR-6 | Usability | Chatbot deve sempre citar fontes (notebooks consultados) | 100% das respostas incluem seção 'Fontes' com links para notebooks |
| NFR-7 | Reliability | Sistema deve ter graceful degradation se ChromaDB falhar | Fallback para BM25-only se vector store indisponível, alertar admin |
| NFR-8 | Usability | Admin deve ver métricas de observabilidade atualizadas em near-real-time | Dashboard atualiza a cada 30s com dados dos últimos 5 minutos |

### 2.3 Constraints

| ID | Type | Constraint | Impact |
|----|------|------------|--------|
| CON-1 | Technical | NotebookLM usa APIs não-oficiais com rate limit de ~50 queries/day no free tier | Importação pode falhar se rate limit atingido, requer retry logic e account rotation |
| CON-2 | Technical | Autenticação obrigatória via Supabase Auth com roles (admin/user) | RLS policies devem ser implementadas para todas tabelas de chatbot |
| CON-3 | Technical | LLM provider é OpenRouter, lista de modelos via API /models | Sistema depende de OpenRouter estar disponível, endpoint /models deve ser cached |
| CON-4 | Technical | RAG híbrido usa ChromaDB (vector) + rank_bm25 (keyword) com peso 60/40 | Ambos indexes devem estar sincronizados, reindexação deve atualizar ambos |
| CON-5 | Business | Chatbot NÃO pode responder sobre assuntos fora da mentoria (scope enforcement crítico) | System prompt deve incluir instrução forte de scope, respostas fora de escopo devem ser rejeitadas explicitamente |
| CON-6 | Business | Sem rate limits para alunos (unlimited queries) | Sistema deve escalar horizontalmente, monitorar abuso via observabilidade |
| CON-7 | Technical | Timeout máximo de 1 minuto para resposta do chatbot | LLM request deve ter timeout configurado, UI deve mostrar erro se exceder |

---

## 3. Technical Approach

### 3.1 Architecture Overview

O sistema é composto por 5 módulos principais interconectados:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INGESTÃO (NotebookLM → Obsidian)                            │
│                                                                  │
│  NotebookLM  →  jacob-bd CLI  →  Markdown (.md)  →  Obsidian   │
│                                                                  │
│  Admin seleciona notebooks via interface                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. ARMAZENAMENTO (Obsidian Vault)                              │
│                                                                  │
│  📁 vault/                                                      │
│    ├── notebook1.md                                             │
│    ├── notebook2.md                                             │
│    └── ...                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2.5 RAG ENGINE (Indexação + Retrieval)                         │
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────┐             │
│  │ Vector Index     │        │ BM25 Index       │             │
│  │ (ChromaDB)       │        │ (rank_bm25)      │             │
│  │                  │        │                  │             │
│  │ - Embeddings     │        │ - Tokenized docs │             │
│  │ - Similarity     │        │ - TF-IDF scores  │             │
│  └──────────────────┘        └──────────────────┘             │
│           ↓                           ↓                         │
│  ┌────────────────────────────────────────────┐                │
│  │ Ensemble Retriever (60% vec / 40% BM25)   │                │
│  │ → Reciprocal Rank Fusion                   │                │
│  │ → [Optional] Cross-Encoder Reranking       │                │
│  └────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AGENTE CHATBOT (Área Autenticada)                           │
│                                                                  │
│  👤 Usuário  →  Pergunta  →  RAG Engine  →  Top-3 Contextos   │
│                                     ↓                            │
│                               Skill Router (detecta trigger)     │
│                                     ↓                            │
│                               Context Assembly                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. LLM (Gemma 31B via OpenRouter)                              │
│                                                                  │
│  Context + Query + Skill Prompt  →  Gemma 31B  →  Resposta     │
│                                                                  │
│  [Sources: notebook1.md, notebook2.md]                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AGENTE CHATBOT (Resposta ao Usuário)                        │
│                                                                  │
│  👤 Usuário  ←  Resposta Streaming + Fontes                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 5. ÁREA DE ADMINISTRAÇÃO                                        │
│                                                                  │
│  🛡️ Admin Panel:                                               │
│    - Conectar NotebookLM                                        │
│    - Selecionar notebooks                                       │
│    - Selector de LLM (OpenRouter API)                           │
│    - Criar/Upload Skills                                        │
│    - Dashboard Observabilidade                                  │
│    - Re-indexar RAG Engine                                      │
└─────────────────────────────────────────────────────────────────┘
```

_Arquitetura derivada de: Research findings (docs/research/), FR-1 a FR-8, diagrama fornecido pelo usuário_

### 3.2 Component Design

#### 3.2.1 Ingestão (Módulo 1)

**Responsabilidade:** Importar notebooks do NotebookLM para Obsidian

**Componentes:**
- **NotebookLM Connector:** Wrapper do MCP `jacob-bd/notebooklm-mcp-cli`
  - Autenticação via cookie extraction (browser automation)
  - Lista notebooks disponíveis via CLI `nlm list-notebooks`
  - Extrai notebook para Markdown via `nlm query --output markdown`
  
- **Obsidian Writer:** Persiste arquivos .md no vault
  - Path: `obsidian/vault/{notebook-id}.md`
  - Metadata frontmatter: title, notebooklm_url, imported_at
  
- **Import Queue:** Processa importações com retry
  - Max retries: 3 com exponential backoff
  - Rate limit handling: pausa 1h se detectado

_Derivado de: FR-1, CON-1, Research 1/3 (notebooklm-mcp-research.md)_

#### 3.2.2 RAG Engine (Módulo 2.5)

**Responsabilidade:** Indexar e recuperar contexto relevante dos notebooks

**Componentes:**

**A. Vector Index (ChromaDB):**
```python
# Embedding model (multilíngue)
model = 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2'
embeddings = HuggingFaceEmbeddings(model_name=model)

# Vector store
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory='./chroma_db'
)
```

**B. BM25 Index (rank_bm25):**
```python
from rank_bm25 import BM25Okapi

tokenized_docs = [doc.page_content.lower().split() for doc in chunks]
bm25 = BM25Okapi(tokenized_docs)
```

**C. Hybrid Retriever (60/40):**
```python
from langchain.retrievers import EnsembleRetriever

ensemble = EnsembleRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    weights=[0.6, 0.4]  # 60% vector, 40% BM25
)
```

**D. Reranker (Opcional - Phase 2):**
```python
from sentence_transformers import CrossEncoder

reranker = CrossEncoder('BAAI/bge-reranker-v2-m3')
# Rerank top-10 candidates, return top-3
```

_Derivado de: FR-2, NFR-1, CON-4, Research 3/3 (rag-hybrid-research.md)_

#### 3.2.3 Chatbot API (Módulo 3)

**Responsabilidade:** Processar perguntas de alunos com streaming

**Endpoint:** `POST /api/chatbot/query`

**Flow:**
1. Autenticação (Bearer token via Supabase Auth)
2. Skill routing (detecta trigger keywords)
3. RAG retrieval (top-3 chunks)
4. Context assembly + skill prompt
5. LLM call com streaming (OpenRouter SSE)
6. Persist conversa (chatbot_sessions table)
7. Return resposta + fontes

**Skill Router:**
```javascript
function detectSkill(question, activeSkills) {
  for (const skill of activeSkills) {
    const triggers = skill.triggers; // array de keywords
    if (triggers.some(trigger => question.toLowerCase().includes(trigger))) {
      return skill;
    }
  }
  return null; // usa prompt genérico
}
```

_Derivado de: FR-2, FR-7, FR-8, NFR-5, CON-5, Research 2/3 (auth-system-research.md)_

#### 3.2.4 Admin Panel (Módulo 5)

**Responsabilidade:** Gestão de notebooks, LLMs, skills e observabilidade

**Sub-módulos:**

**A. Notebook Management:**
- Route: `/admin/notebooks`
- Actions: Conectar NotebookLM, listar, selecionar, importar
- Progress tracking: WebSocket para updates em tempo real

**B. LLM Selector:**
- Route: `/admin/config/llm`
- Fetch models: `curl https://openrouter.ai/api/v1/models`
- Cache: 24h (atualizar diariamente)
- Default selection: persistido em `llm_config` table

**C. Skills Manager:**
- Route: `/admin/skills`
- CRUD: Create (formulário/upload), Read, Update, Delete
- Toggle active/inactive
- Schema validation para uploads (.json/.yaml)

**D. Observability Dashboard:**
- Route: `/admin/observability`
- Métricas via polling (30s interval):
  - Latência média (chart line)
  - Tokens consumidos (bar chart: input/cache/output/thinking)
  - Custo acumulado (gauge)
  - Erros/timeouts (counter)
  - Sessões ativas, usuários únicos (stat cards)
  - Top perguntas, notebooks consultados (tables)

_Derivado de: FR-3, FR-4, FR-5, NFR-8, CON-3_

### 3.3 Data Flow

#### Flow 1: Importação de Notebook (Admin)

```
Admin (Web UI)
  ↓ [1] POST /api/admin/notebooks/connect
Server
  ↓ [2] Run `nlm login --auto` (MCP CLI)
NotebookLM
  ↓ [3] Return authenticated session
Server
  ↓ [4] Run `nlm list-notebooks`
Admin (Web UI)
  ↓ [5] Display list, admin selects notebooks
  ↓ [6] POST /api/admin/notebooks/import {ids: [...]}
Server
  ↓ [7] Run `nlm query --notebook-url X --output markdown` (foreach)
Obsidian Vault
  ↓ [8] Write .md files
Server
  ↓ [9] Trigger RAG reindexing (background job)
ChromaDB + BM25
  ↓ [10] Index new documents
Admin (Web UI)
  ↓ [11] Show success notification
```

_Derivado de: FR-1, INT-2 (requirements.json)_

#### Flow 2: Pergunta do Aluno (Chatbot)

```
Aluno (Web UI)
  ↓ [1] POST /api/chatbot/query {question, session_id}
Server
  ↓ [2] Validate auth (Bearer token)
  ↓ [3] Detect skill (keyword matching)
RAG Engine
  ↓ [4] Hybrid retrieval (60% vector + 40% BM25)
  ↓ [5] Return top-3 chunks + metadata (sources)
Server
  ↓ [6] Assemble context + apply skill prompt (if any)
  ↓ [7] POST OpenRouter /chat/completions (streaming)
OpenRouter (Gemma 31B)
  ↓ [8] Stream response (SSE)
Server
  ↓ [9] Proxy stream to client (WebSocket ou SSE)
Aluno (Web UI)
  ↓ [10] Display tokens progressively
Server
  ↓ [11] Save conversation (chatbot_sessions table)
  ↓ [12] Log metrics (tokens, cost, latency)
Aluno (Web UI)
  ↓ [13] Show sources (notebooks links)
```

_Derivado de: FR-2, FR-7, FR-8, NFR-5, NFR-6, INT-1 (requirements.json)_

---

## 4. Dependencies

### 4.1 External Dependencies

| Dependency | Version | Purpose | Verified | Source |
|------------|---------|---------|----------|--------|
| `jacob-bd/notebooklm-mcp-cli` | latest | Extração de notebooks do NotebookLM | ✅ | Research 1/3 |
| `chromadb` | 1.5.8 | Vector database para embeddings | ✅ | Research 3/3 |
| `rank_bm25` | 1.1.1 | Keyword search (BM25 algorithm) | ✅ | Research 3/3 |
| `sentence-transformers` | latest | Embedding models (HuggingFace) | ✅ | Research 3/3 |
| `paraphrase-multilingual-mpnet-base-v2` | — | Embedding model (768-dim, multilíngue) | ✅ | Research 3/3 |
| `langchain` | latest | RAG orchestration (optional) | ✅ | Research 3/3 |
| `@supabase/supabase-js` | latest | Autenticação e database | ✅ | Research 2/3 |
| OpenRouter API | — | LLM provider (Gemma 31B, outros) | ✅ | CON-3 |
| `BAAI/bge-reranker-v2-m3` | — | Cross-encoder reranker (opcional) | ✅ | Research 3/3 |

### 4.2 Internal Dependencies

| Module | Purpose | Location |
|--------|---------|----------|
| `server/lib/auth.js` | Middleware de autenticação Supabase | Existente |
| `server/routes/chatbot.js` | API endpoints do chatbot | **Novo** |
| `server/lib/rag-engine.js` | Hybrid retriever implementation | **Novo** |
| `server/lib/skill-router.js` | Detecção de skills via triggers | **Novo** |
| `server/lib/notebook-importer.js` | Wrapper do MCP CLI | **Novo** |
| `src/plataforma/pages/ChatbotPage.jsx` | UI do chatbot para alunos | **Novo** |
| `src/plataforma/pages/admin/NotebookManagement.jsx` | Admin UI para notebooks | **Novo** |
| `src/plataforma/pages/admin/SkillsManager.jsx` | Admin UI para skills | **Novo** |
| `src/plataforma/pages/admin/ObservabilityDashboard.jsx` | Dashboard de métricas | **Novo** |

---

## 5. Files to Modify/Create

### 5.1 New Files

#### Backend (Server)

| File Path | Purpose | Dependencies |
|-----------|---------|--------------|
| `server/routes/chatbot.js` | API endpoints: `/query`, `/sessions`, `/sessions/:id` | auth.js, rag-engine.js, skill-router.js |
| `server/routes/admin/notebooks.js` | API endpoints: `/connect`, `/list`, `/import`, `/status` | auth.js, notebook-importer.js |
| `server/routes/admin/skills.js` | CRUD endpoints para skills | auth.js |
| `server/routes/admin/observability.js` | Dashboard metrics endpoints | auth.js |
| `server/lib/rag-engine.js` | Hybrid retriever (ChromaDB + BM25) | chromadb, rank_bm25, sentence-transformers |
| `server/lib/skill-router.js` | Skill detection logic | — |
| `server/lib/notebook-importer.js` | MCP CLI wrapper | child_process |
| `server/lib/openrouter-client.js` | OpenRouter API client com streaming | axios ou fetch |
| `scripts/index-obsidian.js` | Script de indexação (cron job) | rag-engine.js |

#### Frontend (Client)

| File Path | Purpose | Dependencies |
|-----------|---------|--------------|
| `src/plataforma/pages/ChatbotPage.jsx` | Chatbot UI para alunos | useAuth, supabase |
| `src/plataforma/components/ChatMessage.jsx` | Component para mensagens (user/assistant) | markdown renderer |
| `src/plataforma/components/ChatInput.jsx` | Input com send button | — |
| `src/plataforma/components/SourcesDisplay.jsx` | Display de fontes/notebooks consultados | — |
| `src/plataforma/pages/admin/NotebookManagement.jsx` | Admin UI para gestão de notebooks | useAuth |
| `src/plataforma/pages/admin/SkillsManager.jsx` | Admin UI para criar/editar skills | react-hook-form, json-editor |
| `src/plataforma/pages/admin/ObservabilityDashboard.jsx` | Dashboard com charts (latência, tokens, custos) | recharts ou chart.js |
| `src/plataforma/pages/admin/LLMSelector.jsx` | Dropdown para selecionar LLM | react-select |

#### Database (Migrations)

| File Path | Purpose |
|-----------|---------|
| `supabase/migrations/20260422000001_chatbot_schema.sql` | Criar tabelas: chatbot_sessions, chatbot_messages, notebooks, skills, llm_config |
| `supabase/migrations/20260422000002_chatbot_rls.sql` | RLS policies para chatbot tables |

#### Configuration

| File Path | Purpose |
|-----------|---------|
| `.env.example` | Adicionar: OPENROUTER_API_KEY, OBSIDIAN_VAULT_PATH, NOTEBOOKLM_COOKIES_PATH |
| `package.json` | Adicionar dependencies: chromadb, rank_bm25, sentence-transformers, langchain |

### 5.2 Modified Files

| File Path | Changes | Risk |
|-----------|---------|------|
| `server/index.js` | Registrar novas rotas: `/api/chatbot`, `/api/admin/notebooks`, `/api/admin/skills`, `/api/admin/observability` | Low |
| `src/plataforma/App.jsx` | Adicionar rota `/chatbot` (protected) | Low |
| `src/plataforma/pages/admin/AdminDashboard.jsx` | Adicionar links para Notebooks, Skills, Observability | Low |
| `src/plataforma/context/AuthContext.jsx` | Nenhuma modificação necessária (já suporta roles) | None |

---

## 6. Testing Strategy

### 6.1 Unit Tests

| Test | Covers | Priority | File |
|------|--------|----------|------|
| `rag-engine.test.js` → `test_hybrid_retrieval()` | FR-2, NFR-1 | P0 | server/lib/rag-engine.js |
| `skill-router.test.js` → `test_skill_detection()` | FR-8 | P1 | server/lib/skill-router.js |
| `notebook-importer.test.js` → `test_import_with_retry()` | FR-1, CON-1 | P0 | server/lib/notebook-importer.js |
| `openrouter-client.test.js` → `test_streaming_response()` | FR-2, NFR-5 | P0 | server/lib/openrouter-client.js |
| `auth.test.js` → `test_rls_enforcement()` | NFR-4 | P0 | server/lib/auth.js |

### 6.2 Integration Tests

| Test | Components | Scenario | Priority |
|------|------------|----------|----------|
| `chatbot-e2e.test.js` | Chatbot API + RAG + OpenRouter | Aluno faz pergunta, recebe resposta streaming com fontes | P0 |
| `admin-import-e2e.test.js` | Admin API + NotebookLM MCP + RAG | Admin importa notebook, sistema indexa automaticamente | P0 |
| `skill-routing-e2e.test.js` | Chatbot + Skill Router | Aluno pergunta "crie um cookbook", skill cookbook é ativada | P1 |
| `observability-e2e.test.js` | Dashboard + Metrics API | Admin vê métricas atualizadas após perguntas | P1 |
| `rls-policy-e2e.test.js` | Supabase RLS | Aluno A tenta acessar sessão de Aluno B, recebe 403 | P0 |

### 6.3 Acceptance Tests (Given-When-Then)

#### AC-1: Ingestão de Notebooks

```gherkin
Feature: Importação de Notebooks do NotebookLM

  Scenario: Admin importa notebook com sucesso
    Given admin conectou conta NotebookLM
    And admin vê lista de notebooks disponíveis
    When admin seleciona 2 notebooks e clica "Importar"
    Then sistema converte notebooks para Markdown
    And armazena em Obsidian vault
    And exibe confirmação "Importação concluída: 2 notebooks"
    And RAG é re-indexado automaticamente
```

#### AC-2: Chatbot Q&A com Streaming

```gherkin
Feature: Chatbot com Respostas em Streaming

  Scenario: Aluno faz pergunta sobre conteúdo da mentoria
    Given aluno autenticado na página /chatbot
    When aluno digita "O que é RAG híbrido?" e envia
    Then resposta começa a aparecer progressivamente (streaming)
    And resposta completa em menos de 60 segundos
    And fontes consultadas são exibidas (notebooks: "rag-hybrid.md")
    And conversa é salva no histórico do aluno

  Scenario: Aluno faz pergunta fora de escopo
    Given aluno autenticado na página /chatbot
    When aluno digita "Qual a capital da França?" e envia
    Then sistema retorna "Não encontrei essa informação na base de conhecimento da mentoria"
    And não exibe fontes (contexto não encontrado)
```

#### AC-3: Admin Seleção de LLM

```gherkin
Feature: Seleção de Modelo LLM

  Scenario: Admin altera modelo LLM padrão
    Given admin na página /admin/config/llm
    When admin abre dropdown de modelos
    Then vê lista de modelos do OpenRouter (ex: Gemma 31B, GPT-4, Claude 3.5)
    When admin seleciona "google/gemma-3-31b"
    And clica "Salvar"
    Then modelo é salvo como default
    And próximas perguntas de alunos usam Gemma 31B
```

#### AC-4: Criação de Skill

```gherkin
Feature: Criação de Skill Customizada

  Scenario: Admin cria skill via formulário
    Given admin na página /admin/skills
    When admin clica "Nova Skill"
    And preenche:
      | Campo       | Valor                              |
      | Nome        | Gerador de Cookbook                |
      | Descrição   | Cria guias passo-a-passo           |
      | Prompt      | Você é um gerador de cookbooks...  |
      | Triggers    | cookbook, guia, passo-a-passo      |
    And clica "Salvar"
    Then skill aparece na lista
    When admin ativa toggle (on)
    Then skill fica disponível para agente

  Scenario: Aluno usa skill automaticamente
    Given skill "Gerador de Cookbook" está ativa
    When aluno pergunta "crie um cookbook sobre RAG"
    Then agente detecta trigger "cookbook"
    And usa skill para gerar resposta estruturada
    And resposta segue formato: Objetivo, Pré-requisitos, Passos, Validação
```

#### AC-5: Observabilidade

```gherkin
Feature: Dashboard de Observabilidade

  Scenario: Admin visualiza métricas de uso
    Given admin na página /admin/observability
    Then dashboard exibe:
      | Métrica                | Valor Exemplo |
      | Latência média         | 3.2s          |
      | Tokens input           | 125k          |
      | Tokens cache           | 50k           |
      | Tokens output          | 80k           |
      | Custo total            | $1.25         |
      | Sessões ativas         | 8             |
      | Usuários únicos        | 15            |
      | Top pergunta           | "O que é RAG?"|
      | Notebook mais usado    | "rag-hybrid.md"|
    And dashboard atualiza a cada 30 segundos
```

---

## 7. Risks & Mitigations

| Risk | Probability | Impact | Mitigation | Source |
|------|-------------|--------|------------|--------|
| NotebookLM MCP CLI quebra (Google muda APIs) | Medium | High | Monitorar repo jacob-bd para updates, ter fallback manual export | ASM-1, CON-1 |
| OpenRouter downtime durante uso de aluno | Low | Critical | Retry 3x com backoff, fallback error message, alertar admin | EC-7 |
| ChromaDB corrompe índice (crash durante write) | Low | High | Backup diário do chroma_db, graceful fallback para BM25-only | EC-4, NFR-7 |
| Latência > 60s com 20 usuários simultâneos | Medium | High | Load testing antes de produção, escalar horizontalmente se necessário | ASM-3, NFR-2 |
| Skills não detectadas corretamente (triggers ruins) | Medium | Medium | Teste com 10 perguntas variadas, refinar triggers, permitir admin ajustar | ASM-5, EC-8 |
| Custo LLM explodir com uso intenso | Low | Medium | Dashboard monitora custos em tempo real, alertar admin se > $100/mês | NFR-8, FR-5 |
| Rate limit NotebookLM atingido durante importação | High | Medium | Retry com exponential backoff, multi-account rotation (futuro) | CON-1, EC-1 |
| Aluno abusa sistema (spam de perguntas) | Low | Low | Monitorar via observabilidade, implementar soft limit (100/dia) no futuro | CON-6 |
| Conteúdo Obsidian insuficiente para responder | Medium | Medium | Testar com 20-30 perguntas reais após primeira importação, iterar | ASM-4, EC-9 |

---

## 8. Open Questions

| ID | Question | Blocking | Assigned To | Status |
|----|----------|----------|-------------|--------|
| OQ-1 | Qual formato exato esperado para upload de skills? (.json estruturado, .yaml, .md com frontmatter?) | No | @architect | Open |
| OQ-2 | Como admin define triggers para skills? (lista de keywords, regex patterns, ou LLM-based detection?) | No | @architect | Open |
| OQ-3 | Dashboard de observabilidade é página dedicada ou modal/sidebar no admin panel? | No | @ux-design-expert | Open |
| OQ-4 | Skills podem ter parâmetros configuráveis pelo aluno? (ex: tamanho do resumo, formato da tabela) | No | @po | Open |
| OQ-5 | Como lidar com custo de tokens thinking (OpenRouter o3-mini)? Separar no dashboard ou agrupar com output? | No | @pm | Open |
| OQ-6 | Reranker (BAAI/bge-reranker-v2-m3) será implementado em MVP ou Phase 2? | No | @architect | Open |
| OQ-7 | Incremental indexing (via file hashes) será MVP ou Phase 2? | No | @dev | Open |
| OQ-8 | Suporte a múltiplas contas NotebookLM (account rotation) para rate limits? | No | @devops | Open |

---

## 9. Implementation Checklist

### Phase 1: MVP (Core Functionality)

#### Epic Breakdown (4 Stories)

**Story 1: Ingestão de Notebooks (8 pontos)**
- [ ] Criar tabela `notebooks` no Supabase
- [ ] Implementar `server/lib/notebook-importer.js` (wrapper MCP CLI)
- [ ] Criar API route `POST /api/admin/notebooks/import`
- [ ] Implementar retry logic com exponential backoff
- [ ] Criar Admin UI: `/admin/notebooks` (connect, list, import)
- [ ] Escrever testes: `notebook-importer.test.js`
- [ ] Validar AC-1 (Given-When-Then)

**Story 2: RAG Engine + Chatbot Q&A (13 pontos)**
- [ ] Setup ChromaDB + rank_bm25 (dependencies)
- [ ] Implementar `server/lib/rag-engine.js` (hybrid retriever 60/40)
- [ ] Criar script `scripts/index-obsidian.js` (initial indexing)
- [ ] Criar tabelas `chatbot_sessions`, `chatbot_messages` no Supabase
- [ ] Implementar `server/routes/chatbot.js` (POST /query com streaming)
- [ ] Implementar `server/lib/openrouter-client.js` (SSE support)
- [ ] Criar RLS policies para chatbot tables
- [ ] Criar Chatbot UI: `/chatbot` (input, messages, sources display)
- [ ] Implementar scope enforcement (CON-5) via system prompt
- [ ] Escrever testes: `rag-engine.test.js`, `chatbot-e2e.test.js`
- [ ] Validar AC-2, NFR-1, NFR-5, NFR-6

**Story 3: Admin LLM Selector + Skills (8 pontos)**
- [ ] Criar tabela `llm_config` no Supabase
- [ ] Implementar API `GET /api/admin/config/llm/models` (fetch OpenRouter)
- [ ] Criar Admin UI: `/admin/config/llm` (dropdown selector)
- [ ] Criar tabela `skills` no Supabase
- [ ] Implementar CRUD API: `/api/admin/skills`
- [ ] Implementar `server/lib/skill-router.js` (trigger detection)
- [ ] Criar Admin UI: `/admin/skills` (create, upload, toggle)
- [ ] Implementar schema validation para skill uploads
- [ ] Escrever testes: `skill-router.test.js`, `skill-routing-e2e.test.js`
- [ ] Validar AC-3, AC-4, FR-8

**Story 4: Observabilidade Dashboard (5 pontos)**
- [ ] Criar tabela `chatbot_metrics` no Supabase (ou usar logs)
- [ ] Implementar API `GET /api/admin/observability/metrics`
- [ ] Criar Admin UI: `/admin/observability` (charts, tables)
- [ ] Implementar polling (30s interval)
- [ ] Adicionar logging de tokens/custos em chatbot.js
- [ ] Escrever testes: `observability-e2e.test.js`
- [ ] Validar AC-5, NFR-8

### Phase 2: Quality & Optimization (Post-MVP)

- [ ] Implementar reranker (BAAI/bge-reranker-v2-m3)
- [ ] Implementar incremental indexing (file hashes)
- [ ] Load testing com 20 usuários simultâneos
- [ ] Implementar soft rate limit (100 queries/dia por aluno)
- [ ] Multi-account rotation para NotebookLM
- [ ] Monitoramento avançado (Prometheus/Grafana)
- [ ] A/B testing: pure vector vs hybrid retrieval

---

## 10. Rollout Plan

### Phase 1: Internal Beta (Week 1-2)
- Deploy em ambiente de staging
- 5 alunos beta testam chatbot
- Admin testa importação de 10 notebooks
- Iterar baseado em feedback

### Phase 2: Limited Production (Week 3)
- Deploy em produção
- Anunciar para 20 alunos (early access)
- Monitorar métricas de observabilidade
- Fix bugs críticos

### Phase 3: Full Rollout (Week 4+)
- Anunciar para todos alunos da mentoria
- Publicar guia de uso do chatbot
- Treinar admin em gestão de skills
- Monitoramento contínuo

---

## Metadata

- **Generated by:** @pm (Morgan) via spec-write-spec
- **Inputs:** 
  - requirements.json (EPIC-SEGUNDO-CEREBRO)
  - Research 1/3: notebooklm-mcp-research.md
  - Research 2/3: auth-system-research.md
  - Research 3/3: rag-hybrid-research.md
  - Diagrama de arquitetura (fornecido pelo usuário)
- **Iteration:** 1
- **Next Step:** Critique (Phase 5) via @qa
- **Constitutional Compliance:** Article IV - No Invention ✅ (todos statements rastreiam para FR/NFR/CON/Research)

---

**END OF SPEC**
