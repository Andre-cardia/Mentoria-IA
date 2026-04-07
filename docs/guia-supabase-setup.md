# Guia Supabase — Setup Completo da Plataforma

**Story:** 1.3 | **Última atualização:** 2026-04-06

---

## Visão Geral

Este guia cobre tudo que precisa ser feito no Supabase para a plataforma funcionar em produção:

1. Criar o projeto no Supabase (se ainda não existe)
2. Coletar as credenciais para o Vercel
3. Instalar e configurar o Supabase CLI
4. Aplicar as 4 migrations (tabelas + RLS)
5. Criar o usuário admin
6. Criar um aluno de teste
7. Validar que tudo está correto

---

## ✅ PARTE 1 — Criar o Projeto no Supabase (CONCLUÍDO)

> **Pule esta parte** se o projeto já existe.

### Passo 1 — Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) → **Start your project**
2. Faça login com GitHub ou email
3. Clique em **New project**
4. Preencha:
   - **Name:** `mentoria-ia`
   - **Database Password:** crie uma senha forte e **anote — você vai precisar**
   - **Region:** escolha `South America (São Paulo)` para menor latência
5. Clique em **Create new project**
6. Aguarde o projeto provisionar (~2 minutos)

---

## ✅ PARTE 2 — Coletar Credenciais (CONCLUÍDO)

Você vai precisar de 3 valores do Supabase para configurar o Vercel.

### Passo 2 — Acessar as chaves de API

1. No dashboard do projeto, clique em **Settings** (ícone de engrenagem, menu lateral esquerdo)
2. Clique em **API**
3. Você verá:

```
Project URL
https://abcdefghijklmnop.supabase.co
                    ↑
              Copie este valor → VITE_SUPABASE_URL
```

```
Project API Keys

anon / public
eyJhbGciOiJIUzI1NiIsInR5cCI6...
                    ↑
              Copie este valor → VITE_SUPABASE_ANON_KEY

service_role  ⚠️ Secreta — nunca expor no frontend
eyJhbGciOiJIUzI1NiIsInR5cCI6...
                    ↑
              Copie este valor → SUPABASE_SERVICE_KEY
```

4. Copie e salve os 3 valores em um lugar seguro (ex: arquivo local `.env`)

### Passo 3 — Obter o Reference ID

1. Ainda em **Settings**, clique em **General**
2. Localize o campo **Reference ID**:

```
Reference ID
abcdefghijklmnop
      ↑
  Copie este valor — necessário para o CLI
```

---

## ✅ PARTE 3 e 4 — Instalar CLI e Aplicar as Migrations (CONCLUÍDO MANUALMENTE NO SQL EDITOR)

### Passo 4 — Instalar o CLI

O jeito mais prático e recomendado (especialmente no Windows) é utilizar o `npx` (já embutido no Node.js). Assim, você não precisa instalar o CLI globalmente e evita erros de permissão.

**Verificar a execução via npx:**
```bash
npx supabase --version
```

> Resultado esperado: `2.x.x`

### Passo 5 — Fazer login no CLI

```bash
npx supabase login
```

- Vai abrir o navegador automaticamente
- Faça login com a sua conta Supabase
- Volte ao terminal — deve aparecer: `Logged in as seuemail@exemplo.com`

### Passo 6 — Vincular o projeto local

No terminal, navegue até a pasta do projeto:

```bash
cd D:/github/mentoria-ia
```

Execute o link com o Reference ID copiado no Passo 3:

```bash
npx supabase link --project-ref abcdefghijklmnop
```

Quando solicitado:
```
Enter your database password:
```
Digite a **Database Password** que você criou no Passo 1 e pressione Enter.

> Resultado esperado: `Finished supabase link.`

---

## ✅ PARTE 4 — Aplicar as Migrations (CONCLUÍDO VIA PAINEL)

As migrations criam todas as tabelas e configuram as políticas de segurança (RLS).

### Tabelas que serão criadas:

| Tabela | Função |
|--------|--------|
| `modules` | Módulos do curso |
| `lessons` | Aulas (pertencem a um módulo) |
| `forum_topics` | Tópicos do fórum |
| `forum_replies` | Respostas do fórum |
| `materials` | Materiais didáticos (metadados do S3) |
| `announcements` | Quadro de avisos |
| `lesson_progress` | Progresso individual de cada aluno |

### Passo 7 — Verificar migrations pendentes

```bash
npx supabase migration list
```

Você deve ver 4 migrations com status `pending`:

```
        LOCAL      │ REMOTE │ TIME (UTC)
  ─────────────────┼────────┼──────────────────────
  20260406000001   │        │ 2026-04-06 00:00:01
  20260406000002   │        │ 2026-04-06 00:00:02
  20260406000003   │        │ 2026-04-06 00:00:03
  20260406000004   │        │ 2026-04-06 00:00:04
```

### Passo 8 — Aplicar as migrations

```bash
npx supabase db push
```

O CLI vai mostrar as migrations que serão aplicadas e pedir confirmação:

