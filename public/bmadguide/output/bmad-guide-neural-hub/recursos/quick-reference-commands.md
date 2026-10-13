# Quick Reference Commands

Referência da captura enviada à Neural Hub em 13/10/2026. Os nove comandos foram preservados; os títulos e comentários estão em português.

Use estes pedidos na conversa com seu agente de IA. A captura não informa a versão do BMAD; os nomes dos fluxos dependem da instalação. Consulte a lista de skills do guia para v6.12 e v7.

## Entrada universal — conforme a captura

```text
bmad analyst workflow-status
```

## Fase 2: Planejamento

```text
bmad pm plan-project
```

## Fase 3: Solução — níveis 3 e 4

```text
bmad architect solution-architecture
bmad architect tech-spec # Por épico, no momento necessário
```

## Fase 4: Implementação

```text
bmad sm create-story # Elaborar história
bmad sm story-ready # Aprovar para desenvolvimento
bmad sm story-context # Gerar contexto
bmad dev dev-story # Implementar
bmad dev story-approved # Marcar como concluída
```

Consulte as instruções atuais de invocação e os menus dos agentes na [documentação v6.12](https://github.com/bmad-code-org/BMAD-METHOD/blob/V6.12/docs/reference/skills-and-agents.md) ou na [documentação v7](https://docs.bmad-method.org/reference/skills-and-agents/).
