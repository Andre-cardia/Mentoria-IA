---
id: "5"
title: "Minha Conta — Gestão de Perfil do Usuário"
status: Draft
type: brownfield
priority: Medium
created_at: "2026-04-13"
pm: "@pm (Morgan)"
architect: "@architect (Aria)"
---

# Epic 5 — Minha Conta: Gestão de Perfil do Usuário

## Visão Geral

O aluno atualmente não tem nenhuma forma de gerenciar seu próprio perfil após o cadastro inicial. Não há como atualizar nome, telefone, trocar de senha ou adicionar uma foto de identificação. Esta epic cria a página **"Minha Conta"** — a central de identidade do aluno dentro da plataforma.

## Problema de Negócio

Após completar o cadastro inicial (`CompletarPerfilPage`), o aluno fica preso com os dados que informou: não há mecanismo para corrigir o nome, atualizar o telefone, alterar o e-mail ou redefinir a senha. Isso gera dependência do administrador para qualquer ajuste de conta, aumentando o suporte operacional desnecessariamente. A ausência de foto de perfil também torna a experiência impessoal.

## Objetivo Estratégico

Entregar ao aluno autonomia completa sobre sua identidade na plataforma: **dados pessoais editáveis**, **foto de perfil**, **troca de e-mail com confirmação** e **alteração de senha** — tudo com UX consistente com o padrão já estabelecido (inline forms, toasts via sonner, modais de confirmação).

## Métricas de Sucesso

- 100% dos alunos conseguem alterar nome e telefone sem acionar suporte
- Upload de foto de perfil em menos de 5 segundos
- Troca de senha disponível por dois fluxos (self-service + e-mail)
- Zero chamados de suporte para "como troco minha senha?"

## Escopo

### IN — Esta epic cobre:
- Página `/minha-conta` com rota protegida (aluno autenticado)
- Edição de `full_name` e `phone` (tabela `profiles`)
- Upload e exibição de foto de perfil (nova coluna `avatar_url`)
- Exibição da foto no header/navbar da plataforma
- Alteração de e-mail (Supabase Auth `updateUser` + confirmação por e-mail)
- Alteração de senha — dois fluxos:
  - Senha atual + nova senha (inline, na página)
  - Link de redefinição por e-mail (Supabase `resetPasswordForEmail`)
- Feedback via toast (sonner) em todas as operações
- Migração de banco: adicionar coluna `avatar_url` em `profiles`

### OUT — Fora do escopo:
- Edição do campo `origin` (dado de onboarding, imutável)
- Exclusão de conta pelo próprio aluno
- Histórico de alterações
- Autenticação por dois fatores (2FA)
- Integração com redes sociais (OAuth)

## Decisões Técnicas (@architect — resolvidas em 2026-04-13)

| Decisão | Resolução | Motivo |
|---------|-----------|--------|
| Storage para foto de perfil | **AWS S3** (reutiliza `S3Adapter`) | Projeto já usa S3 para materiais; evitar segundo provider |
| Bucket path | `avatars/{user_id}.{ext}` | Sobrescreve ao trocar foto, sem acúmulo |
| Formatos aceitos | JPEG, PNG, WebP | Suporte nativo universal |
| Tamanho máximo | **2 MB** (validação client-side) | Qualidade adequada, previne uploads acidentais |
| Resize/thumbnail | **CSS only** (`object-fit: cover`, ~40px) | Over-engineering evitado; revisar se base > milhares de alunos |
| Nova migration | `ALTER TABLE profiles ADD COLUMN avatar_url text` | Coluna simples, sem NOT NULL |
| Novas rotas servidor | `POST /api/profile/avatar-upload`, `PATCH /api/profile` | Padrão idêntico às rotas de materiais |

## Stories

| ID | Título | Prioridade | Dependências |
|----|--------|-----------|-------------|
| 5.1 | Página "Minha Conta" + Edição de Dados | High | — |
| 5.2 | Foto de Perfil (upload + exibição) | High | 5.1, decisão @architect |
| 5.3 | Alterar E-mail e Senha | Medium | 5.1 |

### Story 5.1 — Página "Minha Conta" + Edição de Dados
- Criar rota `/minha-conta` com `ProtectedRoute`
- Layout consistente com `Layout.jsx` existente
- Formulário inline: `full_name`, `phone`
- Exibir e-mail atual (read-only — editável na Story 5.3)
- Placeholder de avatar (editável na Story 5.2)
- Toast de sucesso/erro via sonner
- Link "Minha Conta" no sidebar/menu do aluno

### Story 5.2 — Foto de Perfil
- Migração: adicionar `avatar_url text` em `profiles`
- Input de upload com preview antes de confirmar
- Armazenamento conforme decisão do @architect
- Exibição no header: avatar circular substituindo ícone genérico
- Fallback: iniciais do nome se sem foto

### Story 5.3 — Alterar E-mail e Senha
- **E-mail:** campo editável + confirmação por e-mail via Supabase Auth
- **Senha (fluxo 1):** campos "senha atual" + "nova senha" + "confirmar nova senha"
- **Senha (fluxo 2):** botão "Esqueci minha senha" → `resetPasswordForEmail` → toast de confirmação
- Validações: senha mínimo 8 caracteres, e-mail único

## Contexto Técnico

**Stack relevante:**
- Auth: Supabase Auth (`@supabase/supabase-js`)
- DB: Tabela `profiles` (user_id, full_name, phone, origin, created_at, updated_at)
- UI: React + Vite, padrão inline forms (ver `AdminModulosPage.jsx`)
- Toast: `sonner` (já instalado desde Epic 2)
- Modal: `ConfirmModal.jsx` (já disponível desde Epic 2)
- Storage: a definir pelo @architect

**Métodos Supabase Auth úteis:**
- `supabase.auth.updateUser({ email })` — troca de e-mail (envia confirmação)
- `supabase.auth.updateUser({ password })` — troca de senha
- `supabase.auth.resetPasswordForEmail(email)` — link de reset

## Riscos

| Risco | Probabilidade | Mitigação |
|-------|-------------|-----------|
| Usuário não confirma troca de e-mail e fica sem acesso | Baixa | Toast informativo + manter e-mail atual até confirmação |
| Upload de imagem muito grande trava a UX | Média | Validar tamanho client-side antes do upload |
| Storage de foto sem RLS adequada expõe fotos de outros usuários | Média | @architect definir política de acesso no bucket |

## Change Log

| Data | Agente | Ação |
|------|--------|------|
| 2026-04-13 | @pm (Morgan) | Epic criado — escopo definido, stories esboçadas, decisões técnicas sinalizadas para @architect |
| 2026-04-13 | @architect (Aria) | Decisões de arquitetura resolvidas — S3 para avatar, 2MB/JPEG+PNG+WebP, CSS-only resize, rotas servidor definidas |
