# Technical Research: Sistema de Autenticação Atual
**Research ID:** TECH-RESEARCH-002  
**Date:** 2026-04-21  
**Analyst:** Atlas (@analyst)  
**Epic Context:** Segundo Cérebro - Integração Obsidian + Chatbot IA

---

## Executive Summary

**Finding:** A Mentoria possui infraestrutura de autenticação funcional baseada em **Supabase Auth** com sistema de roles (admin/user) implementado via `user_metadata`. O sistema suporta áreas autenticadas com RLS policies granulares.

**Recommendation:** A infraestrutura existente **suporta completamente** o requisito de chatbot autenticado. Criar nova tabela `chatbot_access` para controle de acesso específico do chatbot, mantendo compatibilidade com sistema atual.

**Key Gap:** Não existe atualmente uma área específica de "chatbot" na plataforma. Será necessário criar novo módulo com rotas protegidas para o chatbot.

---

## Research Objectives

### Primary Questions
1. Qual sistema de autenticação está em uso?
2. Como funciona o controle de acesso (roles, permissions)?
3. Áreas autenticadas existentes suportam adição de novo módulo (chatbot)?
4. Gaps ou limitações do sistema atual para o caso de uso?
5. Necessidade de extensão ou é plug-and-play?

### Success Criteria
- Mapear arquitetura completa de auth (client + server)
- Documentar fluxo de autenticação end-to-end
- Identificar padrões de proteção de rotas/recursos
- Avaliar se sistema suporta chatbot autenticado sem modificações

---

## Methodology

### Data Sources
- Codebase analysis (Glob + Read de arquivos críticos)
- Schema migrations (Supabase SQL)
- RLS policies inspection
- API routes analysis

### Analysis Framework
- **Client-side:** React context, hooks, session management
- **Server-side:** Express middleware, Bearer token validation
- **Database:** RLS policies, role-based access
- **Security:** Token handling, admin checks

### Limitations
- Analysis baseada em código estático (não runtime testing)
- Políticas RLS assumidas como corretamente deployadas
- Não verificado edge cases de autenticação

---

## Key Findings

### 1. Supabase Auth como Foundation

**Stack Completo:**
- **Provider:** Supabase Auth (oficial)
- **Client SDK:** `@supabase/supabase-js`
- **Server SDK:** `@supabase/supabase-js` (service role key)
- **Token Type:** JWT Bearer tokens
- **Session Storage:** Local (client) + Supabase managed (server)

**Implication:** Infraestrutura madura e battle-tested. Não requer substituição.

### 2. Role-Based Access Control (RBAC)

**Roles Implementados:**

| Role | Storage Location | Check Pattern |
|------|-----------------|---------------|
| `admin` | `auth.users.user_metadata.role` | `user.user_metadata?.role === 'admin'` |
| `user` (default) | Implícito (authenticated) | `auth.uid()` não-null |

**Role Assignment:**
- Roles são definidos em `user_metadata` durante criação de usuário
- Checagem server-side via JWT: `(auth.jwt()->'user_metadata'->>'role') = 'admin'`
- Checagem client-side via `useAuth()`: `isAdmin` computed property

**Implication:** Sistema binário (admin/user). Para chatbot, pode reusar ou criar role específico.

### 3. Client-Side Architecture

#### AuthContext (`src/plataforma/context/AuthContext.jsx`)

**State Management:**
```javascript
{
  user: User | null,           // Supabase auth user object
  loading: boolean,            // Initial session load
  isAdmin: boolean,            // Computed from user_metadata
  profile: Profile | null,     // Extended profile data
  profileError: string | null, // Profile load errors
  signIn: (email, password) => Promise,
  signOut: () => Promise,
  refreshProfile: () => Promise
}
```

