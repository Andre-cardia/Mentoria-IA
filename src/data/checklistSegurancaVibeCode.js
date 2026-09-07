/**
 * Checklist de Segurança para Aplicações Feitas com Vibe Code / No-Code
 * Fonte: docs/auditoria_vc/checklist-seguranca-vibe-code.md
 * Baseado em CVE-2025-48757 (Lovable/Supabase), vazamento Lovable (2026) e caso Manus (2026).
 */

export const CHECKLIST_SECTIONS = [
  {
    id: "db",
    number: "01",
    title: "Banco de dados (a falha nº 1, disparado)",
    badge: "Crítico",
    description: "Falhas de Row Level Security (RLS) são responsáveis pela imensa maioria de vazamentos em apps vibe code.",
    items: [
      {
        id: "db-1",
        title: "RLS ligado em TODAS as tabelas do schema public",
        details: "Tabela criada por SQL ou pelo Table Editor nasce com RLS desligado. Sem RLS, qualquer usuário com a chave pública (anon) pode ler e alterar linhas.",
        codeSnippet: "ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;",
        severity: "critical",
      },
      {
        id: "db-2",
        title: "As políticas realmente restringem",
        details: "Uma política USING (true) passa no scanner automático da plataforma e deixa a tabela 100% aberta para a internet. O padrão correto compara a propriedade da linha com o usuário logado.",
        codeSnippet: "CREATE POLICY \"usuario_acessa_proprio_registro\" ON sua_tabela FOR ALL USING ((select auth.uid()) = user_id);",
        severity: "critical",
      },
      {
        id: "db-3",
        title: "Políticas cobrem SELECT, INSERT, UPDATE e DELETE",
        details: "Muitos projetos protegem a leitura (SELECT) e esquecem que a mesma API REST pública permite inserir, alterar e excluir registros se não houver políticas explícitas.",
        severity: "critical",
      },
      {
        id: "db-4",
        title: "Teste como atacante, não como dono",
        details: "Extraia a anon key pública do bundle JavaScript e execute um GET ou POST direto no endpoint REST (ex.: via curl/Postman), sem sessão autenticada. Se retornar dados privados, há vazamento ativo.",
        severity: "high",
      },
      {
        id: "db-5",
        title: "Reauditar a cada feature nova",
        details: "Assistentes de IA geram novas tabelas e relacionamentos conforme o app cresce, frequentemente sem replicar as políticas de segurança das tabelas anteriores. Aplicações que nasceram seguras regridem facilmente.",
        severity: "high",
      },
      {
        id: "db-6",
        title: "Funções RPC também são superfície de ataque",
        details: "Revise quais funções PostgreSQL armazenadas possuem modificador SECURITY DEFINER e podem ser invocadas diretamente pela API pública com a chave anônima.",
        severity: "medium",
      },
    ],
  },
  {
    id: "secrets",
    number: "02",
    title: "Segredos e chaves",
    badge: "Crítico",
    description: "Chaves de API e credenciais em código cliente são raspadas por robôs em questão de minutos.",
    items: [
      {
        id: "sec-1",
        title: "Nenhuma chave de API no front-end",
        details: "Stripe, OpenAI, Google Maps, Gemini, Anthropic, Resend, etc. Scanners automatizados varrem constantemente bundles JavaScript procurando padrões como sk- e sk_live_.",
        severity: "critical",
      },
      {
        id: "sec-2",
        title: "Toda chamada a serviço pago passa por função server-side",
        details: "Qualquer requisição que consuma créditos, dispare mensagens ou processe pagamentos deve ser encapsulada em Edge Functions, API routes ou backend próprio autenticado.",
        severity: "critical",
      },
      {
        id: "sec-3",
        title: "service_role key jamais no cliente",
        details: "A chave de serviço (service_role) ignora qualquer política de Row Level Security por definição técnica. Se estiver no front-end, seu banco inteiro está comprometido.",
        severity: "critical",
      },
      {
        id: "sec-4",
        title: "Rotacione tudo que passou pela plataforma antes de nov/2025",
        details: "No incidente da Lovable, variáveis de ambiente e credenciais ficaram acessíveis. Chave exposta não se conserta apenas com patch de código — se conserta rotacionando imediatamente.",
        severity: "high",
      },
      {
        id: "sec-5",
        title: "Variáveis de ambiente separadas por ambiente",
        details: "O ambiente de desenvolvimento ou staging jamais deve compartilhar chaves de banco de dados ou provedores de pagamento de produção.",
        severity: "medium",
      },
    ],
  },
  {
    id: "auth",
    number: "03",
    title: "Autenticação e sessão",
    badge: "Alta Prioridade",
    description: "Controle estrito de identidade e proteção contra sequestro de contas e abuso de logins.",
    items: [
      {
        id: "auth-1",
        title: "Verificação de e-mail obrigatória",
        details: "Evita criação massiva de contas fake, sequestro de cadastros e poluição do banco de dados por spambots.",
        severity: "high",
      },
      {
        id: "auth-2",
        title: "Política de senha forte + rate limiting no login",
        details: "Limitação de tentativas de autenticação para prevenir ataques de força bruta e stuffing contra o endpoint de auth.",
        severity: "high",
      },
      {
        id: "auth-3",
        title: "Sessões com expiração real",
        details: "Sessões com expiração perpétua significam que um token roubado ou interceptado em máquina pública permanecerá válido para sempre.",
        severity: "medium",
      },
      {
        id: "auth-4",
        title: "Refresh token rotativo e revogação de sessão no logout",
        details: "Garantir que a ação de logout destrua a validade do token no servidor de identidade e invalide tokens de atualização.",
        severity: "medium",
      },
    ],
  },
  {
    id: "business-logic",
    number: "04",
    title: "Lógica de negócio",
    badge: "Alta Prioridade",
    description: "Nunca confie em regras calculadas unicamente no JavaScript do navegador.",
    items: [
      {
        id: "biz-1",
        title: "Preço, desconto, limite de plano e permissão validados no servidor",
        details: "Se a regra de validação está apenas no React/JS do cliente, qualquer usuário com DevTools pode alterar o payload e comprar planos ou itens por R$ 1.",
        severity: "critical",
      },
      {
        id: "biz-2",
        title: "Nenhum campo sensível confiado do cliente",
        details: "Propriedades como role, is_admin, plano, créditos e saldo devem ser controladas exclusivamente no banco e nas regras de autenticação, nunca recebidas do corpo da requisição do cliente.",
        severity: "critical",
      },
      {
        id: "biz-3",
        title: "Schema do banco não exposto no bundle além do necessário",
        details: "Evite expor nomes de colunas confidenciais, tabelas internas e estruturas administrativas em bundles JavaScript abertos ao público.",
        severity: "medium",
      },
    ],
  },
  {
    id: "platform",
    number: "05",
    title: "Configuração da plataforma",
    badge: "Alta Prioridade",
    description: "Blindagem do ambiente de hospedagem e dos históricos de prompts com a IA.",
    items: [
      {
        id: "plat-1",
        title: "Visibilidade do projeto revisada",
        details: "Marcar um projeto como 'Público' em ferramentas de vibe code pode expor todo o código-fonte e o histórico de prompts para qualquer visitante da internet (caso Lovable 2026).",
        severity: "critical",
      },
      {
        id: "plat-2",
        title: "Nada sensível colado dentro dos prompts",
        details: "Senhas, chaves privadas, dados reais de clientes e documentos estratégicos ficam registrados no histórico de conversas com os modelos de IA e ferramentas parceiras.",
        severity: "high",
      },
      {
        id: "plat-3",
        title: "Headers de segurança configurados no host",
        details: "Configurar CSP (Content Security Policy), X-Frame-Options, HSTS, X-Content-Type-Options e Referrer-Policy na Vercel, Cloudflare, Netlify ou servidor de produção.",
        severity: "medium",
      },
      {
        id: "plat-4",
        title: "Scan de segurança rodado antes de cada deploy",
        details: "Esteja ciente de que scanners nativos de plataformas no-code muitas vezes checam apenas se uma política existe, não se ela é logicamente segura e eficiente.",
        severity: "medium",
      },
    ],
  },
  {
    id: "continuity",
    number: "06",
    title: "Continuidade — a lição da Manus",
    badge: "Estratégico",
    description: "Evite dependência fatal de fornecedores e garanta a posse dos seus ativos de software e dados.",
    items: [
      {
        id: "cont-1",
        title: "Export do código-fonte fora da plataforma",
        details: "O repositório Git primário deve ser de propriedade da sua organização (GitHub, GitLab), sincronizado com cada alteração realizada na ferramenta vibe code.",
        severity: "high",
      },
      {
        id: "cont-2",
        title: "Backup automatizado do banco com restauração testada",
        details: "Backups diários ou semanais em armazenamento independente da ferramenta (ex.: AWS S3, Cloudflare R2), com procedimento de restauração periodicamente validado.",
        severity: "critical",
      },
      {
        id: "cont-3",
        title: "Backup do histórico de configurações e automações",
        details: "Na descontinuação da Manus em 2026, a janela para salvar integrações foi curta. Documente e versione webhooks, fluxos de automação e triggers fora da ferramenta.",
        severity: "high",
      },
      {
        id: "cont-4",
        title: "Você consegue migrar de plataforma?",
        details: "Se a resposta for não, seu negócio não possui um produto autônomo, possui uma dependência crítica que pode inviabilizar sua operação caso a plataforma encerre atividades.",
        severity: "high",
      },
    ],
  },
  {
    id: "legal",
    number: "07",
    title: "Jurídico e LGPD",
    badge: "Conformidade",
    description: "Proteção regulatória e mitigação de multas perante a ANPD e órgãos fiscalizadores.",
    items: [
      {
        id: "leg-1",
        title: "Mapeie que dado pessoal o app coleta e por quê",
        details: "Princípio da minimização da LGPD: colete estritamente o necessário. Menos dados pessoais em repouso significam menor risco técnico, financeiro e jurídico.",
        severity: "high",
      },
      {
        id: "leg-2",
        title: "Política de privacidade e base legal definidas",
        details: "Documento acessível, claro e atualizado detalhando armazenamento, compartilhamento com terceiros (incluindo LLMs) e direitos dos titulares.",
        severity: "medium",
      },
      {
        id: "leg-3",
        title: "Plano de resposta a incidente pronto",
        details: "Roteiro formal com prazos, responsáveis internos e canal de comunicação imediata para notificação aos titulares afetados e à ANPD em caso de vazamento.",
        severity: "high",
      },
      {
        id: "leg-4",
        title: "Revisão de segurança feita por especialista humano",
        details: "Auditoria especializada antes de receber o primeiro cliente pagante ou dados em escala. Custa uma fração de um incidente e protege a reputação do seu negócio.",
        severity: "critical",
      },
    ],
  },
];

export const TOTAL_CHECKLIST_ITEMS = CHECKLIST_SECTIONS.reduce(
  (total, section) => total + section.items.length,
  0
);
