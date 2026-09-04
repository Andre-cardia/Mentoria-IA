import { useMemo, useState } from 'react'
import heroGovernanca from '../assets/orsegups-governanca-hero.png'
import heroTeste from '../assets/orsegups-teste-hero.png'
import heroFramework from '../assets/orsegups-framework-hero.png'

const C = {
  bg: '#060606',
  bg2: '#0b0b0b',
  panel: '#101010',
  panel2: '#141414',
  line: 'rgba(255,255,255,.08)',
  lineStrong: 'rgba(255,255,255,.16)',
  text: '#f5f2ea',
  muted: '#8b867c',
  accent: '#ff6a00',
  accentSoft: 'rgba(255,106,0,.14)',
  green: '#84cc16',
  warning: '#f59e0b',
  error: '#ef4444',
}

const navItems = [
  ['Conteúdo', '/aulas/governanca-ia'],
  ['Teste', '/aulas/governanca-ia/teste'],
  ['Framework', '/aulas/governanca-ia/framework'],
]

const learningOutcomes = [
  ['Fundamentos', 'Explicar IA e GenAI sem confundir fluência com verdade.'],
  ['Classificação', 'Descrever finalidade, dados, impacto, risco e supervisão de um caso de uso.'],
  ['LGPD', 'Aplicar minimização, qualidade, direitos, incidentes e responsabilidade.'],
  ['Fornecedores', 'Fazer perguntas contratuais, técnicas e operacionais antes do piloto.'],
  ['Framework', 'Mapear riscos e controles nos cinco domínios de governança GenAI.'],
  ['Operação', 'Definir COE, gates, indicadores e plano de 90 dias.'],
]

const contentParts = [
  {
    id: 'fundamentos',
    label: 'Fundamentos',
    title: 'IA e GenAI como sistema decisório, não como ferramenta isolada',
    copy: 'A governança começa antes da ferramenta: problema, pessoas afetadas, contexto, impacto e responsabilidade.',
    bullets: ['Automação, analytics, machine learning, GenAI e sistemas agentivos têm riscos diferentes.', 'Uma resposta fluente pode misturar fatos, inferências, lacunas e decisões.', 'Quanto maior o impacto, maior a exigência de fonte, revisão, registro e autoridade humana.'],
    deep: [
      ['Distinção crítica', 'Não pergunte apenas se usa IA. Pergunte qual papel a saída ocupa no processo: rascunho, recomendação, classificação, priorização, alerta ou decisão.'],
      ['Risco cognitivo', 'Boa gramática reduz a vigilância do usuário. O aluno precisa separar forma convincente de evidência verificável.'],
      ['Autoridade humana', 'Quando a saída afeta pessoa, segurança, dinheiro, continuidade ou reputação, a revisão precisa ter competência e poder real de discordar.'],
    ],
    socratic: ['Que decisão mudaria se a resposta da IA estivesse errada?', 'O que nesta saída é fato documentado, inferência, lacuna ou recomendação?', 'Quem tem autoridade para aceitar, alterar ou rejeitar a saída?'],
    artifact: 'Cartão de revisão: fonte original, fatos conferidos, inferências assumidas, lacunas abertas, decisão humana e registro da revisão.',
    misconception: 'Confundir resposta bem escrita com resposta verdadeira.',
  },
  {
    id: 'dados',
    label: 'Dados e LGPD',
    title: 'Dado e matéria-prima, evidência, direito e vetor de risco',
    copy: 'Copiar dados para prompt, salvar uma resposta ou compartilhar resultado pode fazer parte de um tratamento que precisa de finalidade e segurança.',
    bullets: ['Minimização reduz a exposição ao que é necessário para a finalidade.', 'Anonimização depende do contexto; pseudonimização não elimina automaticamente a natureza pessoal.', 'Qualidade envolve acurácia, completude, atualidade, linhagem e adequação ao uso.'],
    deep: [
      ['Ciclo do dado', 'Planejar, descobrir, preparar, processar, usar, monitorar e descartar. Cada etapa tem dono, evidência e condição de parada.'],
      ['Qualidade aplicada', 'A pergunta não é se o dado parece completo; é se ele é confiável o bastante para aquele uso, impacto e pessoa afetada.'],
      ['LGPD operacional', 'Finalidade, necessidade, transparência, segurança, prevenção, não discriminação e prestação de contas precisam aparecer no caso de uso.'],
    ],
    socratic: ['Quais dados mudam a decisão e quais apenas aumentam exposição?', 'Como provar origem, autorização, qualidade e retenção do dado?', 'Se o titular pedir explicação, qual registro mostra o caminho da decisão?'],
    artifact: 'Ficha de dados do caso: finalidade, campos permitidos, campos proibidos, base de acesso, retenção, linhagem, dono e canal de direitos.',
    misconception: 'Achar que pseudonimizar sempre torna o dado anônimo.',
  },
  {
    id: 'segurança',
    label: 'Segurança',
    title: 'Segurança de IA amplia superfícies de ataque e modos de falha',
    copy: 'Prompts, RAG, agentes, bases vetoriais, integrações e fornecedores precisam de controles preventivos, detectivos e corretivos.',
    bullets: ['Prompt injection e exfiltração exigem separação entre instrução e dado.', 'Supervisão humana real exige competência, fonte, tempo e poder de parada.', 'C2PA e Content Credentials ajudam a inspecionar proveniência, mas não provam verdade completa.'],
    deep: [
      ['Confidencialidade', 'O primeiro vazamento pode ocorrer no prompt, no RAG, no log, no fornecedor, no compartilhamento da resposta ou na integração.'],
      ['Integridade', 'O problema não é só a IA errar; é a organização confiar em uma saída alterada, truncada, injetada ou fora de contexto.'],
      ['Disponibilidade', 'Uso crítico exige fallback manual, SLA, RTO/RPO, redundância e plano de saída para fornecedor ou modelo indisponível.'],
    ],
    socratic: ['Onde uma instrução maliciosa poderia entrar sem parecer instrução?', 'Que controle impede o evento e que controle apenas detecta depois?', 'Se o fornecedor cair agora, qual processo continua funcionando?'],
    artifact: 'Mapa de ameaça do caso: entrada, recuperação, modelo, ação, log, fornecedor, fallback, kill switch e responsável.',
    misconception: 'Tratar segurança de IA como apenas segurança do modelo.',
  },
  {
    id: 'regulação',
    label: 'Regulação',
    title: 'Regulação, normas e contratos cumprem papéis diferentes',
    copy: 'A liderança precisa distinguir lei vigente, guia de autoridade, norma técnica, política interna e compromisso contratual.',
    bullets: ['AI Act usa lógica baseada em risco e não substitui LGPD.', 'PL 2338/2023 deve ser tratado como projeto em tramitação, não como lei vigente.', 'ISO/IEC 42001 estrutura um sistema de gestão de IA com PDCA e melhoria contínua.'],
    deep: [
      ['Camadas normativas', 'Lei, norma técnica, framework, política interna e contrato não são equivalentes. Cada camada responde a uma pergunta diferente.'],
      ['AI Act e LGPD', 'O AI Act classifica riscos de IA no contexto europeu; a LGPD regula tratamento de dados pessoais no Brasil e pode incidir simultaneamente.'],
      ['ISO 42001 e NIST', 'ISO estrutura sistema de gestão; NIST organiza governança, mapeamento, medição e gestão contínua de riscos.'],
    ],
    socratic: ['Qual obrigação vem da lei, qual vem do contrato e qual é decisão interna de apetite de risco?', 'O caso usa dado pessoal, toma decisão assistida ou apenas apoia redação?', 'Que evidência demonstraria prestação de contas seis meses depois?'],
    artifact: 'Mapa regulatório do caso: normas aplicáveis, papéis, obrigações, evidências, responsáveis e revisão periódica.',
    misconception: 'Dizer "cumpre LGPD" sem demonstrar finalidade, necessidade, segurança e prestação de contas.',
  },
  {
    id: 'operação',
    label: 'COE e ciclo',
    title: 'Governança executável precisa de COE, inventário, gates e indicadores',
    copy: 'O COE cria capacidade, padrões, suporte e coordenação; os donos de processo continuam responsáveis pela execução local.',
    bullets: ['Modelo federado combina centro forte e execução próxima do processo.', 'Gates definem se um caso pode descobrir, desenhar, pilotar, produzir e escalar.', 'Indicadores devem medir valor, risco, qualidade, uso, incidentes e melhoria.'],
    deep: [
      ['Inventário vivo', 'Sem inventário, a organização não sabe onde há IA, quem é dono, quais dados entram, quais riscos existem e quais controles operam.'],
      ['Gates reais', 'Gate não é reunião. É decisão documentada com condição de entrada, critério de saída, responsável, exceção e evidência.'],
      ['Três linhas', 'Operação executa, risco/compliance desafia e orienta, auditoria avalia desenho e funcionamento dos controles.'],
    ],
    socratic: ['Qual caso entra no inventário mesmo sendo "só produtividade"?', 'Que evidência prova que o controle operou e não apenas foi escrito?', 'Quem decide parar um piloto e com base em qual métrica?'],
    artifact: 'Registro de governança operacional: inventário, RACI, gates, indicadores, incidentes, exceções, auditoria e plano de 90 dias.',
    misconception: 'Achar que o COE substitui a responsabilidade dos donos de processo.',
  },
  {
    id: 'framework',
    label: 'Framework',
    title: 'Cinco domínios conectam estratégia, dados, operação, pessoas e transparência',
    copy: 'O framework GenAI transforma riscos em controles priorizados e entregáveis de implementação.',
    bullets: ['Defina objetivos de GenAI antes do escopo.', 'Complete avaliação de riscos com entregáveis por etapa.', 'Execute plano com prioridades, donos, prazos e evidências.'],
    deep: [
      ['Apetite de risco', 'Antes de escolher ferramenta, a organização define que riscos aceita, reduz, transfere, monitora ou rejeita.'],
      ['Escopo proporcional', 'Nem todo controle se aplica a todo caso; a seleção depende de domínio, processo, dado, impacto, tecnologia e stakeholders.'],
      ['Maturidade auditável', 'Governança madura mostra controle recorrente: dono, periodicidade, evidência, exceção, melhoria e revisão estratégica.'],
    ],
    socratic: ['Qual domínio do framework é mais fraco neste caso e por quê?', 'Que risco ameaça objetivo organizacional e que controle é proporcional?', 'Como transformar diagnóstico em plano com dono, prazo e evidência?'],
    artifact: 'Plano de implementação do framework: objetivos, escopo, riscos priorizados, controles, entregáveis, donos, prazos e indicadores.',
    misconception: 'Usar o framework como checklist sem priorização por risco.',
  },
]

