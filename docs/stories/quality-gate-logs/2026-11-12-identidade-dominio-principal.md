# Identidade AI-First no domínio principal

Revisão solicitada em 12/11/2026 para `neuralhub.ia.br`, com a marca institucional original. Referências de escopo: stories 10.1 (home e separação dos domínios), 11.5 (mobile) e especificação do menu de materiais BMAD. Os textos comerciais e a direção visual da home vêm da versão final do kit AI-First.

## Entrega e roteamento

- O endereço institucional histórico `/neuralhub.html` continua a funcionar no domínio principal. A home é HTML estático com metadados de compartilhamento, fontes locais e imagens WebP. A entrada anterior permanece disponível para os outros hosts pelas mesmas URLs públicas.
- Somente o domínio principal carrega a navegação e as regras de identidade nas páginas compartilhadas. O nome reservado `neuralhub.localhost` reproduz a experiência no servidor local.
- As páginas jurídicas preservam seu texto. Links de privacidade e termos do rodapé agora chegam ao documento correspondente. Os destinos de proposta, Academy, blog e aulas que pertencem à Mentoria abrem no host da Mentoria.
- O inventário dos arquivos da versão em produção confirmou que as páginas do guia são a principal, Sobre e Laboratório. O explorador local em `public/infra-modelos` não integra o candidato isolado de publicação.

## Verificação

- Node 24.21.0 e npm 11.19.0. Typecheck, 127 testes em 22 arquivos e build aprovados na árvore de trabalho. O lint global continua com os 158 erros preexistentes nos seis arquivos JavaScript de `bmadguide/dist` e `bmadguide/output` fora do código publicado da mudança.
- Navegador real nas larguras 390 e 1366 px para home, auditoria, checklist, privacidade, termos, apresentação em `/index.html`, inscrição, confirmação, guia de marca e três telas BMAD. Verificados o carregamento da identidade, o título e a largura do documento. As 24 visualizações passaram sem overflow horizontal ou exceção JavaScript.
- Exercitados menu móvel, detalhes dos serviços, destinos comerciais, leitura jurídica e navegação do guia. Formulário do checklist com envio HTTP simulado, marcação e persistência após recarga, impressão sem barra de navegação. No laboratório, criação e filtro de uma tarefa local.
- Controles na home antiga, auditoria, termos, guia de marca e Guia BMAD sob `mentoria.localhost` não solicitaram os recursos visuais do domínio principal.
- O candidato de publicação parte de `a8d2d2c01b631b6fb063b7897992783a295305cb`, identificado nos metadados do deployment de produção. Contém somente as mudanças da identidade e de suas rotas. Seu build e seus fluxos de navegador foram verificados separadamente.

A prévia da árvore de trabalho usa `http://neuralhub.localhost:4189/neuralhub.html`. A montagem para revisão fica em `outputs/identidade-dominio-principal/paginas-verificadas.jpg`.

## Publicação de 12/11/2026

O usuário autorizou a publicação somente em `neuralhub.ia.br`. O candidato isolado foi compilado pela Vercel no projeto `mentoria-ia`, com `--prod --skip-domain`. A atribuição manual do domínio principal foi verificada pela API de aliases.

| Host | Deployment após a publicação |
| --- | --- |
| neuralhub.ia.br | dpl_57QwU23i3Bay5vfuhnMWUUcpmPpE |
| mentoria.neuralhub.ia.br | dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn (versão anterior) |

Em produção, a raiz redirecionou à home AI-First, e a assinatura WebP servida correspondeu byte a byte à versão revisada. As 12 telas foram abertas em navegador real nas larguras 390 e 1366 px, aguardando o CSS externo e as fontes. Todas carregaram sem exceções JavaScript ou rolagem horizontal. Também foram repetidos os fluxos de navegação, checklist (gravação remota interceptada), impressão e tarefas do guia. O relatório visual usa as capturas do domínio publicado.

A publicação foi feita pela CLI da Vercel. As alterações de código seguem locais, ainda sem commit ou push.

## Correção da home institucional após a revisão visual

A faixa abaixo da abertura voltou a exibir as 14 organizações do componente original, na ordem registrada. O visitante pode pausar e retomar o movimento. A lista é estática com movimento reduzido ou JavaScript desativado. A arte original de “O abismo entre intenção e execução” voltou à seção anterior ao método, com composição vertical até 900 px e transcrição HTML.

O exemplo comercial agora permite percorrer o e-mail solicitando 40 luminárias, os dados extraídos pela IA e a decisão do vendedor. As formações exibem carga horária, modalidade, atividades e os destinos comerciais existentes. As duas fotos das turmas vêm do acervo da Neural Hub. A luminária e a estação de engenharia são imagens ilustrativas.

