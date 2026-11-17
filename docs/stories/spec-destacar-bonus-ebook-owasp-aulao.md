---
title: 'Destacar o e-book OWASP como bônus da inscrição no aulão'
type: 'feature'
created: '2026-11-14'
status: 'done'
route: 'one-shot'
---

# Destacar o e-book OWASP como bônus da inscrição no aulão

## Intent

**Problema:** A página pública menciona o e-book somente no formulário e não apresenta seu mockup. O visitante pode não perceber que recebe o material ao se inscrever.

**Abordagem:** Destacar o presente na abertura, mostrar o mockup existente em uma seção própria e reforçar o benefício no formulário, fechamento e descrição social. O PDF continua disponível na confirmação pelo fluxo existente.

## Suggested Review Order

- Conferir a promessa e a apresentação do material antes da inscrição.
  [index.html:40](../../public/aulao/index.html#L40)
- Conferir o destino do CTA e o formulário existente.
  [index.html:76](../../public/aulao/index.html#L76)
- Conferir a composição responsiva e os estilos do bônus.
  [landing.css:60](../../public/aulao/landing.css#L60)

## Verificação local

- Node 24.20.0, npm 11.12.1; typecheck, 127 testes em 22 arquivos e build passaram.
- Lint global: 174 erros em nove arquivos preexistentes do guia BMAD e de `outputs/neuralhub-aulao-meta/src/`. Nenhum dos dois arquivos desta alteração é JavaScript.
- Chrome: conferência visual desktop e celular; sem overflow horizontal em 320, 390, 768 e 1440 px. Mockup carregado; links da abertura e do bônus direcionam às âncoras corretas.
- Candidato compilado: HTML e CSS idênticos às fontes por `cmp`. Mockup e ambos os PDFs retornam HTTP 200. Mensagem de entrega usa margem de 12 px e cor esperada após correção de especificidade.
- Comparação dos formulários anterior e atual: action, method, campos e atributos de validação idênticos. Nenhuma inscrição enviada; backend e conversão não foram alterados.
- Revisão independente: três ajustes aplicados (descrição social, reforço no fechamento, especificidade CSS); sete sugestões opcionais descartadas por não serem necessárias à solicitação. Nenhum item preexistente novo identificado por essa revisão.
- Logs e cópias anteriores em `outputs/aulao-bonus-owasp/`.

## Publicação

Autorizada pelo usuário em 14/11/2026. Deployment `dpl_J66ZAbghVfNW348LW2DFtsDt8kCD`, estado READY, atribuído a `neuralhub.ia.br`. A base foi o deployment vigente `dpl_B9GEocqJ3VY7eFH9rR3YsXwKkgiE`; comparação completa de 1.650 arquivos de fonte confirmou mudanças somente em `public/aulao/index.html` e `public/aulao/landing.css`. Os demais arquivos foram reutilizados pelos respectivos SHA-1. Nenhum commit ou push foi executado.

Chrome no domínio oficial verificou o destaque, mockup carregado e ausência de overflow em 1440 e 390 px. O CTA do bônus levou ao formulário visível em `#inscricao`. HTML, CSS, mockup e ambos os PDFs retornaram HTTP 200 e conferiram byte a byte com os arquivos locais; resultados e SHA-256 em `outputs/aulao-bonus-owasp/production-verification.json`. A consulta de logs do novo deployment não retornou erros/fatal no intervalo inspecionado de 15 minutos; isso não comprova o fluxo completo de cadastro, que não foi reenviado nesta tarefa. O alias `mentoria.neuralhub.ia.br` permaneceu em `dpl_2EADVkvi7iuKujsHu7ZtsN6VNbpA`.
