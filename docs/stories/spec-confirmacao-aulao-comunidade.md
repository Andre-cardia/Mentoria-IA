---
title: 'Confirmação do aulão com convite visual para a comunidade'
type: 'feature'
created: '2026-11-14'
status: 'done'
route: 'one-shot'
---

# Confirmação do aulão com convite visual para a comunidade

## Intent

**Problema:** A página `/aulao/obrigado` apresenta a confirmação, os PDFs e o grupo apenas como texto e links. O pedido é enriquecer a apresentação com o mockup do e-book e uma imagem épica que incentive o inscrito a entrar no grupo da mentoria.

**Abordagem:** Dar destaque ao WhatsApp com arte cinematográfica de um grupo caminhando para um portal de IA, mantendo a identidade Neural Hub; apresentar o mockup real e as edições clara/escura do livro em uma seção própria. Base: [entrega existente do e-book](2026-11-14-ebook-aulao.md). Preservar URLs, data do evento e scripts de conversão. Escopo restrito à confirmação pública, CSS próprio e três imagens WebP.

## Ordem sugerida de revisão

1. [Página de confirmação](../../public/aulao/obrigado.html) — hierarquia, convites para o grupo, evento e downloads.
2. [Estilos isolados](../../public/aulao/obrigado.css) — adaptação mobile, contraste e foco.
3. [Evidências e limitações](../../artifacts/aulao-confirmacao/verificacao.md) — browser, gates, revisão e origem das imagens.
4. [Prompt integral da arte](../../artifacts/aulao-confirmacao/imagem-prompt.txt) — geração integrada com `image_gen`.

Publicação autorizada pelo usuário em 14/11/2026 e concluída no deployment `dpl_B9GEocqJ3VY7eFH9rR3YsXwKkgiE`, somente no alias `neuralhub.ia.br`. Chrome conferiu desktop e mobile e sete arquivos públicos coincidiram por SHA-256 com os aprovados. Gates e limitações estão na evidência. Não há chave desta tarefa pontual em `sprint-status.yaml`; os status das epics existentes foram preservados.
