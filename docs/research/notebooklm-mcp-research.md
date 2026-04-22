# Technical Research: NotebookLM MCP Integration
**Research ID:** TECH-RESEARCH-001  
**Date:** 2026-04-21  
**Analyst:** Atlas (@analyst)  
**Epic Context:** Segundo Cérebro - Integração Obsidian + Chatbot IA

---

## Executive Summary

**Finding:** Existem múltiplos MCPs não-oficiais para NotebookLM, sendo os 3 principais: `notebooklm-mcp-cli` (3.8k stars), `notebooklm-mcp` da PleasePrompto (2k stars), e `notebooklm-mcp` do khengyun (84 stars).

**Recommendation:** O `notebooklm-mcp-cli` (jacob-bd) é o mais viável para o caso de uso de ingestão de conteúdo, pois oferece CLI dedicado e suporte a batch operations, além de ter a maior adoção comunitária.

**Key Risk:** Todos os MCPs usam APIs internas não-documentadas do NotebookLM que podem mudar sem aviso. Rate limits (~50 queries/day no free tier) podem impactar ingestão em larga escala.

---

## Research Objectives

### Primary Questions
1. Existe API oficial do NotebookLM ou apenas MCPs não-oficiais?
2. Como os MCPs extraem conteúdo dos notebooks?
3. Qual o método de autenticação utilizado?
4. Quais as limitações conhecidas (rate limits, manutenção)?
5. Qual MCP é mais adequado para o caso de uso de ingestão?

### Success Criteria
- Identificar pelo menos 3 opções de MCPs viáveis
- Documentar approach técnico de cada opção
- Avaliar maturidade e manutenção ativa
- Recomendar solução específica com justificativa

---

## Methodology

### Data Sources
- GitHub Search API (`gh search repos`)
- MCP Official Registry (registry.modelcontextprotocol.io)
- GitHub repository analysis (READMEs, releases, commits)

### Analysis Framework
- **Popularity:** Stars, forks, community engagement
- **Maturity:** Last commit date, release frequency, issue management
- **Technical Approach:** Authentication method, API vs scraping
- **Feature Set:** CLI support, batch operations, content extraction
- **Limitations:** Rate limits, known issues, maintenance status

### Limitations
- Analysis based on public documentation only (no hands-on testing)
- Rate limit data provided by projects, not independently verified
- API stability cannot be guaranteed (unofficial APIs)

---

## Key Findings

### 1. No Official API Exists

**Evidence:**
- MCP Official Registry search: No NotebookLM server listed
- modelcontextprotocol/servers repository: Only 7 reference servers, NotebookLM not included
- All found MCPs explicitly state use of "internal, undocumented APIs"

**Implication:** Qualquer integração está sujeita a quebras se Google alterar as APIs internas do NotebookLM.

### 2. Multiple Community MCPs Available

GitHub search returned **10 MCPs** relacionados a NotebookLM, com 3 líderes claros:

| Repository | Stars | Last Update | Status |
|------------|-------|-------------|--------|
| jacob-bd/notebooklm-mcp-cli | 3,819 | 2026-04-21 | ✅ Ativo |
| PleasePrompto/notebooklm-mcp | 2,062 | 2026-04-21 | ✅ Ativo |
| khengyun/notebooklm-mcp | 84 | 2026-04-14 | ✅ Ativo |

### 3. Technical Approaches

All 3 MCPs use **browser automation** + **internal API access**:

#### jacob-bd/notebooklm-mcp-cli
- **Authentication:** Cookie extraction via headless browser (auto or manual)
- **Cookie Persistence:** 2-4 weeks with auto-refresh
- **Extraction Method:** Internal API calls (NOT scraping)
- **Key Features:**
  - Dual CLI (`nlm`) + MCP server
  - Batch operations across multiple notebooks
  - Source management (URLs, text, Drive files)
  - Content generation (audio, video, slides)
  - Query with persistence
  - Artifact downloads
  
#### PleasePrompto/notebooklm-mcp
- **Authentication:** Chrome automation (one-time Google login)
- **Cookie Persistence:** Stored locally for subsequent sessions
- **Extraction Method:** Chrome automation interacting with NotebookLM UI
- **Key Features:**
  - Zero hallucination design (refuses if data not in docs)
  - Smart library management with tagging
  - Auto-selection of relevant notebooks
  - Citation-backed answers
  - Cross-tool compatibility (Claude Code, Codex, Cursor)
  - Tool profiles (minimal, standard, full)

#### khengyun/notebooklm-mcp
- **Authentication:** Persistent browser profile (one-time Google login)
- **Cookie Persistence:** Chrome profile directory
- **Extraction Method:** Chat interaction (message send/receive)
- **Key Features:**
  - FastMCP v2 framework (decorator-based)
  - Multiple transport protocols (STDIO, HTTP, SSE)
  - Full Pydantic validation
  - Focus on chat interaction rather than content extraction

