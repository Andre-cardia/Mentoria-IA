# Guia de Deploy — Plataforma Mentoria Zero-to-Hero IA

**Story:** 1.3 — Deploy de Produção e Validação End-to-End  
**Última atualização:** 2026-04-06

---

## Pré-requisitos

Antes de começar, confirme que você tem:

- [ ] Acesso ao [Supabase Dashboard](https://supabase.com/dashboard) do projeto
- [ ] Acesso ao [AWS Console](https://console.aws.amazon.com/) com permissões no bucket S3
- [ ] Acesso ao [Vercel Dashboard](https://vercel.com/dashboard) com o projeto conectado ao repositório
- [ ] Node.js instalado localmente
- [ ] Supabase CLI (você pode usar direto pelo comando `npx supabase`, sem instalar globalmente)

---

## ✅ ETAPA 1 — Supabase: Aplicar Migrations (CONCLUÍDO)

### 1.1 — Login no Supabase CLI

Abra o terminal e execute:

```bash
supabase login
```

> Abrirá o browser para autenticação. Faça login com sua conta Supabase.

### 1.2 — Obter o Project Reference ID

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings → General**
4. Copie o valor de **Reference ID** (formato: `abcdefghijklmnop`)

### 1.3 — Vincular projeto local

No terminal, dentro da pasta do projeto:

```bash
cd D:/github/mentoria-ia
supabase link --project-ref SEU_PROJECT_REF
```

> Substitua `SEU_PROJECT_REF` pelo Reference ID copiado.  
> Quando solicitado, informe a **database password** (Settings → Database → Database password).

### 1.4 — Verificar migrations pendentes

```bash
supabase migration list
```

Você deve ver as 4 migrations com status **pending**:
- `20260406000001_platform_tables`
- `20260406000002_platform_rls`
- `20260406000003_lesson_progress`
- `20260406000004_lesson_progress_rls`

### 1.5 — Aplicar migrations em produção

```bash
supabase db push
```

> ⚠️ Confirmará antes de executar. Digite `y` para prosseguir.

**Verificação:** Execute novamente `supabase migration list` — todas devem aparecer como **applied**.

---

## ✅ ETAPA 2 — Supabase: Criar Usuário Admin (CONCLUÍDO)

### 2.1 — Criar o usuário

1. No Supabase Dashboard, vá em **Authentication → Users**
2. Clique em **Invite user** (ou **Add user**)
3. Informe o email e senha do administrador
4. Clique em **Create user**

### 2.2 — Atribuir role de admin

**Opção A — via SQL Editor (recomendado):**

1. No Supabase Dashboard, vá em **SQL Editor**
2. Execute o comando abaixo, substituindo o email:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'seu-email-admin@exemplo.com';
```

3. Clique em **Run** e confirme que retornou `1 row affected`

**Opção B — via Table Editor:**

1. Vá em **Table Editor → auth.users**
2. Localize o usuário pelo email
3. Edite a coluna `raw_user_meta_data`
4. Adicione `"role": "admin"` ao JSON existente

### 2.3 — Criar usuário aluno para testes (opcional mas recomendado)

Repita o passo 2.1 com um email diferente. **Não execute o SQL do passo 2.2** — usuários sem `role: admin` são tratados como alunos automaticamente.

---

## ETAPA 3 — AWS S3: Configurar CORS para Produção

### 3.1 — Acessar configuração do bucket

1. Acesse o [AWS Console](https://console.aws.amazon.com/) → **S3**
2. Clique no bucket `mentoria-ia-materials`
3. Vá na aba **Permissions**
4. Role até **Cross-origin resource sharing (CORS)**
5. Clique em **Edit**

### 3.2 — Configurar CORS

Cole o JSON abaixo (substituindo o domínio Vercel real depois do deploy):

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://*.vercel.app"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Clique em **Save changes**

> Após confirmar a URL de produção do Vercel (ex: `https://mentoria-ia.vercel.app`), adicione-a explicitamente ao `AllowedOrigins` para maior segurança.

---

## ETAPA 4 — Vercel: Configurar Variáveis de Ambiente

### 4.1 — Coletar os valores necessários

Antes de acessar o Vercel, colete os seguintes valores no **Supabase Dashboard → Settings → API**:

| Variável | Onde encontrar |
|----------|---------------|
| `VITE_SUPABASE_URL` | **Project URL** (ex: `https://abcdef.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **Project API Keys → anon / public** |
| `SUPABASE_SERVICE_KEY` | **Project API Keys → service_role** ⚠️ secreta |

E no **AWS Console → IAM → Users → mentoria-ia-user → Security credentials**:

| Variável | Onde encontrar |
|----------|---------------|
| `AWS_ACCESS_KEY_ID` | Access key ID (visível na listagem) |
| `AWS_SECRET_ACCESS_KEY` | Secret (gerado na criação — verifique o arquivo CSV salvo) |
| `AWS_BUCKET` | `mentoria-ia-materials` |
| `AWS_REGION` | Região do bucket (ex: `us-east-1`) |

### 4.2 — Adicionar variáveis no Vercel

1. Acesse o [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto **Mentoria-IA**
3. Vá em **Settings → Environment Variables**
4. Para cada variável abaixo, clique em **Add** e selecione os environments **Production** e **Preview**:

| Variável | Tipo |
|----------|------|
| `VITE_SUPABASE_URL` | Plain text |
| `VITE_SUPABASE_ANON_KEY` | Plain text |
| `SUPABASE_SERVICE_KEY` | **Secret** |
| `AWS_BUCKET` | Plain text |
| `AWS_REGION` | Plain text |
| `AWS_ACCESS_KEY_ID` | Plain text |
| `AWS_SECRET_ACCESS_KEY` | **Secret** |

> ⚠️ **IMPORTANTE:** As variáveis com prefixo `VITE_` são usadas no build do frontend. Elas devem estar disponíveis **no momento do build**, não apenas em runtime. O Vercel faz isso automaticamente quando configuradas como Environment Variables.

### 4.3 — Acionar novo deploy

1. Vá em **Deployments** no Vercel
2. Clique no deploy mais recente
3. Clique em **Redeploy** (com as novas variáveis)
4. Aguarde o build finalizar com status **Ready**

### 4.4 — Verificar a URL de produção

Após o deploy, anote a URL gerada (ex: `https://mentoria-ia-xyz.vercel.app`).

A plataforma estará acessível em:
```
https://mentoria-ia-xyz.vercel.app/plataforma/login
```

---

## ETAPA 5 — Validação End-to-End

### 5.1 — Fluxo Admin

1. Acesse `[URL]/plataforma/login`
2. Faça login com o email/senha do admin criado na Etapa 2
3. Confirme redirecionamento para `/plataforma/modulos`
4. No menu lateral, acesse **Admin → Módulos & Aulas**
5. Crie um módulo: **"Módulo 1 — Introdução à IA"**
6. Crie uma aula dentro do módulo com `video_url`:
   - Use uma URL YouTube real, ex: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
7. Acesse **Admin → Avisos** → publique um aviso de teste
8. Acesse **Admin → Progresso** → confirme que a página carrega (vazia por enquanto)

**Resultado esperado:** Todas as páginas carregam sem erro 500 ou tela em branco.

### 5.2 — Fluxo Aluno

1. Abra uma aba anônima (ou outro navegador)
2. Acesse `[URL]/plataforma/login`
3. Faça login com o email/senha do aluno de teste
4. Confirme que a tela **Módulos & Aulas** carrega com o módulo criado
5. Clique no módulo → confirme que a aula aparece
6. Clique em **Assistir** → confirme que o player YouTube embarca na página (não abre nova aba)
7. Clique em **Marcar como concluída** → botão muda para "✓ Aula concluída"
8. Clique em **← Voltar aos módulos** → confirme badge **✓ Concluída** na aula
9. Confirme que a barra de progresso do módulo atualiza (1/1)
10. Acesse **Avisos** → confirme que o aviso publicado pelo admin aparece
11. Clique em **Sair** → confirme redirecionamento para `/login`

### 5.3 — Validação Upload S3

1. Faça login como **admin**
2. Acesse **Admin → Materiais**
3. Clique em **Upload** → selecione um arquivo PDF pequeno (< 1MB)
4. Confirme mensagem de sucesso
5. Abra aba anônima → faça login como **aluno**
6. Acesse **Materiais** → confirme que o arquivo aparece na lista
7. Clique em **Download** → arquivo deve fazer download sem erro 403

**Resultado esperado:** Upload e download funcionam sem erros CORS ou de autenticação.

### 5.4 — Validação RLS (Cross-User)

1. **Aluno A** (logado na Etapa 5.2): já marcou a aula como concluída
2. Abra outra aba anônima → faça login como **Aluno B** (crie um terceiro usuário se necessário)
3. Acesse **Módulos & Aulas** → a mesma aula
4. Confirme que **NÃO aparece** o badge **✓ Concluída** (progresso é isolado por usuário)
5. No **Admin → Progresso**: confirme que aparecem as conclusões do Aluno A mas não as do Aluno B (que não marcou nada)

---

## ETAPA 6 — Pós-Validação

### 6.1 — Atualizar CORS com URL definitiva (opcional)

Após confirmar a URL de produção, volte na Etapa 3 e adicione a URL exata ao `AllowedOrigins` do S3:

```json
"https://mentoria-ia-xyz.vercel.app"
```

### 6.2 — Registrar conclusão nas stories

Após validar tudo, atualize os arquivos de story:

- `docs/stories/1.1.story.md` → marcar Task 6.5 como `[x]`
- `docs/stories/1.2.story.md` → marcar Tasks 6.1 e 6.2 como `[x]`
- `docs/stories/1.3.story.md` → marcar todas as tasks como `[x]`, mudar status para `Ready for Review`

### 6.3 — Commit e push

```bash
# Pelo agente @devops:
# @devops *push
```

---

## Troubleshooting

### Erro: "relation does not exist"
**Causa:** Migrations não foram aplicadas.  
**Fix:** Execute `supabase db push` novamente e verifique `supabase migration list`.

### Erro 403 no download do S3
**Causa:** CORS não configurado para o domínio Vercel ou IAM sem permissão `s3:GetObject`.  
**Fix:** Verifique a configuração CORS na Etapa 3 e as permissões IAM do usuário.

### Variáveis VITE_ retornam `undefined` em produção
**Causa:** Variáveis não estavam disponíveis no momento do build.  
**Fix:** Confirme que estão configuradas no Vercel como Environment Variables (não apenas secrets de runtime). Faça redeploy após configurar.

### Login falha com "Invalid credentials"
**Causa:** Email/senha incorretos ou usuário não confirmado.  
**Fix:** No Supabase Dashboard → Authentication → Users → verifique se o usuário está com status "Confirmed". Se não, clique em "Send confirmation email" ou confirme manualmente.

### Player não embarca (abre nova aba)
**Causa:** `video_url` da aula não está em formato YouTube watch/youtu.be ou Vimeo.  
**Fix:** Edite a aula no admin e use uma URL no formato `https://www.youtube.com/watch?v=VIDEO_ID`.
