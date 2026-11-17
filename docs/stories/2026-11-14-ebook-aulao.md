# E-book OWASP no aulão da Mentoria Zero to Hero

O cadastro do aulão apresenta o e-book como material para o inscrito. A confirmação oferece o download do PDF de 75 páginas e o convite para o grupo de WhatsApp. O formulário e o registro de conversão usam o fluxo existente.

## Conferência local

O Chrome abriu as páginas compiladas em larguras de 390 e 1250 px. Um envio com resposta de cadastro simulada levou à confirmação, com o convite de WhatsApp e download de um PDF idêntico ao livro entregue. A compilação e a verificação de tipos passaram. A checagem geral de estilo apontou 160 erros fora dos arquivos alterados. A segunda execução de testes passou em 126 de 127 casos, com um tempo excedido no painel administrativo de leads.

## Publicação e conferência em produção

Em 14/11/2026, o domínio neuralhub.ia.br recebeu o deployment dpl_AvxYXPcNgTxf9fSFN3apYDfwmVpm, preparado a partir do arquivo de fontes do deployment em uso. Foram alteradas as duas páginas e incluído o PDF. No Chrome, ambas as páginas responderam HTTP 200. O botão de download entregou o PDF de 9.645.311 bytes com SHA-256 6a799d9c69e1b11ccfc3e06ef03eed810f4f05d6d5b4602c53bfe7f7ce8bc876. O botão do grupo abriu o convite oficial “Aulão da Mentoria Zero to Hero” com opções para o aplicativo e o WhatsApp Web.

## Revisão ilustrada e edição de leitura clara

O download em produção oferece as edições escura e clara de 81 páginas. O Chrome baixou os dois PDFs pelos botões da confirmação e os arquivos conferiram por SHA-256 com os originais. As páginas 4 e 81 identificam o evento como on-line e ao vivo e incluem a foto da turma. Os 14 capítulos contêm 33 diagramas. As páginas 11, 14, 17 e 28 trazem fichas ou exemplos resolvidos dos quatro primeiros capítulos. Deployment do domínio principal: dpl_2S126Abb1mphzmYRZ1XZi9psarzC.

## Destaque do bônus na página de inscrição — candidato local

Em 14/11, a página publicada foi novamente inspecionada: a menção ao e-book existia apenas no formulário, sem mockup. O candidato local acrescenta a chamada na abertura, uma seção com o mockup existente, os números de páginas/capítulos e as duas edições; reforça o benefício no formulário, fechamento e metadados. Verificação e revisão registradas em [spec-destacar-bonus-ebook-owasp-aulao.md](spec-destacar-bonus-ebook-owasp-aulao.md). Esta alteração ainda não foi publicada.

Após autorização explícita do usuário, a alteração foi publicada em `neuralhub.ia.br` no deployment `dpl_J66ZAbghVfNW348LW2DFtsDt8kCD`. A comparação da fonte do deployment confirmou apenas o HTML e o CSS da landing alterados. Chrome em 1440 e 390 px confirmou o bônus e o mockup, sem overflow; o botão direcionou à inscrição. HTML, CSS, mockup e PDFs foram verificados por HTTP 200 e comparação byte a byte com os arquivos locais. Evidência em `outputs/aulao-bonus-owasp/production-verification.json`.