const socraticSteps = [
  ['01', 'Nomear a decisão', 'Antes de falar em ferramenta, declare qual decisão ou ação será influenciada pela IA.', 'Que escolha concreta muda por causa desta saída?'],
  ['02', 'Tensionar a hipótese', 'Procure a consequência de erro, omissão, viés, vazamento, indisponibilidade ou excesso de autonomia.', 'Quem perde, espera mais, recebe tratamento diferente ou fica exposto?'],
  ['03', 'Exigir evidência', 'Converta confiança em prova: fonte, dado, log, revisão, contrato, política, métrica ou registro.', 'Que evidência uma auditoria conseguiria verificar depois?'],
  ['04', 'Escolher controles', 'Combine controles preventivos, detectivos e corretivos proporcionais ao impacto.', 'O controle reduz probabilidade, detecta desvio ou corrige consequência?'],
  ['05', 'Decidir e registrar', 'A decisão final precisa de dono, critério, exceção, prazo de revisão e condição de parada.', 'O que faria a organização pausar, reavaliar ou encerrar este uso?'],
]

const caseLabs = [
  {
    name: 'Resumo de ocorrências operacionais',
    context: 'Equipe usa GenAI para resumir relatos internos e sugerir prioridade de atendimento.',
    tension: 'A saída pode omitir sinal crítico, exagerar severidade ou transformar relato incompleto em inferência sobre conduta.',
    questions: ['O resumo será apenas apoio de leitura ou alterará prioridade?', 'Que campos podem ser removidos sem prejudicar o objetivo?', 'Qual amostra será comparada com a fonte original?'],
    controls: ['Texto desidentificado no piloto', 'Fonte original ao lado da resposta', 'Revisão humana com critério de parada', 'Métrica de erro por categoria e severidade'],
    evidence: 'Ficha do caso, base permitida, amostra revisada, taxa de erro, decisão do gate e registro de exceções.',
  },
  {
    name: 'Assistente para políticas internas',
    context: 'Usuário pergunta sobre procedimentos e recebe respostas baseadas em documentos internos via RAG.',
    tension: 'Documento desatualizado, permissão inadequada ou prompt injection podem gerar orientação errada ou revelar conteúdo restrito.',
    questions: ['Qual fonte é oficial e qual versão está vigente?', 'O recuperador respeita permissões por função?', 'Como o usuário vê limites e data da resposta?'],
    controls: ['Linhagem e versionamento documental', 'Controle de acesso no índice', 'Separação entre instrução e documento', 'Logs de pergunta, fonte e resposta'],
    evidence: 'Catálogo de fontes, teste adversarial, política de acesso, log de recuperação e revisão periódica do conteúdo.',
  },
  {
    name: 'Geração de comunicação ao cliente',
    context: 'GenAI rascunha mensagens para cliente a partir de contexto operacional e histórico de atendimento.',
    tension: 'A mensagem pode prometer algo não autorizado, usar dado excessivo, adotar tom inadequado ou criar obrigação contratual.',
    questions: ['A IA redige, recomenda ou decide a resposta final?', 'Que termos são proibidos sem aprovação?', 'Como provar que o humano revisou antes do envio?'],
    controls: ['Templates aprovados', 'Lista de termos bloqueados', 'Aprovação humana antes de envio', 'Registro de versão final e responsável'],
    evidence: 'Template vigente, trilha de revisão, mensagem enviada, aprovação e indicadores de reclamação ou retrabalho.',
  },
]

const decisionMatrix = [
  ['Finalidade', 'Por que este uso existe?', 'Problema, resultado esperado, público afetado e alternativa sem IA.', 'Ficha de caso de uso aprovada.'],
  ['Dados', 'Quais dados são necessários e permitidos?', 'Minimização, classificação, qualidade, linhagem, retenção e direitos.', 'Catálogo, glossário, lista de campos e base permitida.'],
  ['Impacto', 'Quem pode ser afetado e com que gravidade?', 'Pessoa, segurança, continuidade, reputação, dinheiro, acesso ou tratamento.', 'Classificação de risco e justificativa.'],
  ['Supervisão', 'Quem pode discordar da IA?', 'Competência, tempo, fonte, autoridade, escalação e parada.', 'Registro de revisão humana substantiva.'],
  ['Fornecedor', 'O que é compromisso real e o que é marketing?', 'Suboperadores, retenção, região, logs, incidentes, saída e auditoria.', 'Due diligence e cláusulas contratuais.'],
  ['Evolução', 'Quando o caso volta à mesa?', 'Mudança de modelo, dado, finalidade, fornecedor, métrica, incidente ou regulação.', 'Agenda de revisão e critérios de reavaliação.'],
]

const artifactDeck = [
  ['Ficha de caso de uso', 'Define finalidade, dono, usuário, dado, saída, impacto, risco, controles e gate atual.'],
  ['Cartão de revisão', 'Separa fato, inferência, lacuna e decisão; registra fonte, alteração e responsável.'],
  ['Matriz risco-controle', 'Conecta uso, evento, causa, impacto, controle preventivo, detectivo, corretivo e risco residual.'],
  ['Due diligence de fornecedor', 'Documenta dados tratados, retenção, suboperadores, região, auditoria, incidentes, logs, saída e responsabilidade compartilhada.'],
  ['Painel de indicadores', 'Combina valor, adoção, erro, retrabalho, incidente, reclamação, tempo, exceção e melhoria.'],
  ['Ata de gate', 'Registra decisão, condição de avanço, pendências, exceções, responsável e data de revisão.'],
]

const misconceptionChecks = [
  ['Fluência', 'Se parece profissional, deve estar certo.', 'Forma não prova fonte, contexto nem autoridade.'],
  ['Bloqueio', 'Proibir ferramenta elimina risco.', 'O uso pode migrar para shadow AI sem visibilidade.'],
  ['Anonimização', 'Remover nome basta.', 'Reidentificação pode ocorrer por combinação de campos e contexto.'],
  ['Fornecedor', 'Contrato transfere toda responsabilidade.', 'Cliente continua dono de finalidade, configuração, processo, revisão e impacto.'],
  ['COE', 'Centro de excelência decide tudo.', 'O COE define método e suporte; o dono do processo responde pela execução.'],
  ['Métrica', 'Alta adoção prova valor e segurança.', 'Adoção precisa ser lida com qualidade, risco, incidente e resultado.'],
]

const riskControls = [
  ['Exposição de dados', 'Usuário envia informação interna à ferramenta não autorizada.', 'Política, DLP, treinamento, ambiente aprovado e minimização.'],
  ['Prompt injection', 'Documento ou usuário tenta alterar a instrução do sistema.', 'Separação de instruções e dados, validação, testes adversariais e limites.'],
  ['Ação indevida', 'Agente abre tarefa, envia mensagem ou altera sistema sem aprovação.', 'Menor privilégio, sandbox, aprovação humana e kill switch.'],
  ['Disponibilidade', 'Fornecedor ou modelo fica indisponível em operação crítica.', 'Fallback manual, SLA, RTO/RPO, redundância e plano de saída.'],
]

const lifecycleGates = [
  ['G0', 'Ideia', 'Problema, finalidade legítima, dono inicial e valor esperado.'],
  ['G1', 'Triagem', 'Dados, impacto, pessoas afetadas, regulação, risco e prioridade.'],
  ['G2', 'Desenho', 'Arquitetura, fornecedor, controles, supervisão, logs e critério de parada.'],
  ['G3', 'Piloto', 'Escopo limitado, dados permitidos, métricas, incidentes e revisão.'],
  ['G4', 'Produção', 'SOP, treinamento, monitoramento, continuidade e aprovação formal.'],
  ['G5', 'Revisão', 'Drift, mudança de finalidade/modelo/dados, auditoria e melhoria.'],
]

const coeRoadmap = [
  ['30 dias', 'Inventário mínimo, política de uso, triagem de risco e canal de dúvidas.'],
  ['60 dias', 'Gates, RACI, due diligence, painel de indicadores e pilotos controlados.'],
  ['90 dias', 'COE federado, auditoria amostral, revisão executiva e plano de escala.'],
]