O candidato isolado diferiu da publicação anterior somente no HTML, no CSS e nas seis imagens da home. A comparação dos oito arquivos servidos no domínio com os respectivos arquivos de origem foi exata. Em 12/11/2026, a Vercel registrou o domínio principal em `dpl_FgvwiyJFM3Neb555SyP1VMSpPjTb` e a Mentoria em `dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn`.

Em Chrome, a versão local, a cópia offline do kit e o domínio publicado passaram nas larguras de 320, 390, 768, 900, 901 e 1440 px. Foram conferidos os nomes das 14 organizações, rotação contínua, pausa, teclas do controle de etapas, legibilidade das artes, links dos três programas e largura do documento. O teste de regressão em produção cobriu navegação da home, checklist com gravação remota simulada, guia BMAD e cinco controles de isolamento na Mentoria.

Node 24.21.0 e npm 11.19.0. Typecheck, os 127 testes e o build passaram. O lint global continua com 158 erros nos seis arquivos gerados de `bmadguide/dist` e `bmadguide/output`. A captura pública dos dois blocos revisados está em `outputs/identidade-dominio-principal/comercial-e-formacao.jpg`. O ZIP do kit contém a página offline e seus arquivos atualizados.

## Revisão da cotação ilustrativa e da imagem do método

A revisão do usuário retirou a simulação de cotação de luminárias da home e do kit. O método passou a apresentar o diagnóstico, as regras, a construção e o acompanhamento em uma sequência gráfica, horizontal acima de 860 px e vertical nas telas menores. As formações vêm em seguida. A captura atual do método fica em `outputs/identidade-dominio-principal/metodo-ai-first.jpg`. A captura anterior da seção comercial é histórica.

A home e o CSS publicados conferiram byte a byte com os arquivos revisados. A API da Vercel confirmou `dpl_89buEfaR3VsTBrnUs4K5kjWTFbhT` em `neuralhub.ia.br` e `dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn` na Mentoria. O navegador verificou o candidato local, a página offline do kit e o domínio publicado em 320, 390, 768, 860, 861, 1024 e 1440 px. As verificações cobriram a ordem de leitura das etapas, a direção da linha, a ausência das duas imagens na home, a transição às formações, a faixa de empresas e a seção do abismo.

Node 24.21.0 e npm 11.19.0. Typecheck, 127 testes e build passaram. O lint registrou os 158 erros preexistentes nos seis arquivos gerados do guia BMAD.

## Ampliação da faixa de empresas treinadas

A lista passou de 14 para 21 empresas com a inclusão de CEBRABORTE, Grupo BREITKOPF, Recicla Mais, Osklen, Central Farma, ORSEGUPS e Grupo Mercúrio. O ciclo da animação passou a 48 segundos para acomodar a lista maior. A versão offline e o ZIP do kit também foram atualizados.

A API da Vercel confirmou o deployment `dpl_5UFrwzGvQ4d7aftfkS4eTnC6W3pA` em `neuralhub.ia.br` e `dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn` na Mentoria. O HTML e o CSS publicados conferiram byte a byte com o candidato. Em Chrome nas larguras de 320, 390, 768, 900, 901 e 1440 px, a lista incluiu os 21 nomes na ordem esperada. Os sete novos nomes entraram integralmente na janela durante a animação. Também foram conferidos a pausa, a retomada e o acesso aos 21 nomes com movimento reduzido e JavaScript desativado.

Node 24.21.0 e npm 11.19.0. Typecheck, 127 testes e build passaram. O lint continuou com os 158 erros preexistentes nos seis arquivos gerados do guia BMAD.

## Método interativo e ementas

O deployment `dpl_DQ9xw17rxPJ3FkwFSQEQbHd9KjQY` foi atribuído somente a `neuralhub.ia.br`. A página oferece quatro etapas do método, cada uma com a pergunta trabalhada e a decisão da equipe. A linha se movimenta em tela, pode ser pausada, permite a seleção manual e termina ao concluir as quatro etapas. Com movimento reduzido a seleção é manual. As ementas detalham a prática de cada formação. A página pública da mentoria confirmou dois encontros ao vivo por semana e carga mínima de 40 horas. O kit offline foi sincronizado.

Chrome no candidato local, na cópia offline e no domínio publicado verificou seleção por teclado, pausa, reprodução e fim da sequência, sem movimento, sem JavaScript e as três ementas expansíveis, nas larguras de 320, 390, 860, 861 e 1440 px. Typecheck, 127 testes e build passaram. O lint global manteve os 158 erros nos seis arquivos gerados do guia BMAD. A Mentoria permaneceu no deployment `dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn`.

## Aulão de 19/11/2026, cadastro próprio e Pixel Meta

A landing page está publicada em `/aulao`, com vídeo de aproximadamente 40 segundos extraído do convite de André a partir de 48,38 s do material enviado. O formulário exige nome, e-mail e WhatsApp. O endpoint `/api/aulao-inscricao` envia os dados diretamente ao Apps Script da conta `mentoria.ia.001@gmail.com`, que grava na aba `Inscrições da LP` da planilha `14uxsVX1BUNziDXSgue4GyB3VhuaF5yhv-Ib2vYQyfmg`. O navegador recebe um redirecionamento 303 depois da confirmação e exibe o convite informado pelo usuário em `/aulao/obrigado`. A conta PulseMind e o Google Forms não fazem parte do fluxo publicado.