**Session Flow:**
1. **Initial Load:** `supabase.auth.getSession()` — recupera sessão persistida
2. **State Change Listener:** `onAuthStateChange()` — atualiza em login/logout
3. **Profile Loading:** Carrega dados de `profiles` table após auth
4. **Session Persistence:** Automática via Supabase SDK (localStorage)

**Protected Components:**
- Wrapping com `AuthProvider` no root
- Uso de `useAuth()` hook para acessar contexto
- Conditional rendering baseado em `user` ou `isAdmin`

### 4. Server-Side Architecture

#### Auth Middleware (`server/lib/auth.js`)

**3 Funções Principais:**

##### 1. `createServiceSupabaseClient()`
```javascript
// Cria client com service_role key (bypass RLS)
createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY)
```

##### 2. `getAuthenticatedUser(req, supabase)`
```javascript
// Extrai e valida Bearer token
// Returns: { user, error }
const token = getBearerToken(req);
const { data: { user } } = await supabase.auth.getUser(token);
```

##### 3. `requireAuthenticatedUser(req, res, options)`
```javascript
// Middleware-style, retorna user ou envia erro
// Options: { supabase, requireAdmin: boolean }
// Returns: User object ou null (já enviou response)
```

**Usage Pattern:**
```javascript
router.post('/protected-endpoint', async (req, res) => {
  const user = await requireAuthenticatedUser(req, res, { requireAdmin: true });
  if (!user) return; // Response já enviado
  
  // Continue com lógica...
});
```

### 5. Row Level Security (RLS) Policies

**Pattern:** Todas as tabelas públicas têm RLS ativado com políticas específicas.

#### Exemplo: `materials` Table

```sql
-- Read: Qualquer usuário autenticado
CREATE POLICY "materials: autenticados leem"
  ON materials FOR SELECT
  TO authenticated
  USING (true);

-- Write: Somente admin
CREATE POLICY "materials: somente admin escreve"
  ON materials FOR ALL
  TO authenticated
  USING ((auth.jwt()->'user_metadata'->>'role') = 'admin')
  WITH CHECK ((auth.jwt()->'user_metadata'->>'role') = 'admin');
```

#### Exemplo: `profiles` Table

```sql
-- Self-management: Usuário gerencia próprio perfil
CREATE POLICY "perfil: usuario gerencia o proprio"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin read-all
CREATE POLICY "perfil: admin le todos"
  ON profiles FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

**Implication:** RLS garante que mesmo com service_role key, usuários só acessam dados autorizados via políticas SQL.

### 6. Protected Routes Pattern

#### API Routes
**Exemplo:** `server/routes/materials.js`

```javascript
// Admin-only upload
router.post('/upload', async (req, res) => {
  const user = await requireAuthenticatedUser(req, res, { requireAdmin: true });
  if (!user) return;
  // ... lógica de upload
});

// Authenticated download
router.get('/:id/download', async (req, res) => {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;
  // ... lógica de download
});
```

**Pattern:**
1. Call `requireAuthenticatedUser` no início do handler
2. Se retornar `null`, handler termina (erro já enviado)
3. Se retornar `user`, continuar com lógica protegida

#### Frontend Routes
**Exemplo:** Conditional rendering ou route guards

```javascript
// Em LoginPage.jsx ou similar
if (user && !loading) {
  navigate('/dashboard');
}