const nistCards = [
  ['Govern', 'Cultura, políticas, papéis e responsabilização como função transversal.'],
  ['Map', 'Contexto, finalidade, pessoas afetadas, riscos e requisitos.'],
  ['Measure', 'Medir desempenho, viés, robustez, segurança, impacto e incerteza.'],
  ['Manage', 'Priorizar, tratar, monitorar e comunicar riscos durante o ciclo de vida.'],
]

const frameworkDomains = [
  {
    name: 'Alinhamento Estratégico e Ambiente de Controle',
    short: 'Estratégia',
    objective: 'Alinhar iniciativas de GenAI aos objetivos, estratégias e apetite de risco da organização.',
    risks: ['Riscos estratégicos e de planejamento', 'Riscos de ambiente de controle'],
    controls: ['Estrutura de gestão de riscos de GenAI', 'Plano estratégico de GenAI', 'Revisão estratégica periódica', 'Participação de stakeholders', 'Inventário de GenAI', 'Comitê de governança', 'Políticas, papéis e resposta a incidentes'],
  },
  {
    name: 'Gestão de Dados e de Compliance',
    short: 'Dados',
    objective: 'Identificar, avaliar e mitigar riscos de dados e cumprir normas legais e regulatórias.',
    risks: ['Riscos relacionados a dados', 'Riscos jurídicos e regulatórios'],
    controls: ['Classificação e minimização de dados', 'Acesso e criptografia', 'Auditorias regulares', 'Documentação e relatórios', 'Monitoramento de conformidade', 'Avaliação jurídica de GenAI', 'Treinamento sobre mudanças regulatórias'],
  },
  {
    name: 'Gestão Operacional e Tecnológica',
    short: 'Operação',
    objective: 'Integrar GenAI nos processos, administrar tecnologia, segurança, fornecedores e operação.',
    risks: ['Gestão de processos', 'Seleção de tecnologia', 'Segurança de TI e acesso'],
    controls: ['SOPs para uso de GenAI', 'Monitoramento de desempenho', 'Protocolos de validação e teste', 'Gestão de mudanças', 'Avaliação de fornecedores', 'Integração de recursos', 'Resposta a incidentes e autenticação'],
  },
  {
    name: 'Considerações Humanas, Éticas e Sociais',
    short: 'Pessoas',
    objective: 'Gerenciar capacitação, impacto em funções, vieses, reputação e sustentabilidade.',
    risks: ['Conhecimento e capacitação', 'Recursos humanos e funções', 'Ética e vieses', 'Reputação e ESG'],
    controls: ['Plano de treinamento', 'Comunicação transparente', 'Participação dos funcionários', 'Requalificação', 'Estrutura de mitigação de vieses', 'Auditorias éticas', 'Equipe de resposta reputacional', 'Avaliação ESG'],
  },
  {
    name: 'Transparência, Responsabilização e Melhoria Contínua',
    short: 'Transparência',
    objective: 'Tornar decisões rastreáveis e atualizar governança conforme tecnologia e riscos evoluem.',
    risks: ['Transparência e confiança', 'Evolução tecnológica', 'Riscos diversos e hipotéticos'],
    controls: ['Documentação da tomada de decisão', 'Protocolos de rastreabilidade', 'Revisões periódicas', 'Relatórios a stakeholders', 'Monitoramento da evolução tecnológica', 'Laboratórios de inovação', 'Prevenção de abuso', 'Equipes de resposta rápida'],
  },
]

const frameworkStages = [
  ['01', 'Definir objetivos e metas', 'Alinhar GenAI à estratégia, expectativas de stakeholders, requisitos regulatórios e restrições orçamentárias.'],
  ['02', 'Definir escopo adequado', 'Selecionar domínios, riscos, funções, processos, tecnologias e stakeholders mais relevantes.'],
  ['03', 'Completar avaliação de riscos', 'Planejar, coletar dados, priorizar riscos, recomendar mitigações e preparar relatório executivo.'],
  ['04', 'Executar plano definido', 'Integrar governança aos planos estratégicos, recursos, controles, donos e ciclos de melhoria.'],
]

const assessmentSteps = [
  ['Planejamento e preparo', 'Escopo, patrocinador, stakeholders, documentos, pesquisa e cronograma.'],
  ['Coleta e análise de dados', 'Resultados de pesquisa, políticas, entrevistas e benchmarking.'],
  ['Avaliação e priorização', 'Comparar estado atual com framework e priorizar riscos não mitigados.'],
  ['Recomendações e plano', 'Mitigações práticas, plano estratégico, prazos e responsáveis.'],
  ['Relatório de resultados', 'Relatório executivo, alinhamento com stakeholders e próximos passos.'],
]

