# Checklist de Segurança para Apps Feitos com Vibe Code

**Antes de colocar em produção — ou hoje, se já estiver no ar.**

Baseado nas falhas reais documentadas em CVE-2025-48757 (Lovable/Supabase, mai/2025), no incidente de exposição de código e chats da Lovable (fev–abr/2026) e no caso de exclusão de dados da Manus (ago/2026).

Marque cada item. Se algum ficar sem marcar e você já tem cliente real usando o app, isso é um incidente esperando data.

---

## 1. Banco de dados (a falha nº 1, disparado)

- [ ] **RLS ligado em TODAS as tabelas do schema `public`.** Tabela criada por SQL ou pelo Table Editor nasce com RLS desligado. `ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;`
- [ ] **As políticas realmente restringem.** Uma política `USING (true)` passa no scanner da plataforma e deixa a tabela 100% aberta. O padrão correto compara o dono da linha: `USING ((select auth.uid()) = user_id)`.
- [ ] **Políticas cobrem SELECT, INSERT, UPDATE e DELETE.** Muita gente protege a leitura e esquece que dá pra inserir e apagar linhas pela mesma API REST.
- [ ] **Teste como atacante, não como dono.** Pegue a `anon key` do bundle JS e faça um GET direto no endpoint REST do Supabase, sem login. Se voltar dado, está vazando.
- [ ] **Reauditar a cada feature nova.** A IA cria tabelas novas conforme o app cresce e nem sempre replica o padrão de política das tabelas antigas. App que nasceu seguro regride.
- [ ] **Funções RPC também são superfície de ataque.** Verifique quais funções são chamáveis com a chave pública.

## 2. Segredos e chaves

- [ ] **Nenhuma chave de API no front-end.** Stripe, OpenAI, Google Maps, Gemini, qualquer uma. Scanners automatizados varrem bundles JS procurando padrões como `sk-` e `sk_live_`.
- [ ] **Toda chamada a serviço pago passa por função server-side** (Edge Function, API route, backend próprio).
- [ ] **`service_role key` jamais no cliente.** Ela ignora RLS por definição.
- [ ] **Rotacione tudo que passou pela plataforma antes de nov/2025.** No incidente da Lovable, credenciais de banco e variáveis de ambiente ficaram acessíveis. Chave exposta não se conserta com patch, se conserta trocando.
- [ ] **Variáveis de ambiente separadas por ambiente.** Dev não usa a chave de produção.

## 3. Autenticação e sessão

- [ ] **Verificação de e-mail obrigatória.**
- [ ] **Política de senha forte + rate limiting no login.**
- [ ] **Sessões com expiração real.** Sessão eterna significa que token roubado vale pra sempre.
- [ ] **Refresh token rotativo e revogação de sessão no logout.**

## 4. Lógica de negócio

- [ ] **Preço, desconto, limite de plano e permissão são validados no servidor.** Se a regra está no JavaScript, o usuário edita no DevTools e compra por R$ 1.
- [ ] **Nenhum campo sensível confiado do cliente.** `role`, `is_admin`, `plano`, `saldo` — tudo vem do banco, não do payload.
- [ ] **Schema do banco não exposto no bundle** além do estritamente necessário.

## 5. Configuração da plataforma

- [ ] **Visibilidade do projeto revisada.** "Público" em plataforma de vibe code pode significar que o código-fonte e o histórico de conversa com a IA são legíveis por terceiros — foi exatamente isso na Lovable entre 3/fev e 20/abr de 2026.
- [ ] **Nada sensível colado dentro dos prompts.** Chave, senha, dado de cliente e estratégia de produto ficam registrados no histórico de chat, e histórico de chat já vazou.
- [ ] **Headers de segurança configurados no host** (CSP, X-Frame-Options, HSTS) — Vercel, Netlify, Cloudflare, onde for.
- [ ] **Scan de segurança rodado antes de cada deploy** — sabendo que o scan da própria plataforma checa se a política existe, não se ela funciona.

## 6. Continuidade — a lição da Manus

- [ ] **Export do código-fonte fora da plataforma**, em repositório Git que é seu (GitHub, GitLab).
- [ ] **Backup automatizado do banco**, em local independente da ferramenta, com restauração testada de verdade.
- [ ] **Backup do histórico de configurações e automações.** Na Manus, a janela pra salvar tudo foi de menos de duas semanas e o aviso chegou por e-mail e notificação no app.
- [ ] **Você consegue migrar de plataforma?** Se a resposta é não, você não tem um produto, tem uma dependência.

## 7. Jurídico e LGPD

- [ ] **Mapeie que dado pessoal o app coleta e por quê.** Minimização é defesa técnica e legal.
- [ ] **Política de privacidade e base legal definidas.**
- [ ] **Plano de resposta a incidente pronto**, com prazo e canal de notificação aos titulares e à ANPD.
- [ ] **Revisão de segurança feita por um humano especialista** antes do primeiro cliente pagante. Custa menos que a multa e muito menos que a perda de confiança.

---

**A regra que resume tudo:** vibe code é excelente para MVP e validação. No dia em que entra dado real de cliente, o app deixa de ser protótipo e passa a ser responsabilidade — e responsabilidade se audita.

---

*Fontes: mattpalmer.io (CVE-2025-48757), lovable.dev/blog (resposta ao incidente de abril de 2026), supabase.com/docs (Row Level Security), canaltech.com.br e investnews.com.br (caso Manus).*