O Pixel 1686311939885333 está nas duas páginas. Um comprovante temporário emitido após a confirmação da gravação autoriza o disparo de Lead. Seu identificador é opaco. O comprovante é consumido no agradecimento; o navegador também registra localmente a conversão para evitar uma nova contagem em um reenvio. O teste no domínio principal verificou um Lead após um envio válido e zero ao acessar o agradecimento diretamente, ao recarregar, ao repetir o cadastro no mesmo navegador ou ao enviar dados inválidos. Em Chrome com a biblioteca real da Meta, PageView e Lead produziram requisições de rede com o Pixel correto. As chamadas de teste foram interceptadas para evitar contabilizar conversões fictícias. A atribuição a um anúncio real no painel da Meta é separada desta prova.

O deployment `dpl_4ZCqKqGEtg1Wm2rsp6usCpABRpbw` foi atribuído ao domínio principal. A Mentoria permaneceu em `dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn`. Typecheck, 127 testes e build passaram com Node 24.21.0 e npm 11.19.0. O lint global continuou a apontar os 158 erros do guia BMAD. A captura pública está em `outputs/identidade-dominio-principal/landing-aulao.jpg`. As verificações reais usaram apenas dados sintéticos com e-mails em `example.invalid`.

## Landing do aulão com turmas, depoimentos e entrevista

Na revisão da campanha de 19/11, o hero de /aulao passa a usar a cidade do anúncio. Há 21 organizações identificadas, três fotos de turmas do acervo da mentoria, os dois relatos originais, o convite de André e o vídeo legendado de 93,4 s fornecido pelo organizador. As duas falas destacadas foram retiradas dos vídeos publicados na mentoria. Fotos e depoimentos identificam formações anteriores. A cópia pública da entrevista tem o SHA-256 do arquivo enviado (998f5147f99b738ebc283d972810f97f3c8d0ed8d9c91bfe3c20d117389ce645). Os MP4 são carregados ao acionar o player, que também tem acesso direto e controles de teclado.

Em produção, verificamos em Chrome as larguras de 320, 390 e 1440 px, o carregamento das imagens, a reprodução dos quatro vídeos e o retorno de foco ao fechar o player. Um cadastro técnico com o endereço sintético já usado chegou ao agradecimento e ao convite de WhatsApp. A simulação de tráfego do pixel durante os testes evitou enviar conversões técnicas à Meta. Os 30 arquivos foram comparados por hash com o domínio e os quatro vídeos responderam com HTTP 206 a pedidos por intervalo.

Node 24.21.0 e npm 11.19.0. Typecheck, 127 testes, build, lint dos arquivos JS alterados e contratos da inscrição passaram. O lint global aponta os 158 erros preexistentes nos seis arquivos gerados do guia BMAD. A API agora verifica o tipo da resposta do Sheets antes de ler seus campos e aceita as duas versões de confirmação já em uso. Publicação isolada no deployment dpl_4iV7KxaGbn5gJXYKvjuEyXdPBYS6, apenas com o alias neuralhub.ia.br. O alias da mentoria continua em dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn. Evidências em outputs/identidade-dominio-principal/aulao-cidade-desktop.jpg, aulao-cidade-celular.jpg e aulao-turmas.jpg.

## 14/11/2026 — Guia de marca na Mentoria

A pedido do usuário, a rota pública `mentoria.neuralhub.ia.br/brand` também recebeu a identidade institucional. O guia estático inclui a logo original sobre grafite e marfim, arquivos para download, o posicionamento AI-First, aplicações da paleta e os componentes da Mentoria. As duas variações da assinatura e o símbolo publicados são idênticos aos arquivos originais em `public/identidade-neuralhub`.

A base isolada reproduziu os hashes dos 1.602 arquivos de origem da publicação anterior da Mentoria. O candidato alterou apenas `brand.html` e acrescentou os recursos visuais e fontes do guia. O alias da Mentoria passou de `dpl_AdAr9NTMUJs4rj8ErtdquMcJwrLn` para `dpl_2EADVkvi7iuKujsHu7ZtsN6VNbpA`. Em produção, Chrome validou a navegação e os três downloads em 320, 390 e 1440 px. A home, plataforma, proposta, blog, página Neural Hub e privacidade da Mentoria retornaram os mesmos bytes antes e depois da publicação, assim como a home e o guia do domínio principal.

Node 24.21.0 e npm 11.19.0. Typecheck, 127 testes e build aprovados. O lint global registrou 174 erros fora dos arquivos do guia, em artefatos de BMAD e de campanha.