const questions = /** @type {Array<[string, string[], string, string]>} */ ([
  ['A governança de IA começa adequadamente por:', ['Escolher a ferramenta mais popular.', 'Definir finalidade, contexto, impacto e responsabilidade.', 'Treinar o usuário em prompts avançados.', 'Publicar um comunicado sobre inovação.'], 'B', 'Governança começa pelo problema e pelo contexto, não pelo produto.'],
  ['Uma resposta de IA bem escrita:', ['É necessariamente verdadeira.', 'Dispensa revisão quando o modelo é conhecido.', 'Pode ser convincente e ainda conter erro ou invenção.', 'Tem validade jurídica automática.'], 'C', 'Fluência não é prova de factualidade, autoridade ou adequação.'],
  ['Alucinação é:', ['Falha de conexão com a internet.', 'Saída inventada ou não sustentada apresentada como resposta.', 'Qualquer resposta curta.', 'Uma técnica de anonimização.'], 'B', 'A alucinação exige verificação contra fonte e limites claros.'],
  ['RAG significa:', ['Regra de acesso geral.', 'Recuperação de documentos relevantes para fornecer contexto à geração.', 'Registro automático de governança.', 'Relatório de auditoria gerencial.'], 'B', 'RAG pode melhorar contexto, mas exige fonte, acesso e avaliação.'],
  ['A melhor separação para revisar uma resposta é:', ['Custo, velocidade, layout e tom.', 'Fato, inferência, lacuna e decisão.', 'Modelo, senha, contrato e usuário.', 'Entrada, prompt, token e interface.'], 'B', 'Essa separação evita tratar hipótese como fato ou decisão.'],
  ['Minimização de dados significa:', ['Usar todos os dados para aumentar precisão.', 'Usar o mínimo necessário para a finalidade declarada.', 'Apagar qualquer dado pessoal automaticamente.', 'Substituir segurança por anonimização.'], 'B', 'Minimização é necessidade contextual, não eliminação automática de tudo.'],
  ['Na LGPD, controlador é quem:', ['Hospeda qualquer sistema.', 'Decide as finalidades e elementos essenciais do tratamento.', 'Sempre desenvolve o modelo.', 'Apenas revisa a gramática.'], 'B', 'O papel depende da decisão sobre finalidade e elementos essenciais.'],
  ['Pseudonimização:', ['Sempre torna o dado anônimo.', 'Substitui identificadores, mas pode permitir reidentificação com informação adicional.', 'É uma forma de criptografia irreversível.', 'Elimina a necessidade de finalidade.'], 'B', 'O risco pessoal pode permanecer.'],
  ['Dado sensível pode incluir:', ['Apenas informação pública.', 'Biometria e informação de saúde, entre outras categorias previstas.', 'Qualquer texto sem nome.', 'Somente dado financeiro de empresa.'], 'B', 'Categorias sensíveis têm proteção reforçada.'],
  ['Um gestor deve fazer quando recebe pedido de titular:', ['Responder improvisando.', 'Apagar o histórico.', 'Reconhecer o pedido e encaminhar ao canal responsável, preservando registros.', 'Enviar o dado a qualquer fornecedor.'], 'C', 'Direitos devem seguir fluxo interno, com preservação e orientação.'],
  ['Qual é um controle preventivo?', ['Revisar amostra depois do erro.', 'Bloquear dado sensível na entrada.', 'Atualizar procedimento após incidente.', 'Calcular taxa de reclamação.'], 'B', 'Preventivos reduzem probabilidade antes do evento.'],
  ['Qual é um controle detectivo?', ['Aprovação antes do uso.', 'Revisão amostral comparando saída com fonte.', 'Proibição de ferramenta.', 'Treinamento inicial.'], 'B', 'Detectivo identifica desvio ou erro depois que a execução começou.'],
  ['Risco residual é:', ['Risco antes de qualquer controle.', 'Risco que permanece depois dos controles.', 'Risco que nunca pode ser descrito.', 'Risco igual a zero.'], 'B', 'Nenhum controle sério promete risco zero.'],
  ['Supervisão humana substantiva exige:', ['Clique automático em aprovar.', 'Competência, informação, tempo e autoridade para intervir.', 'Apenas uma assinatura digital.', 'Que a pessoa concorde com o modelo.'], 'B', 'Sem poder real de discordar, a supervisão é apenas formal.'],
  ['Um uso de alto impacto deve:', ['Ter menos documentação para ser rápido.', 'Ter controles, revisão, contestação e escalonamento proporcionais.', 'Ser aprovado apenas pelo usuário.', 'Ser tratado como baixo risco se o modelo for famoso.'], 'B', 'Impacto vem do contexto e da decisão influenciada.'],
  ['O AI Act europeu adota principalmente:', ['Uma classificação apenas por fabricante.', 'Uma abordagem baseada em níveis de risco.', 'Uma autorização automática para IA generativa.', 'Uma regra que substitui toda lei local.'], 'B', 'O regulamento diferencia práticas proibidas, alto risco, transparência e mínimo/baixo risco.'],
  ['O AI Act e a LGPD:', ['São a mesma norma.', 'A LGPD deixa de valer para quem usa AI Act.', 'Cumprem papéis diferentes e podem incidir simultaneamente.', 'Só valem para órgãos públicos.'], 'C', 'AI Act regula IA em escopo europeu; LGPD regula tratamento de dados pessoais no Brasil e outros escopos.'],
  ['O PL 2338/2023, na data da apostila:', ['É uma lei já vigente.', 'É um projeto aprovado pelo Senado e em tramitação na Câmara.', 'Foi revogado pela LGPD.', 'É uma norma ISO.'], 'B', 'Projeto em tramitação não deve ser apresentado como lei vigente.'],
  ['A ANPD é relevante para IA porque:', ['Aprova todos os prompts.', 'Fiscaliza e orienta proteção de dados pessoais e privacidade.', 'Substitui o COE.', 'Define o fornecedor de cada modelo.'], 'B', 'A atuação se conecta a dados pessoais, direitos e riscos emergentes.'],
  ['A ISO/IEC 42001 é:', ['Uma lei europeia.', 'Um sistema de gestão de IA com requisitos de melhoria contínua.', 'Um modelo de linguagem.', 'Um contrato de nuvem.'], 'B', 'A norma estrutura um AIMS para desenvolver, fornecer ou usar IA de forma responsável.'],
  ['O ciclo PDCA na ISO 42001 significa:', ['Plan, Do, Check, Act.', 'Prompt, Data, Code, AI.', 'People, Design, Control, Audit.', 'Privacy, Data, Compliance, Access.'], 'A', 'Planejar, executar, verificar e agir para melhorar.'],
  ['No NIST AI RMF, Govern é:', ['Uma função transversal de governança, cultura e políticas.', 'Apenas um teste técnico.', 'Uma certificação obrigatória.', 'A etapa de descarte.'], 'A', 'Govern orienta as outras funções: Map, Measure e Manage.'],
  ['Um COE de IA deve:', ['Concentrar toda decisão e bloquear as áreas.', 'Criar capacidade, padrões, suporte, aprendizagem e coordenação.', 'Ser apenas um grupo de marketing.', 'Eliminar a responsabilidade dos donos de processo.'], 'B', 'COE pode ser federado e deve conectar método à execução.'],
  ['No modelo federado:', ['Tudo é decidido por cada usuário individual.', 'Centro define padrões e áreas executam com responsabilidade local.', 'Não existe política central.', 'A auditoria substitui a operação.'], 'B', 'A federação combina consistência central e conhecimento do processo.'],
  ['Um inventário de IA deve registrar:', ['Somente o nome da ferramenta.', 'Uso, finalidade, dono, dados, risco, controles e revisão.', 'Apenas custo mensal.', 'Somente modelos desenvolvidos internamente.'], 'B', 'Sem inventário, a organização não enxerga portfólio nem exposição.'],
  ['Um fornecedor que diz "seguimos as melhores práticas":', ['Dispensa perguntas.', 'Deve ser avaliado em contrato, técnica, configuração e gestão.', 'Pode receber qualquer dado.', 'Elimina a necessidade de logs.'], 'B', 'Afirmação comercial não substitui evidência e compromisso contratual.'],
  ['Responsabilidade compartilhada significa:', ['O fornecedor responde por tudo.', 'Cliente e fornecedor dividem camadas diferentes de controle.', 'Ninguém responde em caso de erro.', 'O cliente não configura nada.'], 'B', 'Produto, contrato, configuração e processo têm donos diferentes.'],
  ['Um critério adequado de parada é:', ['Parar se alguém reclamar, sem análise.', 'Taxa de erro acima do limite ou incidente relevante, conforme definido previamente.', 'Parar apenas no fim do contrato.', 'Nunca parar para não perder investimento.'], 'B', 'Critérios devem ser definidos antes e ligados ao risco.'],
  ['C2PA ajuda a:', ['Provar universalmente que um evento aconteceu.', 'Associar declarações de proveniência a um ativo digital.', 'Anonimizar qualquer imagem.', 'Substituir revisão humana.'], 'B', 'Proveniência e camada de evidência, não prova completa de verdade.'],
  ['Ausência de Content Credential significa:', ['Que o arquivo é falso.', 'Que o arquivo não tem credencial disponível; outras apurações continuam necessárias.', 'Que o arquivo é necessariamente humano.', 'Que o evento ocorreu.'], 'B', 'Ausência não é prova de falsidade.'],
  ['Prompt injection é:', ['Uma instrução ou conteúdo que tenta alterar o comportamento esperado do sistema.', 'Uma forma de criptografia.', 'Uma falha de ortografia.', 'Uma auditoria de fornecedores.'], 'A', 'Integrações e agentes devem tratar instruções e dados com separação e validação.'],
  ['Em uma operação crítica, fallback manual serve para:', ['Aumentar dependência do modelo.', 'Manter continuidade quando IA ou fornecedor falha.', 'Substituir todos os controles.', 'Eliminar treinamento.'], 'B', 'Continuidade precisa de procedimento alternativo e critério de acionamento.'],
  ['Uma política de IA aplicável deve incluir:', ['Somente uma frase de incentivo.', 'Escopo, usos permitidos/restritos, dados, aprovação, revisão, incidentes e atualização.', 'Apenas marca da ferramenta.', 'Somente punições.'], 'B', 'Política precisa orientar decisão e execução.'],
  ['Um caso de uso deve ser reavaliado quando:', ['Apenas muda o nome do usuário.', 'Mudam finalidade, modelo, dados, fornecedor, integração ou impacto.', 'Nunca, depois de aprovado.', 'Somente quando há auditoria externa.'], 'B', 'Mudança pode alterar risco e controles necessários.'],
  ['Para reduzir viés, é importante:', ['Olhar apenas para média global.', 'Avaliar dados, grupos afetados, métricas, impactos e contestação.', 'Assumir neutralidade do modelo.', 'Remover qualquer revisão humana.'], 'B', 'Viés pode aparecer em várias etapas, não apenas no modelo.'],
  ['Uma métrica de adoção alta prova:', ['Que o uso é seguro.', 'Apenas que a ferramenta está sendo utilizada.', 'Que o valor é alto.', 'Que não há shadow AI.'], 'B', 'Adoção precisa ser combinada com qualidade, risco e evidência.'],
  ['Em um piloto responsável, deve existir antes do início:', ['Somente data de lançamento.', 'Finalidade, dados permitidos, critérios de sucesso, erro e parada.', 'Somente aprovação comercial.', 'Apenas um prompt.'], 'B', 'Piloto sem limites gera dependência e dificulta decisão posterior.'],
  ['A melhor resposta a uma saída incorreta que afetou uma pessoa é:', ['Ocultar o erro.', 'Interromper propagação, preservar evidência, revisar impacto e corrigir processo.', 'Culpar o usuário sem investigar.', 'Apagar os logs.'], 'B', 'Incidente e contenção, avaliação, comunicação, correção e aprendizagem.'],
  ['A maturidade de governança aumenta quando a organização:', ['Possui mais checklists, sem evidência.', 'Conecta política, execução, medição, auditoria e melhoria.', 'Proíbe toda experimentação.', 'Depende de uma única pessoa.'], 'B', 'Maturidade e capacidade institucional, não volume de documentos.'],
  ['A evidência mais forte de que um controle está operando é:', ['A existência de uma política assinada, mesmo sem registros.', 'Um registro verificável de execução, responsável, resultado e tratamento de exceções.', 'A declaração do fornecedor de que o processo é seguro.', 'A percepção de que ninguém reclamou.'], 'B', 'Governança precisa demonstrar execução: dono, periodicidade, evidência, resultado e exceção tratada.'],
]).map((item, index) => ({ id: index + 1, question: item[0], options: item[1], answer: item[2], comment: item[3] }))

function Eyebrow({ children }) {
  return <span className="og-eyebrow">{children}</span>
}