```
Do you want to push these migrations to the remote database?
 • 20260406000001_platform_tables.sql
 • 20260406000002_platform_rls.sql
 • 20260406000003_lesson_progress.sql
 • 20260406000004_lesson_progress_rls.sql

[Y/n]
```

Digite `Y` e pressione Enter.

> Resultado esperado:
> ```
> Applying migration 20260406000001_platform_tables.sql...
> Applying migration 20260406000002_platform_rls.sql...
> Applying migration 20260406000003_lesson_progress.sql...
> Applying migration 20260406000004_lesson_progress_rls.sql...
> Finished supabase db push.
> ```

### Passo 9 — Confirmar que foi aplicado

```bash
npx supabase migration list
```

Agora deve aparecer com as datas preenchidas em `REMOTE`:

```
        LOCAL      │     REMOTE      │ TIME (UTC)
  ─────────────────┼─────────────────┼──────────────────
  20260406000001   │ 20260406000001  │ 2026-04-06 ...
  20260406000002   │ 20260406000002  │ 2026-04-06 ...
  20260406000003   │ 20260406000003  │ 2026-04-06 ...
  20260406000004   │ 20260406000004  │ 2026-04-06 ...
```

### Verificação alternativa no Dashboard

1. No Supabase Dashboard, clique em **Table Editor**
2. Você deve ver as tabelas na lista:
   - `modules`, `lessons`, `forum_topics`, `forum_replies`, `materials`, `announcements`, `lesson_progress`

Se as tabelas aparecem → **migrations aplicadas com sucesso** ✓

---

## ✅ PARTE 5 e 6 — Criar Usuários (CONCLUÍDO)

### Passo 10 — Criar o usuário no Authentication

1. No Supabase Dashboard, clique em **Authentication** (menu lateral)
2. Clique em **Users**
3. Clique no botão **Add user → Create new user**
4. Preencha:
   - **Email:** `admin@mentoria.com` (ou o email que preferir)
   - **Password:** crie uma senha forte
   - Marque **Auto Confirm User** (para não precisar confirmar por email agora)
5. Clique em **Create user**

### Passo 11 — Atribuir role de admin via SQL

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New query**
3. Cole o SQL abaixo, **substituindo o email**:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@mentoria.com';
```

4. Clique em **Run** (ou `Ctrl+Enter`)
5. Confirme que o resultado mostra:
   ```
   Success. 1 rows affected.
   ```

### Passo 12 — Verificar que o role foi aplicado

```sql
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'admin@mentoria.com';
```

O campo `raw_user_meta_data` deve mostrar:
```json
{"role": "admin"}
```

---

## PARTE 6 — Criar Usuário Aluno (para testes)

### Passo 13 — Criar segundo usuário

Repita o **Passo 10** com um email diferente:
- **Email:** `aluno@mentoria.com`
- **Password:** senha de teste

**Não execute o SQL do Passo 11** — sem `role: admin`, o usuário é tratado automaticamente como aluno.

### Verificação opcional

```sql
SELECT email, raw_user_meta_data
FROM auth.users
ORDER BY created_at;
```

Deve mostrar:
```
admin@mentoria.com  | {"role": "admin"}
aluno@mentoria.com  | {}
```

---

## PARTE 7 — Verificar RLS (Row Level Security)

As migrations já configuram o RLS automaticamente. Para confirmar:

1. No Supabase Dashboard, clique em **Table Editor**
2. Selecione a tabela `lesson_progress`
3. Clique em **RLS** (canto superior direito)
4. Confirme que RLS está **enabled** e as políticas existem:
   - `aluno gerencia progresso` — FOR ALL, usando `auth.uid() = user_id`
   - `admin le progresso` — FOR SELECT, usando `role = 'admin'`

---

## Resumo dos Comandos

```bash
# 1. Login
supabase login

# 2. Vincular projeto (substitua pelo seu Reference ID)
supabase link --project-ref abcdefghijklmnop

# 3. Ver migrations pendentes
supabase migration list

# 4. Aplicar migrations
supabase db push

# 5. Confirmar aplicação
supabase migration list
```

**SQL para criar admin** (executar no SQL Editor do Dashboard):
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'seu-email@exemplo.com';
```

---

## Problemas Comuns

### `supabase: command not found`
O CLI não foi instalado corretamente. Tente via npm:
```bash
npm install -g supabase
```

### `Error: Invalid database password`
A senha digitada no `supabase link` está incorreta. Redefina em:  
Supabase Dashboard → **Settings → Database → Reset database password**

### `Error: relation "public.modules" already exists`
As tabelas já existem. Isso pode acontecer se a migration foi aplicada manualmente antes. Execute:
```bash
supabase migration repair --status applied 20260406000001
supabase migration repair --status applied 20260406000002
supabase migration repair --status applied 20260406000003
supabase migration repair --status applied 20260406000004
```

### `1 rows affected` não aparece no SQL do admin
Verifique se o email digitado bate exatamente com o cadastrado (maiúsculas/minúsculas):
```sql
SELECT email FROM auth.users;
```

### Usuário loga mas não vê área de admin
O `raw_user_meta_data` não tem `role: admin`. Execute novamente o SQL do Passo 11 e verifique o Passo 12.
