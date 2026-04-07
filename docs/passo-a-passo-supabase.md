# Passo a Passo Rápido e Descomplicado do Supabase

Siga os 5 passos abaixo exatamente como descritos para configurar todo o banco de dados e usuários de forma rápida e sem confusão.

## ✅ 1. Criar o Projeto no Supabase (CONCLUÍDO)
1. Acesse [supabase.com](https://supabase.com) e inicie um novo projeto.
2. Preencha os campos (nome: `mentoria-ia`, região: `São Paulo`).
3. **ATENÇÃO:** Crie uma senha para o banco de dados (Database Password) e **anote ela em algum lugar**. Você precisará dela.
4. Clique em "Create new project".

## ✅ 2. Guardar as Chaves no seu projeto (Configurar .env) (CONCLUÍDO)
1. No dashboard do Supabase, vá na aba lateral em **Settings (ícone de engrenagem) > API**.
2. Copie as chaves de lá e cole no seu arquivo `.env` dentro do projeto do seu computador:
   - A **Project URL** vai no campo `VITE_SUPABASE_URL`
   - A chave **anon / public** vai no campo `VITE_SUPABASE_ANON_KEY`
   - A chave **service_role** vai no campo `SUPABASE_SERVICE_KEY`
3. Ainda em **Settings > General**, encontre seu **Reference ID** e copie-o (você o usará abaixo).

## ✅ 3. Subir as Tabelas para o Banco (Migrations) (CONCLUÍDO)
Abra o terminal do seu computador, na pasta do projeto Mentoria-IA, e rode os seguintes comandos (já usamos o `npx` para você não precisar instalar nada extra):

1. **Faça login na sua conta Supabase pelo terminal:**
   ```bash
   npx supabase login
   ```
   *(Uma janela do navegador vai abrir para você confirmar).*

2. **Vincule seu projeto local ao servidor do Supabase:**
   Substitua o trecho `<SEU_REFERENCE_ID>` pelo ID que você copiou no passo 2 acima.
   ```bash
   npx supabase link --project-ref <SEU_REFERENCE_ID>
   ```
   *(Ele vai te pedir a "Database Password" que você anotou no Passo 1. Digite e dê Enter).*

3. **Envie as tabelas para o Supabase:**
   ```bash
   npx supabase db push
   ```
   *(Aperte `Y` quando ele perguntar se confirma).*

## ✅ 4. Criar Usuários no Painel (CONCLUÍDO)
1. Volte pro site do Supabase e clique em **Authentication > Users** no menu à esquerda.
2. Clique em **Add user > Create new user**.
3. **Crie 2 usuários:**
   - E-mail 1: `admin@mentoria.com` (marque a caixa "Auto Confirm User") - *Este será o Admin.*
   - E-mail 2: `aluno@mentoria.com` (marque a caixa "Auto Confirm User") - *Este será o Aluno.*

## ✅ 5. Dar Permissão Oficial ao Admin (CONCLUÍDO)
O último detalhe é avisar pro sistema que o "admin@mentoria.com" é dono da plataforma.

1. No menu esquerdo do Supabase, clique em **SQL Editor** e depois em **New query**.
2. Cole o código abaixo na área de texto:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'admin@mentoria.com';
   ```
3. Clique em **Run** no canto direito inferior da tela (ou aperte `Ctrl+Enter`).

---
🌟 **Terminou!** Seu banco está com todas as tabelas prontas, com as permissões funcionando, usuário admin ativado e pronto pro sistema!
