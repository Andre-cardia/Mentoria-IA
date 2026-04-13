---
id: "8"
title: "Blog"
status: Planning
created_at: "2026-04-13"
updated_at: "2026-04-13"
---

# Epic 8 — Blog

## Objetivo

Criar uma área de blog completa com artigos públicos e privados, editor rich text para admins, sistema de tags, SEO, compartilhamento social, comentários e agendamento de publicação.

## Contexto do Produto

A plataforma possui uma landing page pública (`/`) e uma área de alunos (`/plataforma`). O blog terá duas faces:
- **Pública** (`/blog`, `/blog/:slug`) — artigos visíveis para qualquer visitante (status=public)
- **Privada** (`/plataforma/blog`, `/plataforma/blog/:slug`) — artigos visíveis apenas para alunos autenticados (visibility=private)

O admin gerencia tudo pelo painel admin já existente.

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Editor rich text | **Tiptap v2** | Melhor integração React, armazena JSON (não HTML), extensível, suporte nativo a imagens por URL |
| Imagens no texto | **Upload AWS S3 + URL externa** | Admin escolhe: faz upload (presigned URL via `/api/blog/image-upload`) ou cola URL externa. Prefixo `blog-images/` no bucket S3 existente. Mesmo pattern de materials |
| Cover image | **AWS S3, prefixo `blog-covers/`** | Mesmo bucket e S3Adapter já configurados. Evita segundo sistema de storage |
| Conteúdo armazenado | **JSONB** (Tiptap document) | Seguro (sem XSS de HTML raw), flexível, renderizado client-side via `@tiptap/react` |
| Scheduling | **Apenas `published_at` + filtro no fetch** | Sem cron, sem `scheduled_at` redundante. Query: `status IN ('published','scheduled') AND published_at <= NOW()` |
| SEO / Open Graph | **react-helmet-async** | Client-side meta tags; suficiente para WhatsApp/Telegram (headless browser); nota: Twitter/LinkedIn bots não executam JS |
| Slugs | **Gerado automaticamente do título** (slugify) | Admin pode editar manualmente |
| Tags | **Tabela `tags` + `post_tags` (many-to-many)** | Flexível, reutilizável entre posts |
| Comentários | **Tabela `post_comments`** | Alunos autenticados comentam, admin modera (status: pending/approved/rejected) |
| RLS público | `visibility='public' AND status='published' AND published_at <= NOW()` | Filtragem no banco, sem lógica no cliente |
| RLS privado | Mesmo filtro + `auth.uid() IS NOT NULL` | Requer autenticação |

## Schema do Banco

```sql
-- Enum de status
CREATE TYPE post_status AS ENUM ('draft', 'published', 'scheduled', 'archived');
CREATE TYPE post_visibility AS ENUM ('public', 'private');
CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected');

-- Posts
CREATE TABLE posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  content_json  jsonb,
  cover_url     text,
  status        post_status NOT NULL DEFAULT 'draft',
  visibility    post_visibility NOT NULL DEFAULT 'public',
  author_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name   text,
  published_at  timestamptz,
  seo_title     text,
  seo_description text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Tags
CREATE TABLE tags (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name  text NOT NULL UNIQUE,
  slug  text NOT NULL UNIQUE
);

-- Post-Tags (many-to-many)
CREATE TABLE post_tags (
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  uuid REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- Comentários
CREATE TABLE post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name  text,
  content    text NOT NULL,
  status     comment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

## Rotas

| Rota | Visibilidade | Componente |
|------|-------------|------------|
| `/blog` | Pública | `BlogPage` (landing — entry point `main.jsx`) |
| `/blog/:slug` | Pública | `BlogPostPage` (landing — entry point `main.jsx`) |
| `/plataforma/blog` | Aluno autenticado | `PlataformaBlogPage` |
| `/plataforma/blog/:slug` | Aluno autenticado | `PlataformaBlogPostPage` |
| `/plataforma/admin/blog` | Admin | `AdminBlogPage` |
| `/plataforma/admin/blog/novo` | Admin | `AdminBlogEditorPage` |
| `/plataforma/admin/blog/:id/editar` | Admin | `AdminBlogEditorPage` |

## Stories

| ID | Título | Tipo | Complexidade | Depende de |
|----|--------|------|-------------|------------|
| 8.1 | DB: Schema do Blog | backend | Small | — |
| 8.2 | Admin: Listagem e gestão de posts | frontend | Small | 8.1 |
| 8.3 | Admin: Editor de post (Tiptap + cover + SEO) | fullstack | Large | 8.1 |
| 8.4 | Public: /blog listagem de artigos | frontend | Small | 8.1 |
| 8.5 | Public: /blog/:slug artigo individual + SEO + social share | frontend | Medium | 8.4 |
| 8.6 | Platform: /plataforma/blog posts privados | frontend | Small | 8.1 |
| 8.7 | Comments: sistema de comentários | fullstack | Medium | 8.5, 8.6 |

## Dependências de Terceiros a Instalar

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder react-helmet-async slugify
```

> **Nota (imagens no editor):** O editor precisará de dois fluxos via modal customizado:
> 1. **Upload** — presigned URL via `/api/blog/image-upload` (mesmo pattern de `api/materials/upload.js`) → AWS S3 prefixo `blog-images/` → URL pública inserida como nó de imagem no Tiptap
> 2. **URL externa** — admin cola URL → inserida diretamente como nó de imagem
> Ambos usam `@tiptap/extension-image`. O modal diferencia os dois modos por aba/toggle.
>
> **Nota (SEO):** `react-helmet-async` funciona para WhatsApp, Telegram e Google. Twitter/X e LinkedIn não executam JS — limitação aceita nesta fase. Story futura pode adicionar Vercel Edge Function para OG rendering server-side.
>
> **Nota (rotas públicas):** `/blog` e `/blog/:slug` devem ser adicionadas ao `src/main.jsx` (entry point da landing page), não ao `src/plataforma-main.jsx`.

## Critério de Done do Epic

- [ ] Admin cria, edita e agenda posts com editor rich text
- [ ] Imagens externas inseridas no editor via URL
- [ ] Cover image com upload para Supabase Storage
- [ ] Posts públicos visíveis em `/blog` sem autenticação
- [ ] Posts privados visíveis em `/plataforma/blog` apenas para alunos
- [ ] Tags funcionando na listagem e no filtro
- [ ] SEO/Open Graph configurado por post
- [ ] Botões de compartilhamento social
- [ ] Comentários de alunos com moderação pelo admin
- [ ] Agendamento de publicação funcionando

---
*Epic criado por Morgan (PM) — 2026-04-13*