function Nav() {
  return (
    <nav className="og-nav">
      <a className="og-brand" href="/">
        <span>M</span>
        <strong>Mentoria IA</strong>
      </a>
      <div>
        {navItems.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
      </div>
    </nav>
  )
}

function Hero({ image, eyebrow, title, copy, primaryHref, primaryLabel, secondaryHref, secondaryLabel, metrics }) {
  return (
    <section className="og-hero">
      <img src={image} alt="" aria-hidden="true" />
      <div className="og-hero-overlay" />
      <div className="og-grid" />
      <div className="og-hero-content">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{copy}</p>
        <div className="og-actions">
          <a href={primaryHref}>{primaryLabel}</a>
          <a href={secondaryHref}>{secondaryLabel}</a>
        </div>
      </div>
      <div className="og-hero-metrics">
        {metrics.map(([value, label]) => (
          <div className="og-metric" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, copy }) {
  return (
    <div className="og-section-head">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  )
}

function Shell({ children }) {
  return (
    <div className="og-page">
      <style>{styles}</style>
      <Nav />
      {children}
    </div>
  )
}

function RiskFlowSvg() {
  const nodes = ['Uso', 'Evento', 'Causa', 'Impacto', 'Controle', 'Residual']
  return (
    <svg className="og-flow-svg" viewBox="0 0 900 220" role="img" aria-label="Fluxo de risco e controle">
      <defs>
        <linearGradient id="ogLine" x1="0" x2="1">
          <stop offset="0" stopColor="#ff6a00" />
          <stop offset="1" stopColor="#84cc16" />
        </linearGradient>
      </defs>
      {nodes.map((node, index) => {
        const x = 70 + index * 150
        return (
          <g key={node}>
            {index < nodes.length - 1 && <path d={`M ${x + 52} 110 L ${x + 116} 110`} stroke="url(#ogLine)" strokeWidth="3" strokeDasharray="8 8" />}
            <circle cx={x} cy="110" r="52" fill="rgba(255,106,0,.08)" stroke="rgba(255,106,0,.55)" />
            <text x={x} y="105" textAnchor="middle" fill="#f5f2ea" fontSize="18" fontFamily="Space Grotesk" fontWeight="700">{node}</text>
            <text x={x} y="130" textAnchor="middle" fill="#8b867c" fontSize="12" fontFamily="Space Mono">{String(index + 1).padStart(2, '0')}</text>
          </g>
        )
      })}
    </svg>
  )
}

function DomainOrbit({ active, onSelect }) {
  return (
    <div className="og-orbit" aria-label="Domínios do framework">
      <div className="og-orbit-core">
        <strong>GenAI</strong>
        <span>Governance</span>
      </div>
      {frameworkDomains.map((domain, index) => (
        <button
          type="button"
          className={active === index ? 'active' : ''}
          key={domain.short}
          style={/** @type {import('react').CSSProperties & Record<'--i', number>} */ ({ '--i': index })}
          onClick={() => onSelect(index)}
        >
          <span>{index + 1}</span>
          {domain.short}
        </button>
      ))}
    </div>
  )
}

export function OrsegupsGovernancaPage() {
  const [activePart, setActivePart] = useState(0)
  const [activeGate, setActiveGate] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [activeCase, setActiveCase] = useState(0)
  const part = contentParts[activePart]
  const step = socraticSteps[activeStep]
  const caseLab = caseLabs[activeCase]

  return (
    <Shell>
      <Hero
        image={heroGovernanca}
        eyebrow="ORSEGUPS - Fase 01"
        title="Governança de IA do fundamento à operação"
        copy="Uma experiência executiva para transformar IA generativa em decisão proporcional, com risco conhecido, controle operando e evidência verificável."
        primaryHref="#mapa"
        primaryLabel="Explorar apostila"
        secondaryHref="/aulas/governanca-ia/teste"
        secondaryLabel="Ir para teste"
        metrics={[['30', 'páginas da apostila'], ['6', 'partes didáticas'], ['90', 'dias de roadmap']]}
      />

      <main>
        <section id="mapa" className="og-section">
          <SectionHeader
            eyebrow="Objetivos"
            title="O que a liderança precisa demonstrar ao final"
            copy="A apostila foi estruturada para criar raciocínio: compreender a situação, reconhecer risco, escolher resposta proporcional e registrar evidência."
          />
          <div className="og-card-grid six">
            {learningOutcomes.map(([title, copy]) => (
              <article className="og-card" key={title}>
                <strong>{title}</strong>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="og-section og-split">
          <div>
            <SectionHeader
              eyebrow="Mapa interativo"
              title="Seis blocos de conteúdo para navegar a apostila"
              copy="Selecione uma parte para ver o foco didático, riscos e controles associados."
            />
            <div className="og-tabs">
              {contentParts.map((item, index) => (
                <button type="button" className={activePart === index ? 'active' : ''} key={item.id} onClick={() => setActivePart(index)}>
                  {item.label}
                </button>
              ))}
            </div>
            <article className="og-focus-card">
              <Eyebrow>{part.label}</Eyebrow>
              <h3>{part.title}</h3>
              <p>{part.copy}</p>
              <ul>{part.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              <div className="og-deep-grid">
                {part.deep.map(([label, text]) => (
                  <div key={label}>
                    <strong>{label}</strong>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
              <div className="og-socratic-box">
                <strong>Perguntas socráticas</strong>
                <ol>{part.socratic.map((question) => <li key={question}>{question}</li>)}</ol>
              </div>
              <div className="og-artifact-line">
                <span>Artefato esperado</span>
                <p>{part.artifact}</p>
              </div>
              <div className="og-warning-line">
                <span>Armadilha comum</span>
                <p>{part.misconception}</p>
              </div>
            </article>
          </div>
          <div className="og-panel">
            <RiskFlowSvg />
            <p className="og-caption">Fluxo premium de análise: uso, evento, causa, impacto, controle e risco residual.</p>
          </div>
        </section>

        <section className="og-section og-band">
          <SectionHeader
            eyebrow="Método socrático"
            title="Aula guiada por perguntas, tensão e evidência"
            copy="O aluno aprende governança quando precisa defender uma decisão. Cada etapa força a passagem de opinião para critério verificável."
          />
          <div className="og-socratic-layout">
            <div className="og-step-list">
              {socraticSteps.map((item, index) => (
                <button type="button" className={activeStep === index ? 'active' : ''} key={item[0]} onClick={() => setActiveStep(index)}>
                  <span>{item[0]}</span>
                  {item[1]}
                </button>
              ))}
            </div>
            <article className="og-focus-card">
              <Eyebrow>{step[0]}</Eyebrow>
              <h3>{step[1]}</h3>
              <p>{step[2]}</p>
              <div className="og-big-question">{step[3]}</div>
              <div className="og-reflection-grid">
                <div><strong>Resposta fraca</strong><p>Usar termos genéricos como "baixo risco", "sem dados sensíveis" ou "humano revisa" sem prova operacional.</p></div>
                <div><strong>Resposta forte</strong><p>Apontar fonte, dono, controle, evidência, exceção e condição objetiva de revisão ou parada.</p></div>
              </div>
            </article>
          </div>
        </section>

        <section className="og-section">
          <SectionHeader
            eyebrow="Laboratório aplicado"
            title="Três casos para praticar raciocínio de governança"
            copy="Cada caso começa com uma hipótese útil, mas só avança quando o aluno identifica tensão, perguntas, controles e evidência."
          />
          <div className="og-tabs">
            {caseLabs.map((item, index) => (
              <button type="button" className={activeCase === index ? 'active' : ''} key={item.name} onClick={() => setActiveCase(index)}>
                {item.name}
              </button>
            ))}
          </div>
          <div className="og-case-layout">
            <article className="og-focus-card">
              <Eyebrow>Caso ORSEGUPS</Eyebrow>
              <h3>{caseLab.name}</h3>
              <p>{caseLab.context}</p>
              <div className="og-warning-line">
                <span>Tensão de aprendizagem</span>
                <p>{caseLab.tension}</p>
              </div>
            </article>
            <div className="og-panel">
              <div className="og-two-lists">
                <div>
                  <strong>Perguntas de investigação</strong>
                  <ul>{caseLab.questions.map((question) => <li key={question}>{question}</li>)}</ul>
                </div>
                <div>
                  <strong>Controles proporcionais</strong>
                  <ul>{caseLab.controls.map((control) => <li key={control}>{control}</li>)}</ul>
                </div>
              </div>
              <div className="og-artifact-line">
                <span>Evidência mínima</span>
                <p>{caseLab.evidence}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="og-section og-band">
          <SectionHeader
            eyebrow="Riscos e controles"
            title="Segurança de IA precisa olhar o sistema inteiro"
            copy="A apostila destaca prompts, dados, integrações, agentes, fornecedores, disponibilidade, supervisão e resposta."
          />
          <div className="og-table-wrap">
            <table className="og-table">
              <thead><tr><th>Risco</th><th>Como aparece</th><th>Controles iniciais</th></tr></thead>
              <tbody>
                {riskControls.map(([risk, appears, control]) => (
                  <tr key={risk}><td><strong>{risk}</strong></td><td>{appears}</td><td>{control}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="og-section">
          <SectionHeader
            eyebrow="Matriz de decisão"
            title="Perguntas densas que o aluno deve saber responder"
            copy="Use esta matriz como roteiro de discussão antes de piloto, compra, integração ou produção."
          />
          <div className="og-table-wrap">
            <table className="og-table">
              <thead><tr><th>Dimensão</th><th>Pergunta socrática</th><th>O que precisa aparecer</th><th>Evidência esperada</th></tr></thead>
              <tbody>
                {decisionMatrix.map(([dimension, question, expected, evidence]) => (
                  <tr key={dimension}>
                    <td><strong>{dimension}</strong></td>
                    <td>{question}</td>
                    <td>{expected}</td>
                    <td>{evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="og-section og-split reverse">
          <div className="og-panel">
            <div className="og-pdca">
              {['Plan', 'Do', 'Check', 'Act'].map((item, index) => <span key={item} style={/** @type {import('react').CSSProperties & Record<'--i', number>} */ ({ '--i': index })}>{item}</span>)}
            </div>
            <div className="og-mini-grid">
              {nistCards.map(([label, copy]) => (
                <article key={label}><strong>{label}</strong><p>{copy}</p></article>
              ))}
            </div>
          </div>
          <div>
            <SectionHeader
              eyebrow="Normas e referenciais"
              title="ISO 42001, NIST AI RMF e regulação como camada operacional"
              copy="A página traduz norma e framework em artefatos de gestão: política, inventário, avaliação de risco, indicadores, auditoria e melhoria contínua."
            />
            <div className="og-card-grid two">
              <article className="og-card accent"><strong>AI Act</strong><p>Classificação por risco: proibido, alto risco, transparência e mínimo/baixo risco.</p></article>
              <article className="og-card accent"><strong>LGPD e ANPD</strong><p>Finalidade, necessidade, transparência, segurança, não discriminação e prestação de contas.</p></article>
            </div>
          </div>
        </section>

        <section className="og-section">
          <SectionHeader
            eyebrow="Ciclo de vida"
            title="Gates para sair da ideia e chegar à produção responsável"
            copy="Clique em cada gate para ver qual decisão precisa existir antes de avançar."
          />
          <div className="og-gates">
            {lifecycleGates.map((gate, index) => (
              <button type="button" className={activeGate === index ? 'active' : ''} key={gate[0]} onClick={() => setActiveGate(index)}>
                <span>{gate[0]}</span>{gate[1]}
              </button>
            ))}
          </div>
          <article className="og-focus-card gate">
            <span>{lifecycleGates[activeGate][0]}</span>
            <h3>{lifecycleGates[activeGate][1]}</h3>
            <p>{lifecycleGates[activeGate][2]}</p>
          </article>
        </section>

        <section className="og-section og-band">
          <SectionHeader
            eyebrow="COE"
            title="Centro de Excelência federado: centro forte, execução local"
            copy="O COE não elimina donos de processo; ele cria método, suporte, padrões, aprendizagem e coordenação."
          />
          <div className="og-roadmap">
            {coeRoadmap.map(([period, action]) => (
              <article key={period}>
                <span>{period}</span>
                <p>{action}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="og-section">
          <SectionHeader
            eyebrow="Pacote de evidências"
            title="O que a aula deve produzir, não apenas discutir"
            copy="Governança aparece quando há registros verificáveis. Estes artefatos transformam a conversa em execução."
          />
          <div className="og-card-grid six">
            {artifactDeck.map(([title, copy]) => (
              <article className="og-card" key={title}>
                <strong>{title}</strong>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="og-section og-band">
          <SectionHeader
            eyebrow="Checagem conceitual"
            title="Armadilhas que o aluno precisa desmontar"
            copy="O método socrático funciona quando uma afirmação confortável é testada até virar critério, evidência ou correção."
          />
          <div className="og-misconception-grid">
            {misconceptionChecks.map(([label, weak, correction]) => (
              <article key={label}>
                <span>{label}</span>
                <p>{weak}</p>
                <strong>{correction}</strong>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Shell>
  )
}

function scoreLabel(score) {
  if (score >= 36) return ['Domínio muito bom', 'Aplicar um caso real anonimizado e montar um plano de 90 dias.']
  if (score >= 30) return ['Boa base', 'Retomar capítulos correspondentes e revisar o cartão de decisão.']
  if (score >= 20) return ['Compreensão parcial', 'Refazer casos práticos com apoio de gestor e área de controle.']
  return ['Fundamentos frágeis', 'Reestudar Partes I-III antes de avançar para piloto.']
}

export function OrsegupsGovernancaTestePage() {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const score = useMemo(() => questions.reduce((total, q) => total + (answers[q.id] === q.answer ? 1 : 0), 0), [answers])
  const answered = Object.keys(answers).length
  const missing = questions.length - answered
  const isComplete = answered === questions.length
  const completionPercent = Math.round((answered / questions.length) * 100)
  const scorePercent = Math.round((score / questions.length) * 100)
  const resultPercent = submitted ? scorePercent : completionPercent
  const [label, nextStep] = scoreLabel(score)
  const studyRecommendation = isComplete
    ? 'Todas as questões foram respondidas. Antes de corrigir, revise mentalmente os pontos de LGPD, risco residual, supervisão humana, fornecedores, C2PA, ISO 42001, NIST AI RMF e COE.'
    : `Responda ${missing} questão${missing === 1 ? '' : 'ões'} para liberar a correção. Antes da avaliação, retome a apostila nos blocos de dados, riscos, normas, ciclo de vida e governança operacional.`

  const choose = (id, letter) => {
    if (!submitted) setAnswers({ ...answers, [id]: letter })
  }

  return (
    <Shell>
      <Hero
        image={heroTeste}
        eyebrow="Avaliação - 40 questões"
        title="Teste de governança de IA com correção comentada"
        copy="Uma avaliação separada para medir compreensão e julgamento aplicado. Ao final, o sistema calcula resultado, interpreta a pontuação e comenta cada questão."
        primaryHref="#teste"
        primaryLabel="Começar teste"
        secondaryHref="/aulas/governanca-ia"
        secondaryLabel="Revisar apostila"
        metrics={[['40', 'questões'], ['60', 'minutos sugeridos'], ['4', 'faixas de resultado']]}
      />
      <main>
        <section id="teste" className="og-section">
          <div className="og-test-head">
            <SectionHeader
              eyebrow="Teste objetivo"
              title="Marque uma alternativa por questão"
              copy="O gabarito permanece oculto até a correção. A avaliação só é liberada quando todas as questões estiverem respondidas."
            />
            <div className="og-score-card">
              <strong>{submitted ? `${score}/40` : `${answered}/40`}</strong>
              <span>{submitted ? `${scorePercent}% de aproveitamento` : `${completionPercent}% de finalização`}</span>
            </div>
          </div>

          <article className="og-study-note">
            <strong>Recomendação de estudo antes da avaliação</strong>
            <p>{studyRecommendation}</p>
          </article>

          <div className="og-question-grid">
            {questions.map((q) => {
              const selected = answers[q.id]
              const correct = selected === q.answer
              return (
                <article className={`og-question ${submitted ? (correct ? 'correct' : 'wrong') : ''}`} key={q.id}>
                  <div className="og-question-meta"><span>{String(q.id).padStart(2, '0')}</span><small>{submitted ? `Gabarito ${q.answer}` : 'Escolha A-D'}</small></div>
                  <h3>{q.question}</h3>
                  <div className="og-options">
                    {q.options.map((option, index) => {
                      const letter = ['A', 'B', 'C', 'D'][index]
                      const className = [
                        selected === letter ? 'selected' : '',
                        submitted && q.answer === letter ? 'answer' : '',
                        submitted && selected === letter && selected !== q.answer ? 'miss' : '',
                      ].filter(Boolean).join(' ')
                      return <button type="button" className={className} key={letter} onClick={() => choose(q.id, letter)}><strong>{letter}</strong><span>{option}</span></button>
                    })}
                  </div>
                  {submitted && <div className="og-comment"><strong>{correct ? 'Correta' : 'Incorreta'}</strong><p>{q.comment}</p></div>}
                </article>
              )
            })}
          </div>

          <div className="og-result-panel">
            <div className="og-score-ring" style={/** @type {import('react').CSSProperties & Record<'--score', string>} */ ({ '--score': `${resultPercent}%` })}><strong>{resultPercent}%</strong></div>
            <div>
              <span>{submitted ? 'Resultado final' : 'Finalização do teste'}</span>
              <h3>{submitted ? label : 'Recomendação de estudo'}</h3>
              <p>{submitted ? nextStep : studyRecommendation}</p>
            </div>
            <div className="og-actions vertical">
              <button type="button" onClick={() => setSubmitted(true)} disabled={!isComplete || submitted}>
                {submitted ? 'Teste corrigido' : isComplete ? 'Corrigir teste' : missing === 1 ? 'Falta 1' : `Faltam ${missing}`}
              </button>
              <button type="button" onClick={() => { setAnswers({}); setSubmitted(false) }}>Limpar respostas</button>
            </div>
          </div>
        </section>
      </main>
    </Shell>
  )
}

export function OrsegupsGovernancaFrameworkPage() {
  const [activeDomain, setActiveDomain] = useState(0)
  const [activeStage, setActiveStage] = useState(0)
  const [maturity, setMaturity] = useState({
    'Estratégia': 2,
    Dados: 2,
    'Operação': 2,
    Pessoas: 2,
    'Transparência': 2,
  })
  const domain = frameworkDomains[activeDomain]
  const average = Object.values(maturity).reduce((sum, value) => sum + Number(value), 0) / Object.values(maturity).length
  const maturityLabel = average >= 4 ? 'Escalar com auditoria' : average >= 3 ? 'Pilotar com controle' : average >= 2 ? 'Estruturar bases' : 'Começar por fundamentos'

  return (
    <Shell>
      <Hero
        image={heroFramework}
        eyebrow="GenAI Governance Framework"
        title="Framework interativo para estruturar governança de IA"
        copy="Transforme os cinco domínios do framework em diagnóstico, priorização, plano de ação e evidências para sua organização."
        primaryHref="#framework"
        primaryLabel="Abrir framework"
        secondaryHref="/aulas/governanca-ia/teste"
        secondaryLabel="Fazer teste"
        metrics={[['5', 'domínios'], ['4', 'estágios'], ['5', 'etapas de avaliação']]}
      />
      <main>
        <section id="framework" className="og-section og-split">
          <div>
            <SectionHeader
              eyebrow="Cinco domínios"
              title="Selecione um domínio e converta risco em controle"
              copy="O framework organiza riscos de GenAI em domínios essenciais para que a organização defina escopo, donos, evidências e melhorias."
            />
            <DomainOrbit active={activeDomain} onSelect={setActiveDomain} />
          </div>
          <article className="og-focus-card">
            <Eyebrow>{domain.short}</Eyebrow>
            <h3>{domain.name}</h3>
            <p>{domain.objective}</p>
            <div className="og-two-lists">
              <div><strong>Riscos abordados</strong><ul>{domain.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul></div>
              <div><strong>Controles prioritários</strong><ul>{domain.controls.slice(0, 7).map((control) => <li key={control}>{control}</li>)}</ul></div>
            </div>
          </article>
        </section>

        <section className="og-section og-band">
          <SectionHeader
            eyebrow="Quatro estágios"
            title="Da intenção estratégica ao plano executado"
            copy="Use os estágios para evitar começar pela ferramenta. O ponto de partida é objetivo, escopo, avaliação de riscos e execução."
          />
          <div className="og-stage-layout">
            <div className="og-gates">
              {frameworkStages.map((stage, index) => (
                <button type="button" key={stage[0]} className={activeStage === index ? 'active' : ''} onClick={() => setActiveStage(index)}><span>{stage[0]}</span>{stage[1]}</button>
              ))}
            </div>
            <article className="og-focus-card gate">
              <span>{frameworkStages[activeStage][0]}</span>
              <h3>{frameworkStages[activeStage][1]}</h3>
              <p>{frameworkStages[activeStage][2]}</p>
            </article>
          </div>
        </section>

        <section className="og-section">
          <SectionHeader
            eyebrow="Avaliação de riscos"
            title="Cinco entregáveis para diagnosticar maturidade"
            copy="A avaliação de riscos do framework deve produzir entregáveis claros, não apenas reuniões ou checklists soltos."
          />
          <div className="og-assessment">
            {assessmentSteps.map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{title}</strong>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="og-section og-split reverse">
          <div className="og-panel">
            <div className="og-score-ring large" style={/** @type {import('react').CSSProperties & Record<'--score', string>} */ ({ '--score': `${(average / 5) * 100}%` })}><strong>{average.toFixed(1)}</strong></div>
            <h3>{maturityLabel}</h3>
            <p className="og-caption">Média dos cinco domínios. Use 1 para inicial e 5 para domínio robusto, com evidência recorrente.</p>
          </div>
          <div>
            <SectionHeader
              eyebrow="Construtor de maturidade"
              title="Ajuste a maturidade por domínio e gere prioridade"
              copy="O painel ajuda a estruturar uma conversa executiva: onde a governança está fraca, qual domínio puxar primeiro e que evidências buscar."
            />
            <div className="og-slider-list">
              {Object.entries(maturity).map(([key, value]) => (
                <label key={key}>
                  <span>{key}</span>
                  <input type="range" min="1" max="5" value={value} onChange={(event) => setMaturity({ ...maturity, [key]: Number(event.target.value) })} />
                  <strong>{value}</strong>
                </label>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Shell>
  )
}

const styles = `
  .og-page { min-height: 100vh; background: ${C.bg}; color: ${C.text}; font-family: 'Space Grotesk', sans-serif; overflow-x: hidden; }
  .og-page * { box-sizing: border-box; }
  .og-nav { position: fixed; inset: 0 0 auto; z-index: 50; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(20px, 4vw, 56px); background: rgba(6,6,6,.9); border-bottom: 1px solid ${C.line}; backdrop-filter: blur(14px); }
  .og-brand, .og-nav a { color: ${C.text}; text-decoration: none; }
  .og-brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; }
  .og-brand span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 4px; background: ${C.accent}; color: #000; font-family: 'Space Mono', monospace; }
  .og-nav > div { display: flex; gap: 22px; }
  .og-nav > div a { color: ${C.muted}; font-family: 'Space Mono', monospace; font-size: .72rem; text-transform: uppercase; }
  .og-nav > div a:hover { color: ${C.accent}; }
  .og-hero { position: relative; min-height: 96vh; display: grid; align-items: end; overflow: hidden; border-bottom: 1px solid ${C.line}; }
  .og-hero > img, .og-hero-overlay, .og-grid { position: absolute; inset: 0; }
  .og-hero > img { width: 100%; height: 100%; object-fit: cover; opacity: .78; }
  .og-hero-overlay { background: linear-gradient(90deg, rgba(6,6,6,.98) 0%, rgba(6,6,6,.62) 48%, rgba(6,6,6,.82) 100%), linear-gradient(180deg, rgba(6,6,6,.2) 0%, rgba(6,6,6,.96) 100%); }
  .og-grid { pointer-events: none; background-image: linear-gradient(to right, rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.055) 1px, transparent 1px); background-size: 38px 38px; mask-image: linear-gradient(180deg, rgba(0,0,0,.72), rgba(0,0,0,.1)); }
  .og-hero-content { position: relative; z-index: 2; width: min(820px, calc(100vw - 40px)); margin: 0 0 clamp(92px, 10vw, 140px) clamp(20px, 6vw, 88px); }
  .og-eyebrow { display: block; margin-bottom: 12px; color: ${C.accent}; font-family: 'Space Mono', monospace; font-size: .75rem; text-transform: uppercase; letter-spacing: 0; }
  .og-hero h1 { margin: 0 0 24px; font-size: clamp(3rem, 7.5vw, 7.8rem); line-height: .92; letter-spacing: 0; text-transform: uppercase; }
  .og-hero p { max-width: 720px; margin: 0; color: rgba(245,242,234,.82); font-size: clamp(1rem, 1.4vw, 1.22rem); line-height: 1.75; }
  .og-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
  .og-actions a, .og-actions button { min-height: 44px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid ${C.lineStrong}; border-radius: 4px; background: transparent; color: ${C.text}; padding: 12px 20px; text-decoration: none; font: inherit; font-weight: 700; cursor: pointer; }
  .og-actions a:first-child, .og-actions button:first-child { background: ${C.accent}; color: #000; border-color: ${C.accent}; }
  .og-actions.vertical { flex-direction: column; margin-top: 0; }
  .og-hero-metrics { position: absolute; right: clamp(20px, 5vw, 80px); bottom: 32px; z-index: 2; display: grid; grid-template-columns: repeat(3, minmax(130px, 1fr)); border: 1px solid ${C.line}; background: rgba(16,16,16,.7); backdrop-filter: blur(12px); }
  .og-metric { padding: 18px 22px; border-right: 1px solid ${C.line}; }
  .og-metric:last-child { border-right: 0; }
  .og-metric strong { display: block; color: ${C.accent}; font-family: 'Space Mono', monospace; font-size: 1.8rem; line-height: 1; }
  .og-metric span { display: block; margin-top: 8px; color: ${C.muted}; font-size: .8rem; }
  .og-section { width: min(1440px, calc(100vw - 40px)); margin: 0 auto; padding: clamp(72px, 9vw, 116px) 0; }
  .og-section + .og-section { border-top: 1px solid ${C.line}; }
  .og-band { width: 100%; max-width: none; padding-inline: clamp(20px, 5vw, 72px); background: ${C.bg2}; }
  .og-band > * { max-width: 1440px; margin-left: auto; margin-right: auto; }
  .og-section-head { max-width: 820px; margin-bottom: 38px; }
  .og-section-head h2 { margin: 0; font-size: clamp(2rem, 4vw, 4rem); line-height: 1.03; letter-spacing: 0; }
  .og-section-head p { margin: 18px 0 0; color: ${C.muted}; line-height: 1.8; }
  .og-card-grid { display: grid; gap: 14px; }
  .og-card-grid.six { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .og-card-grid.two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .og-card, .og-focus-card, .og-panel, .og-question, .og-score-card, .og-result-panel article { border: 1px solid ${C.line}; border-radius: 8px; background: ${C.panel}; padding: 24px; }
  .og-card.accent { border-top: 2px solid ${C.accent}; }
  .og-card strong, .og-focus-card h3 { color: ${C.text}; }
  .og-card p, .og-focus-card p, .og-caption { color: ${C.muted}; line-height: 1.75; }
  .og-split { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(360px, .95fr); gap: clamp(28px, 5vw, 70px); align-items: center; }
  .og-split.reverse { grid-template-columns: minmax(360px, .95fr) minmax(0, 1.05fr); }
  .og-tabs, .og-gates { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 16px; }
  .og-tabs button, .og-gates button { min-height: 40px; border: 1px solid ${C.line}; border-radius: 4px; background: ${C.panel2}; color: ${C.muted}; padding: 10px 14px; cursor: pointer; font: inherit; }
  .og-tabs button.active, .og-gates button.active { border-color: rgba(255,106,0,.55); background: ${C.accentSoft}; color: ${C.accent}; }
  .og-focus-card h3 { margin: 0 0 14px; font-size: clamp(1.4rem, 2.4vw, 2.2rem); line-height: 1.15; }
  .og-focus-card ul, .og-two-lists ul { margin: 18px 0 0; padding-left: 18px; color: ${C.muted}; line-height: 1.8; }
  .og-focus-card.gate > span { color: ${C.accent}; font-family: 'Space Mono', monospace; }
  .og-deep-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 22px; }
  .og-deep-grid div, .og-reflection-grid div { border: 1px solid ${C.line}; border-radius: 6px; background: ${C.panel2}; padding: 16px; }
  .og-deep-grid strong, .og-reflection-grid strong, .og-two-lists strong { color: ${C.text}; }
  .og-deep-grid p, .og-reflection-grid p { margin: 8px 0 0; color: ${C.muted}; line-height: 1.65; }
  .og-socratic-box, .og-artifact-line, .og-warning-line { margin-top: 18px; border-left: 3px solid ${C.accent}; background: rgba(255,255,255,.035); padding: 16px 18px; }
  .og-socratic-box strong, .og-artifact-line span, .og-warning-line span { color: ${C.accent}; font-family: 'Space Mono', monospace; font-size: .72rem; text-transform: uppercase; }
  .og-socratic-box ol { margin: 12px 0 0; padding-left: 22px; color: ${C.text}; line-height: 1.75; }
  .og-artifact-line p, .og-warning-line p { margin: 8px 0 0; color: ${C.muted}; line-height: 1.65; }
  .og-warning-line { border-left-color: ${C.warning}; }
  .og-warning-line span { color: ${C.warning}; }
  .og-socratic-layout, .og-case-layout { display: grid; grid-template-columns: .9fr 1.1fr; gap: 20px; align-items: stretch; }
  .og-step-list { display: grid; gap: 10px; align-content: start; }
  .og-step-list button { min-height: 72px; display: grid; grid-template-columns: 44px minmax(0, 1fr); gap: 12px; align-items: center; border: 1px solid ${C.line}; border-radius: 6px; background: ${C.panel}; color: ${C.text}; padding: 14px; cursor: pointer; font: inherit; text-align: left; }
  .og-step-list button span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 4px; background: rgba(255,255,255,.06); color: ${C.accent}; font-family: 'Space Mono', monospace; }
  .og-step-list button.active { border-color: rgba(255,106,0,.55); background: ${C.accentSoft}; }
  .og-step-list button.active span { background: ${C.accent}; color: #000; }
  .og-big-question { margin-top: 20px; border: 1px solid rgba(255,106,0,.45); border-radius: 8px; background: ${C.accentSoft}; color: ${C.text}; padding: 20px; font-size: clamp(1.15rem, 2vw, 1.75rem); line-height: 1.35; }
  .og-reflection-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 14px; }
  .og-flow-svg { width: 100%; height: auto; min-height: 220px; }
  .og-table-wrap { overflow-x: auto; border: 1px solid ${C.line}; border-radius: 8px; background: ${C.panel}; }
  .og-table { width: 100%; border-collapse: collapse; min-width: 760px; }
  .og-table th, .og-table td { padding: 18px; border-bottom: 1px solid ${C.line}; text-align: left; vertical-align: top; color: ${C.muted}; }
  .og-table th { color: ${C.text}; background: ${C.panel2}; font-family: 'Space Mono', monospace; font-size: .72rem; text-transform: uppercase; }
  .og-table tr:last-child td { border-bottom: 0; }
  .og-pdca { position: relative; height: 320px; border: 1px solid ${C.line}; border-radius: 8px; background: radial-gradient(circle at center, rgba(255,106,0,.22), transparent 34%), ${C.panel2}; }
  .og-pdca span { position: absolute; left: calc(50% + cos(var(--i) * 90deg) * 110px); top: calc(50% + sin(var(--i) * 90deg) * 110px); transform: translate(-50%, -50%); width: 94px; height: 94px; display: grid; place-items: center; border: 1px solid rgba(255,106,0,.45); border-radius: 50%; color: ${C.accent}; font-weight: 700; }
  .og-mini-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
  .og-mini-grid article, .og-roadmap article, .og-assessment article { border: 1px solid ${C.line}; border-radius: 6px; background: ${C.panel}; padding: 18px; }
  .og-mini-grid p, .og-roadmap p, .og-assessment p { color: ${C.muted}; line-height: 1.65; }
  .og-gates button { display: inline-flex; align-items: center; gap: 8px; }
  .og-gates span, .og-roadmap span, .og-assessment span { color: ${C.accent}; font-family: 'Space Mono', monospace; }
  .og-roadmap { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .og-misconception-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
  .og-misconception-grid article { border: 1px solid ${C.line}; border-radius: 8px; background: ${C.panel}; padding: 20px; }
  .og-misconception-grid span { color: ${C.accent}; font-family: 'Space Mono', monospace; font-size: .72rem; text-transform: uppercase; }
  .og-misconception-grid p { margin: 12px 0; color: ${C.text}; line-height: 1.55; }
  .og-misconception-grid strong { display: block; color: ${C.muted}; line-height: 1.6; }
  .og-test-head { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 24px; align-items: start; }
  .og-score-card { min-width: 220px; text-align: center; border-color: rgba(255,106,0,.34); background: ${C.accentSoft}; }
  .og-score-card strong { display: block; color: ${C.accent}; font-family: 'Space Mono', monospace; font-size: 2.4rem; }
  .og-score-card span { color: ${C.muted}; }
  .og-study-note { margin: 0 0 26px; border: 1px solid rgba(245,158,11,.34); border-radius: 8px; background: rgba(245,158,11,.08); padding: 22px 24px; }
  .og-study-note strong { color: ${C.text}; font-size: 1.05rem; }
  .og-study-note p { margin: 8px 0 0; color: ${C.muted}; line-height: 1.7; }
  .og-question-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  .og-question.correct { border-color: rgba(132,204,22,.45); }
  .og-question.wrong { border-color: rgba(239,68,68,.38); }
  .og-question-meta { display: flex; justify-content: space-between; gap: 12px; color: ${C.muted}; font-family: 'Space Mono', monospace; font-size: .72rem; text-transform: uppercase; }
  .og-question-meta span { color: ${C.accent}; }
  .og-question h3 { margin: 12px 0 16px; font-size: 1rem; line-height: 1.5; }
  .og-options { display: grid; gap: 8px; }
  .og-options button { width: 100%; min-height: 48px; display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; align-items: start; border: 1px solid ${C.line}; border-radius: 6px; background: ${C.panel2}; color: ${C.muted}; padding: 12px; text-align: left; cursor: pointer; font: inherit; }
  .og-options button strong { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 4px; background: rgba(255,255,255,.06); color: ${C.text}; font-family: 'Space Mono', monospace; }
  .og-options button.selected { border-color: rgba(255,106,0,.48); color: ${C.text}; }
  .og-options button.answer { border-color: rgba(132,204,22,.55); background: rgba(132,204,22,.08); }
  .og-options button.answer strong { background: ${C.green}; color: #000; }
  .og-options button.miss { border-color: rgba(239,68,68,.55); background: rgba(239,68,68,.08); }
  .og-comment { margin-top: 14px; padding-top: 14px; border-top: 1px solid ${C.line}; }
  .og-comment p { margin: 6px 0 0; color: ${C.muted}; line-height: 1.65; }
  .og-result-panel { margin-top: 22px; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 22px; align-items: center; border: 1px solid ${C.line}; border-radius: 8px; background: ${C.panel}; padding: 24px; }
  .og-actions button:disabled { opacity: .45; cursor: not-allowed; }
  .og-score-ring { width: 112px; height: 112px; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle at center, ${C.panel} 58%, transparent 59%), conic-gradient(${C.accent} var(--score), rgba(255,255,255,.08) 0); }
  .og-score-ring.large { width: 160px; height: 160px; margin: 0 auto 18px; }
  .og-score-ring strong { color: ${C.text}; font-family: 'Space Mono', monospace; }
  .og-orbit { position: relative; min-height: 500px; border: 1px solid ${C.line}; border-radius: 8px; background: radial-gradient(circle at center, rgba(255,106,0,.14), transparent 32%), ${C.panel}; }
  .og-orbit-core { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 150px; height: 150px; display: grid; place-items: center; align-content: center; border: 1px solid rgba(255,106,0,.5); border-radius: 50%; background: rgba(6,6,6,.7); }
  .og-orbit-core span { color: ${C.muted}; font-family: 'Space Mono', monospace; font-size: .72rem; }
  .og-orbit button { position: absolute; left: calc(50% + cos(var(--i) * 72deg - 90deg) * 180px); top: calc(50% + sin(var(--i) * 72deg - 90deg) * 180px); transform: translate(-50%, -50%); width: 124px; min-height: 74px; border: 1px solid ${C.line}; border-radius: 6px; background: ${C.panel2}; color: ${C.muted}; cursor: pointer; font: inherit; }
  .og-orbit button span { display: block; color: ${C.accent}; font-family: 'Space Mono', monospace; }
  .og-orbit button.active { border-color: rgba(255,106,0,.6); background: ${C.accentSoft}; color: ${C.text}; }
  .og-two-lists { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 22px; }
  .og-stage-layout { display: grid; grid-template-columns: .8fr 1.2fr; gap: 18px; }
  .og-assessment { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
  .og-slider-list { display: grid; gap: 14px; }
  .og-slider-list label { display: grid; grid-template-columns: 130px minmax(0, 1fr) 32px; gap: 12px; align-items: center; padding: 14px; border: 1px solid ${C.line}; border-radius: 6px; background: ${C.panel}; }
  .og-slider-list span { color: ${C.text}; }
  .og-slider-list input { accent-color: ${C.accent}; }
  @media (max-width: 1100px) {
    .og-nav > div { display: none; }
    .og-hero-metrics, .og-card-grid.six, .og-card-grid.two, .og-split, .og-split.reverse, .og-roadmap, .og-test-head, .og-question-grid, .og-result-panel, .og-stage-layout, .og-assessment, .og-deep-grid, .og-socratic-layout, .og-case-layout, .og-reflection-grid, .og-misconception-grid { grid-template-columns: 1fr; }
    .og-hero-content { margin: 0 20px 360px; }
    .og-hero h1 { font-size: clamp(2.35rem, 12vw, 3.4rem); line-height: 1; overflow-wrap: anywhere; }
    .og-hero-metrics { left: 20px; right: 20px; }
    .og-metric { border-right: 0; border-bottom: 1px solid ${C.line}; }
    .og-metric:last-child { border-bottom: 0; }
    .og-two-lists, .og-mini-grid { grid-template-columns: 1fr; }
    .og-orbit button { position: static; transform: none; width: 100%; }
    .og-orbit { min-height: auto; display: grid; gap: 10px; padding: 180px 18px 18px; }
    .og-orbit-core { top: 92px; }
    .og-slider-list label { grid-template-columns: 1fr; }
  }
`