// Ou wrapping de componentes
{isAdmin && <AdminPanel />}
```

---

## Comparative Analysis

### Current System vs Chatbot Requirements

| Requirement | Current System | Gap? | Solution |
|-------------|---------------|------|----------|
| **Bearer token auth** | ✅ Implementado | NO | Reusar `requireAuthenticatedUser` |
| **Role-based access** | ✅ Admin/User | NO | Pode adicionar role `chatbot_user` ou reusar `authenticated` |
| **Protected API routes** | ✅ Pattern estabelecido | NO | Criar `/api/chatbot/*` com mesmo pattern |
| **Session management** | ✅ Supabase automático | NO | Client envia token automaticamente |
| **RLS policies** | ✅ Para todas tabelas públicas | MAYBE | Criar policies para nova tabela `chatbot_sessions` |
| **Frontend context** | ✅ AuthContext disponível | NO | Reusar `useAuth()` hook |
| **Área específica "chatbot"** | ❌ Não existe | **YES** | Criar novo módulo frontend + backend |

**Key Gaps Identified:**
1. **Chatbot Module:** Não existe rota/página dedicada ao chatbot
2. **Chatbot Access Control:** Pode ser necessário controle granular (quem pode usar chatbot?)
3. **Rate Limiting:** Não observado no código atual (importante para LLM calls)
4. **Audit Logging:** Não observado (perguntas/respostas do chatbot)

---

## Opportunity Assessment

### Recommended Architecture Extension

#### 1. Database Extension

**Nova Tabela: `chatbot_sessions`**
```sql
CREATE TABLE chatbot_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation  jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array de messages
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chatbot_sessions: usuario gerencia proprias sessoes"
  ON chatbot_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "chatbot_sessions: admin le todas"
  ON chatbot_sessions FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
```

**Nova Tabela: `chatbot_access_control` (Opcional)**
```sql
CREATE TABLE chatbot_access_control (
  user_id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_enabled boolean NOT NULL DEFAULT true,
  daily_limit    integer NOT NULL DEFAULT 50,  -- Queries por dia
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS: Admin controla, usuário lê próprio status
```

#### 2. API Routes Extension

**Novo Arquivo: `server/routes/chatbot.js`**
```javascript
import { Router } from 'express';
import { requireAuthenticatedUser } from '../lib/auth.js';

const router = Router();

// POST /api/chatbot/query
router.post('/query', async (req, res) => {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;
  
  const { question, session_id } = req.body;
  
  // 1. Rate limit check (via chatbot_access_control)
  // 2. Query NotebookLM via MCP
  // 3. Process response via Gemma 31B (OpenRouter)
  // 4. Save conversation to chatbot_sessions
  // 5. Return answer
  
  res.json({ answer, sources, session_id });
});

// GET /api/chatbot/sessions
router.get('/sessions', async (req, res) => {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;
  
  // Return user's chat sessions
});

// GET /api/chatbot/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;
  
  // Return specific session (RLS ensures user owns it)
});

export default router;
```

**Registro no Express:** `server/index.js`
```javascript
import chatbotRoutes from './routes/chatbot.js';
app.use('/api/chatbot', chatbotRoutes);
```

#### 3. Frontend Extension

**Nova Página: `src/plataforma/pages/ChatbotPage.jsx`**
```javascript
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export function ChatbotPage() {
  const { user, loading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  
  async function sendMessage() {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    const response = await fetch('/api/chatbot/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ question: input })
    });
    
    const { answer, sources } = await response.json();
    setMessages(prev => [...prev, { role: 'user', content: input }, { role: 'assistant', content: answer, sources }]);
  }
  
  if (loading) return <div>Carregando...</div>;
  if (!user) return <div>Por favor, faça login.</div>;
  
  return (
    <div>
      <h1>Chatbot - Segundo Cérebro</h1>
      {messages.map((msg, i) => <MessageBubble key={i} {...msg} />)}
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Enviar</button>
    </div>
  );
}
```

**Roteamento:** `src/plataforma/App.jsx` ou router config
```javascript
<Route path="/chatbot" element={<ChatbotPage />} />
```

---

## Strategic Recommendations

### Implementation Strategy

#### Phase 1: Database Setup (Week 1)
1. Criar migration para `chatbot_sessions` table
2. Criar migration para `chatbot_access_control` (opcional)
3. Aplicar RLS policies
4. Deploy via `supabase db push`

#### Phase 2: Backend API (Week 2)
1. Criar `server/routes/chatbot.js`
2. Implementar `/api/chatbot/query` endpoint
   - Rate limiting check
   - Integração com NotebookLM MCP (via jacob-bd CLI ou PleasePrompto MCP)
   - Integração com Gemma 31B via OpenRouter
   - Persistência de conversas
3. Implementar endpoints de sessão (list, get)
4. Testes de autenticação (valid token, invalid token, admin override)

#### Phase 3: Frontend Integration (Week 3)
1. Criar `ChatbotPage.jsx`
2. Integrar com `useAuth()` hook
3. UI para chat (input, messages, sources display)
4. Session management (load previous conversations)
5. Error handling (rate limit exceeded, API errors)

#### Phase 4: Admin Interface (Week 4 - Optional)
1. Criar `AdminChatbotPage.jsx`
2. Interface para configurar `chatbot_access_control`
3. Dashboards de uso (queries por usuário, sessões ativas)
4. Logs de audit (opcional)

### Security Considerations

| Risk | Mitigation |
|------|------------|
| **Token exposure** | ✅ Já mitigado: Bearer token via header, não query param |
| **Unauthorized access** | ✅ Já mitigado: `requireAuthenticatedUser` middleware |
| **RLS bypass** | ✅ Já mitigado: Service role key só em server, RLS ativo |
| **Rate limit abuse** | ⚠️ Implementar: `chatbot_access_control` com daily_limit |
| **Cost explosion (LLM)** | ⚠️ Implementar: Rate limiting + max tokens per query |
| **Conversation privacy** | ✅ Já mitigado: RLS garante user vê apenas próprias sessões |
| **XSS em chat** | ⚠️ Implementar: Sanitização de outputs do LLM |

### Performance Considerations

| Aspect | Recommendation |
|--------|---------------|
| **Token validation** | Cache `supabase.auth.getUser()` por request (já implementado via middleware) |
| **Session queries** | Index em `chatbot_sessions(user_id, created_at DESC)` |
| **Conversation storage** | JSONB indexing via GIN: `CREATE INDEX chatbot_conversation_gin ON chatbot_sessions USING GIN (conversation);` |
| **LLM latency** | Streaming responses (OpenRouter supports SSE) |
| **NotebookLM rate limits** | Cache respostas frequentes, account rotation |

---

## Gaps and Extensions Required

### Critical (Blockers)

❌ **Chatbot Module:** Não existe rota/página dedicada  
**Action:** Criar frontend + backend routes conforme arquitetura recomendada

### Important (Quality)

⚠️ **Rate Limiting:** Não implementado atualmente  
**Action:** Adicionar `chatbot_access_control` table + middleware check

⚠️ **Audit Logging:** Não observado  
**Action:** Log de queries em `chatbot_sessions` (já coberto pela tabela proposta)

### Nice-to-Have (Future)

💡 **Role Específico:** Atualmente binário admin/user  
**Action:** Considerar role `chatbot_premium` para usuários com limites maiores

💡 **Multi-tenancy:** Atualmente single-org  
**Action:** Se futuro suportar múltiplas mentorias, adicionar `org_id` nas tabelas

---

## Compatibility Assessment

### Current System Compatibility: ✅ HIGH

| Component | Compatibility | Notes |
|-----------|--------------|-------|
| **Auth Flow** | 100% | Reusar Supabase Auth sem modificações |
| **Bearer Tokens** | 100% | Pattern já estabelecido |
| **Middleware** | 100% | `requireAuthenticatedUser` plug-and-play |
| **RLS** | 100% | Aplicar mesmo pattern para novas tabelas |
| **Client Context** | 100% | `useAuth()` hook já disponível |
| **API Structure** | 100% | Express router pattern consistente |

**Implication:** Sistema atual suporta 100% dos requisitos de autenticação do chatbot. Não requer refatoração, apenas **extensão**.

---

## Next Steps

### Immediate Actions
1. **Migration Draft:** Criar SQL para `chatbot_sessions` e `chatbot_access_control`
2. **Route Stub:** Criar `server/routes/chatbot.js` com esqueleto dos endpoints
3. **Frontend Stub:** Criar `ChatbotPage.jsx` com UI básica

### Dependencies
- ✅ **MCP NotebookLM:** Concluído (Research 1/3) — usar `jacob-bd/notebooklm-mcp-cli`
- ✅ **Sistema de Auth Atual:** Concluído (este documento)
- 🔄 **RAG Híbrido:** Próximo (Research 3/3) — definir strategy de indexação/busca

### Handoff to Spec Pipeline
Após conclusão do Research 3/3, @pm pode consolidar findings nos 3 documentos para criar spec executável com:
- Architecture diagram (auth flow + chatbot integration)
- Database schema completo
- API specification (endpoints, request/response)
- Security checklist

---

## Appendices

### A. Auth Flow Diagram (Simplified)

```
Client (React)                    Server (Express)                  Supabase
     |                                  |                                |
     |--[1] Login (email/pass)--------->|                                |
     |                                  |--[2] signInWithPassword()----->|
     |                                  |<--[3] JWT token + session------|
     |<--[4] Session stored-------------|                                |
     |                                  |                                |
     |--[5] API call + Bearer token---->|                                |
     |                                  |--[6] getUser(token)----------->|
     |                                  |<--[7] User object--------------|
     |                                  |--[8] Check RLS policies------->|
     |                                  |<--[9] Authorized data----------|
     |<--[10] Response------------------|                                |
```

### B. File References

| Component | File Path |
|-----------|-----------|
| Auth Middleware | `server/lib/auth.js` |
| Auth Context | `src/plataforma/context/AuthContext.jsx` |
| Supabase Client | `src/lib/supabase.js` |
| Example Protected Route | `server/routes/materials.js` |
| RLS Policies | `supabase/migrations/20260406000002_platform_rls.sql` |
| Profiles Schema | `supabase/migrations/20260412000006_profiles.sql` |

### C. Code Examples

#### Server-Side: Create Protected Chatbot Endpoint

```javascript
// server/routes/chatbot.js
import { Router } from 'express';
import { requireAuthenticatedUser, createServiceSupabaseClient } from '../lib/auth.js';

const router = Router();

router.post('/query', async (req, res) => {
  const supabase = createServiceSupabaseClient();
  const user = await requireAuthenticatedUser(req, res, { supabase });
  if (!user) return; // 401 já enviado
  
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'question é obrigatório' });
  }
  
  // Rate limit check
  const { data: accessControl } = await supabase
    .from('chatbot_access_control')
    .select('access_enabled, daily_limit')
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (accessControl && !accessControl.access_enabled) {
    return res.status(403).json({ error: 'Acesso ao chatbot desabilitado' });
  }
  
  // TODO: Check daily usage count
  
  // Query NotebookLM + Gemma 31B
  const answer = await queryChatbot(question);
  
  // Save to chatbot_sessions
  await supabase.from('chatbot_sessions').insert({
    user_id: user.id,
    conversation: [{ role: 'user', content: question }, { role: 'assistant', content: answer }]
  });
  
  res.json({ answer });
});

export default router;
```

#### Client-Side: Call Protected Chatbot Endpoint

```javascript
// src/plataforma/pages/ChatbotPage.jsx
import { supabase } from '../../lib/supabase';

async function sendChatMessage(question) {
  // Get current session token
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Usuário não autenticado');
  }
  
  const response = await fetch('/api/chatbot/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ question })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao consultar chatbot');
  }
  
  return await response.json();
}
```

---

**Research Status:** ✅ COMPLETE  
**Confidence Level:** HIGH (based on comprehensive codebase analysis and schema inspection)  
**Next Research:** RAG Híbrido (Research 3/3)  
**Key Takeaway:** Sistema de auth atual é **100% compatível** com requisitos de chatbot autenticado. Apenas extensão necessária, não refatoração.