### 4. Rate Limits & Constraints

| MCP | Rate Limit | Notes |
|-----|------------|-------|
| jacob-bd | ~50 queries/day (free tier) | Can use multiple accounts |
| PleasePrompto | Free tier limited | Account switching supported |
| khengyun | Not specified | Depends on NotebookLM service |

**Common Constraint:** All depend on Google NotebookLM service availability.

### 5. Maintenance Status

All 3 MCPs show **active maintenance** as of April 2026:

- **jacob-bd:** v0.5.27 released 2026-04-21 (today)
- **PleasePrompto:** v1.2.1 released 2025-12-27, 26 open issues, 4 PRs
- **khengyun:** v2.0.11 released 2025-09-15, 102 commits

---

## Comparative Analysis

### Use Case Fit: Ingestão de Conteúdo para Obsidian

| Criteria | jacob-bd | PleasePrompto | khengyun |
|----------|----------|---------------|----------|
| **Batch Operations** | ✅ Yes | ⚠️ Limited | ❌ No |
| **CLI Support** | ✅ Yes (`nlm`) | ❌ No | ❌ No |
| **Content Extraction** | ✅ Direct API | ⚠️ UI automation | ⚠️ Chat-based |
| **Community Size** | ✅ 3.8k stars | ✅ 2k stars | ⚠️ 84 stars |
| **Recent Updates** | ✅ Today | ✅ Recent | ✅ Recent |
| **Documentation** | ✅ Comprehensive | ✅ Good | ⚠️ Basic |

### Strengths & Weaknesses

#### jacob-bd/notebooklm-mcp-cli

**Strengths:**
- Largest community and highest adoption
- Dual CLI + MCP mode (flexibility)
- Explicit batch operations support
- Direct API access (faster than UI automation)
- Comprehensive feature set
- Active development (released today)

**Weaknesses:**
- Unofficial API dependency
- Rate limits on free tier
- Cookie expiration requires re-auth every 2-4 weeks

**Best For:** Ingestão automatizada em larga escala, scripts de automação, integração CI/CD

#### PleasePrompto/notebooklm-mcp

**Strengths:**
- Zero hallucination focus (ideal for Q&A chatbot)
- Smart library management with tagging
- Auto-selection of relevant notebooks
- Citation-backed responses
- Good for Claude Code integration

**Weaknesses:**
- No CLI mode (MCP only)
- UI automation (slower than API)
- Google detection risk mentioned

**Best For:** Chatbot Q&A com consulta em tempo real, uso interativo dentro do Claude Code

#### khengyun/notebooklm-mcp

**Strengths:**
- Modern FastMCP v2 framework
- Type safety with Pydantic
- Multiple transport protocols

**Weaknesses:**
- Smallest community
- Focus on chat interaction, not extraction
- Limited documentation on content extraction

**Best For:** Integração personalizada em aplicações custom, não para ingestão

---

## Opportunity Assessment

### Recommended Approach: Hybrid Strategy

**Primary:** `jacob-bd/notebooklm-mcp-cli` para ingestão  
**Secondary:** `PleasePrompto/notebooklm-mcp` para chatbot Q&A

**Rationale:**
1. **Ingestão de Conteúdo:** Use `jacob-bd` CLI (`nlm`) para extrair notebooks e converter para Markdown
   - Batch operations permitem processar múltiplos notebooks
   - API interna é mais rápida que UI automation
   - CLI pode ser agendado via cron/GitHub Actions

2. **Chatbot Q&A:** Use `PleasePrompto` MCP para consultas em tempo real
   - Zero hallucination design alinhado com necessidade de precisão
   - Smart library management reduz necessidade de seleção manual
   - Citation-backed responses aumentam confiança nas respostas

### Implementation Strategy

#### Phase 1: POC - Ingestão via jacob-bd CLI
```bash
# Install
pip install notebooklm-mcp-cli

# Login (one-time)
nlm login --auto

# Extract notebook to markdown
nlm query --notebook-url <url> --output markdown --download-path ./obsidian/

# Batch processing
nlm batch-query --notebook-list notebooks.txt --output-dir ./obsidian/
```

#### Phase 2: Integração Admin
- Interface admin para selecionar notebooks (URLs)
- Script de agendamento (cron/Actions) que roda `nlm batch-query`
- Conversão adicional se formato markdown do `nlm` não for compatível com Obsidian

