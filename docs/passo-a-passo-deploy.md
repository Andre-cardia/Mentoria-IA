# Passo a Passo Rápido — Deploy de Produção

Siga este checklist reduzido e direto para publicar a **Mentoria Zero-to-Hero IA** na nuvem de forma oficial.

## ✅ 1. Banco de Dados e Segurança (Supabase) (CONCLUÍDO)
Toda a parte de criação de tabelas, configurações de segurança (RLS) e permissão de Usuário Administrador já foi resolvida manualmente via painel do Supabase! *(Refere-se às Etapas 1 e 2 do guia original).*

---

## 🔲 2. Habilitar Comunicação na nuvem AWS (Liberação CORS)
Sua plataforma online precisa da permissão do armazenamento da AWS para carregar os arquivos (PDFs, etc).
1. Acesse o **[S3 no AWS Console](https://s3.console.aws.amazon.com/s3/buckets)**.
2. Entre no seu bucket (`mentoria-ia-materials`) e clique na aba **Permissions**.
3. Role lá para baixo até **Cross-origin resource sharing (CORS)** e clique em **Edit**. 
4. Apague o que estiver lá e cole o seguinte código JSON, depois Salve:
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

---

## 🔲 3. Passar Senhas para a Hospedagem (Vercel)
O servidor remoto precisa das mesmas chaves que você colocou no arquivo `.env` da sua máquina.
1. No [Vercel Dashboard](https://vercel.com/dashboard), acesse o seu projeto.
2. Vá em **Settings → Environment Variables**.
3. Adicione um por um os valores abaixo (certifique-se de manter marcado *Production* e *Preview*):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_KEY` *(adicione como Secret)*
   - `AWS_BUCKET` (valor: `mentoria-ia-materials`)
   - `AWS_REGION` (valor: `us-east-1` ou a região configurada)
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY` *(adicione como Secret)*
4. Importante: Para que as alterações façam efeito, vá na aba **Deployments**, clique nos 3 pontinhos do último push e clique em **Redeploy**.

---

## 🔲 4. Teste Final! (Validação)
1. Entre na URL do site no Vercel (ex: `https://seu-projeto.vercel.app/plataforma/login`).
2. Logue com o **usuário administrador** (`andre@c4lab.com.br`) e crie 1 Módulo e 1 Aula usando o link de algum vídeo no YouTube.
3. Faça upload de um arquivo na tela "Materiais".
4. Abra uma janela Anônima (CTRL+SHIFT+N), logue com a conta simulada do seu **aluno** e tente:
   - Assistir a aula;
   - Marcar como concluído;
   - Fazer o download do material colocado no passo anterior.

**Tudo apareceu e funcionou rápido e liso? Parabéns! A Mentoria IA está em produção! 🚀**