#### Phase 3: Chatbot com PleasePrompto MCP
- Configurar MCP no Claude Code (ou ambiente de execução do chatbot)
- Integrar com área autenticada da Mentoria
- Roteamento de perguntas para o MCP
- LLM Gemma 31B processa respostas do MCP

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **API instability** | Monitor project releases, implement version pinning, fallback para export manual |
| **Rate limits** | Multi-account rotation (suportado por ambos MCPs), cache de respostas |
| **Cookie expiration** | Automated re-auth workflow, alert se auth falhar |
| **Google detection** | Respeitar rate limits, usar user-agents realistas, rotacionar contas |
| **Dependência única** | Ter `PleasePrompto` como backup para ingestão se `jacob-bd` falhar |

---

## Strategic Recommendations

### Go-to-Market for POC

1. **Week 1:** Setup técnico
   - Instalar `jacob-bd` CLI
   - Testar extração de 1-2 notebooks
   - Validar formato markdown compatível com Obsidian

2. **Week 2:** Automação de ingestão
   - Criar script de batch processing
   - Setup cron/GitHub Actions
   - Interface admin básica para seleção de notebooks

3. **Week 3:** Integração chatbot
   - Configurar `PleasePrompto` MCP
   - Integrar com Gemma 31B via OpenRouter
   - Teste de Q&A com conteúdo ingerido

4. **Week 4:** Refinamento e deploy
   - Ajustes de UX
   - Tratamento de erros e fallbacks
   - Deploy em produção (área autenticada)

### Pricing Impact (OpenRouter)

**Gemma 31B via OpenRouter:**
- Input: ~$0.10 per 1M tokens
- Output: ~$0.50 per 1M tokens

**Estimated Monthly Cost (assumptions):**
- 1000 queries/month
- Avg 2000 tokens input (context) + 500 tokens output
- Cost: (1000 * 2000 * 0.10 / 1M) + (1000 * 500 * 0.50 / 1M) = ~$0.45/month

**Note:** NotebookLM rate limits (~50/day free) podem ser o maior constraint, não custo de LLM.

---

## Next Steps

### Immediate Actions
1. **POC Setup:** Instalar `jacob-bd/notebooklm-mcp-cli` e testar extração de 1 notebook
2. **Markdown Validation:** Verificar se formato exportado é compatível com Obsidian (frontmatter, links, etc)
3. **Auth Testing:** Validar processo de autenticação e persistência de cookies

### Research Dependencies
- ✅ **MCP NotebookLM:** Concluído (este documento)
- 🔄 **Sistema de Auth Atual:** Próximo (Research 2/3)
- 🔄 **RAG Híbrido:** Próximo (Research 3/3)

### Handoff to Spec Pipeline
Após conclusão dos 3 researches, @pm pode usar findings para criar spec executável com:
- Architecture decision record (ADR) sobre escolha de MCPs
- Implementation plan detalhado
- Constraints e assumptions documentados

---

## Appendices

### A. Data Sources

1. **GitHub API:**
   - `gh search repos "notebooklm mcp" --limit 10`
   - Repository READMEs via WebFetch

2. **MCP Registry:**
   - https://registry.modelcontextprotocol.io/
   - https://github.com/modelcontextprotocol/servers

3. **Community Resources:**
   - GitHub Topics: https://github.com/topics/mcp-server

### B. Full Repository List (Top 10)

1. jacob-bd/notebooklm-mcp-cli - 3,819 stars - 2026-04-21
2. PleasePrompto/notebooklm-mcp - 2,062 stars - 2026-04-21
3. khengyun/notebooklm-mcp - 84 stars - 2026-04-14
4. roomi-fields/notebooklm-mcp - 52 stars - 2026-04-19
5. Pantheon-Security/notebooklm-mcp-secure - 56 stars - 2026-04-21
6. alfredang/notebooklm-mcp - 15 stars - 2026-04-11
7. jackc1111/antigravity-notebooklm-mcp - 23 stars - 2026-03-26
8. duykhanhbv-bit/notebooklm-mcp-antigravity - 21 stars - 2026-04-08
9. m4yk3ldev/notebooklm-mcp - 12 stars - 2026-04-21
10. inventra/notebooklm-mcp - 8 stars - 2026-02-07

### C. Command Reference

#### jacob-bd CLI Commands
```bash
# Authentication
nlm login [--auto | --manual]
nlm logout

# Notebook operations
nlm list-notebooks
nlm create-notebook --title "Name"
nlm add-source --notebook-url <url> --source-url <url>

# Query operations
nlm query --notebook-url <url> --question "..."
nlm batch-query --notebook-list file.txt

# Content generation
nlm generate-audio --notebook-url <url>
nlm generate-video --notebook-url <url>

# Downloads
nlm download-artifact --url <artifact-url> --output-dir ./
```

---

**Research Status:** ✅ COMPLETE  
**Confidence Level:** HIGH (based on comprehensive GitHub data and documentation analysis)  
**Next Research:** Sistema de Auth Atual (Research 2/3)
