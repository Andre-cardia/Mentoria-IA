# Roteiro do gerenciador de tarefas

Edição Neural Hub. Referências conferidas em 13/10/2026. Exemplo didático; não é um registro de execução real do BMAD.

## V6.12 estável

### 1. Descoberta
Nosso projeto ilustrativo ajuda uma pessoa a organizar o próprio trabalho. Começamos pelo problema e limitamos o primeiro escopo.

#### Escreva o objetivo
O usuário quer visualizar o que precisa fazer, entender o que está em andamento e identificar o que já concluiu. O MVP precisa funcionar em um único navegador e exigir poucos passos para registrar uma tarefa.

```text
bmad-product-brief Crie um brief para um gerenciador de tarefas individual. Público: profissionais autônomos. Objetivo: registrar, priorizar e acompanhar tarefas. Sem equipes, cobrança ou sincronização no MVP.
```

#### Teste as premissas
Converse com usuários, observe como organizam o trabalho hoje e documente dificuldades recorrentes. Separe evidência de hipótese: o exemplo não representa pesquisa real com clientes.

#### Delimite o primeiro escopo
Incluímos título, descrição, prioridade e três estados. Deixamos login, compartilhamento, anexos, calendário e notificações para uma evolução posterior.

```text
ENTRA: criar, editar, concluir, filtrar e remover tarefas.
FICA FORA: login, equipes, nuvem, anexos e notificações.
```

Revisar:
- Problema e público estão explícitos
- Hipóteses foram separadas de evidências
- Escopo e exclusões foram registrados

### 2. Requisitos
Para este MVP, podemos usar um épico apoiado em SPEC.md. Na v6.12, bmad-spec pode gerar Story Breakdown e stories.yaml; o caminho com PRD usa outras skills.

#### Defina critérios de aceite
Uma criação válida precisa de título. A tarefa entra em A fazer, recebe a prioridade escolhida e permanece disponível após recarregar. Um título vazio produz uma mensagem de erro junto do campo.

```text
bmad-spec Especifique um MVP local de tarefas. A criação exige título não vazio; a tarefa começa em A fazer; a prioridade é baixa, média ou alta; os dados persistem após recarregar. Inclua critérios de aceite.
```

#### Peça Story Breakdown
Para um único épico apoiado em SPEC.md, peça a bmad-spec a divisão em histórias. stories.yaml acompanha este caminho; não é necessário criar sprint-status.yaml para ele.

```text
bmad-spec Faça Story Breakdown do épico do gerenciador de tarefas. Ordene as histórias em stories.yaml e explicite dependências e critérios de aceite.
```

#### Revise estados e exceções
Inclua uma lista vazia, nenhuma correspondência no filtro, título composto apenas de espaços e dados locais indisponíveis. A remoção deve permitir desfazer enquanto a página estiver aberta.

Revisar:
- Cada requisito pode ser verificado
- Tickets estão ordenados por dependências
- Nenhuma função fora do MVP entrou no plano

### 3. Design & arquitetura
A demonstração usa HTML, CSS e JavaScript, com armazenamento no navegador. Um projeto com usuários reais e sincronização exigiria novas decisões de arquitetura.

#### Registre o modelo de dados
Cada tarefa tem um identificador, título, descrição, prioridade, estado e data de criação. A interface apresenta três colunas; alterações no estado usam um controle acessível por teclado.

```text
{
  "id": "identificador-unico",
  "title": "Revisar a especificação",
  "description": "Conferir critérios de aceite",
  "priority": "alta",
  "status": "todo",
  "createdAt": "2026-10-13T12:00:00.000Z"
}
```

#### Descreva a experiência
No desktop, o quadro tem três colunas. No celular, elas se empilham. O formulário marca campos obrigatórios, o diálogo controla o foco e os filtros exibem uma mensagem quando não há resultados.

```text
bmad-ux Defina a experiência do quadro de tarefas. Inclua formulário, edição, mudança de estado, busca, filtros, estado vazio e navegação por teclado.
```

#### Escolha e documente os limites
A persistência local permite experimentar sem uma conta. Ela não sincroniza entre dispositivos e depende do navegador. Registre essa limitação antes de considerar o aplicativo pronto para um uso mais amplo.

```text
bmad-architecture Documente o MVP local em HTML, CSS e JavaScript. Defina persistência no navegador e tratamento de falhas. Exclua autenticação e colaboração desta arquitetura.
```

Revisar:
- Modelo de dados está claro
- Comportamentos e estados foram definidos
- Limites da persistência local estão documentados

### 4. Desenvolvimento
Cada sessão parte de uma intenção ou ticket e usa as decisões anteriores. O exemplo abaixo pede uma mudança delimitada, com resultados observáveis.

#### Comece pelo primeiro ticket
Em um novo chat da ferramenta de IA, indique a história e os documentos relevantes. Build investiga o projeto antes de decidir qual plano é necessário.

```text
bmad-build Implemente o ticket de criação de tarefas. Consulte a especificação e as decisões de experiência. Valide título obrigatório, prioridade inicial e persistência local.
```

#### Confira o resultado em execução
Crie uma tarefa, altere sua prioridade, recarregue e confira os dados. Avalie também teclado, foco visível e o comportamento em celular. Corrija problemas pertencentes à mudança antes de continuar.

#### Acompanhe a história e o aceite
Para o épico baseado em spec, use stories.yaml e o registro de implementação. Para um projeto com PRD, bmad-sprint-planning apresenta o status do sprint e orienta a próxima ação. Valide antes de considerar concluído.

```text
bmad-help Confira os artefatos do gerenciador de tarefas e indique a próxima ação após revisar esta história.
```

Revisar:
- Mudança corresponde à história
- Verificação cobre comportamento real
- Registro e aceite refletem as evidências

### 5. Testes & revisão
Testar uma função isolada não prova a jornada completa. Combine verificações de regras com testes de criação, edição, filtros e persistência.

#### Cubra os critérios de aceite
Valide título obrigatório e valores de prioridade. Nos testes de jornada, crie uma tarefa, mova para Concluído e recarregue. O resultado deve permanecer visível no estado correto.

```text
bmad-qa-generate-e2e-tests Gere testes para a criação, edição, filtros, mudança de estado e persistência das tarefas. Inclua título vazio, busca sem resultado e navegação por teclado.
```

#### Revise o código e os limites
Confira validação, manipulação de texto do usuário, falhas de armazenamento e comportamento em telas pequenas. Separe defeitos da mudança de problemas preexistentes e ideias futuras.

```text
bmad-code-review Revise as mudanças do gerenciador de tarefas e confira os caminhos de erro e os critérios de aceite.
```

#### Avalie o épico integrado
A edição deve preservar o estado, os filtros precisam responder à mudança de prioridade e uma remoção não pode corromper as outras tarefas. Feche o épico com as evidências disponíveis.

```text
bmad-retrospective Avalie o épico do gerenciador de tarefas contra a especificação e os resultados de verificação. Registre pendências e o que pode ser aceito.
```

Revisar:
- Jornadas essenciais foram executadas
- Estados vazios e erros foram verificados
- Integração entre tickets foi conferida

### 6. Entrega & evolução
Esta demonstração é um aplicativo local no navegador. Uma versão com nuvem e múltiplos usuários precisaria de autenticação, backend, sincronização e novas verificações.

#### Faça a revisão humana final
Percorra a jornada principal e confira as restrições. Verifique a interface, o texto, a persistência e os arquivos entregues. Use walkthrough se quiser uma revisão guiada.

```text
bmad-walkthrough Revise comigo a implementação do gerenciador de tarefas, explicando as decisões e os comportamentos essenciais.
```

#### Prepare a publicação
Para um aplicativo estático, publique HTML, CSS, JavaScript e recursos. Confira a rota inicial, os links e os arquivos. Se houver backend, inclua a verificação de dados e configurações da hospedagem.

#### Planeje a próxima melhoria
Caso o usuário precise usar vários dispositivos, abra uma iniciativa de sincronização. Não acrescente um backend sem decidir identidade, propriedade dos dados e estratégia de migração.

```text
bmad-help Quero evoluir o gerenciador local para uso entre dispositivos. Ajude a definir o próximo escopo e as decisões necessárias.
```

Revisar:
- Entrega tem critérios de aceite atendidos
- Limitações estão visíveis
- Próximo trabalho tem uma intenção própria

## V7 prévia

### 1. Descoberta
Nosso projeto ilustrativo ajuda uma pessoa a organizar o próprio trabalho. Começamos pelo problema e limitamos o primeiro escopo.

#### Escreva o objetivo
O usuário quer visualizar o que precisa fazer, entender o que está em andamento e identificar o que já concluiu. O MVP precisa funcionar em um único navegador e exigir poucos passos para registrar uma tarefa.

```text
bmad-product-brief Crie um brief para um gerenciador de tarefas individual. Público: profissionais autônomos. Objetivo: registrar, priorizar e acompanhar tarefas. Sem equipes, cobrança ou sincronização no MVP.
```

#### Teste as premissas
Converse com usuários, observe como organizam o trabalho hoje e documente dificuldades recorrentes. Separe evidência de hipótese: o exemplo não representa pesquisa real com clientes.

#### Delimite o primeiro escopo
Incluímos título, descrição, prioridade e três estados. Deixamos login, compartilhamento, anexos, calendário e notificações para uma evolução posterior.

```text
ENTRA: criar, editar, concluir, filtrar e remover tarefas.
FICA FORA: login, equipes, nuvem, anexos e notificações.
```

Revisar:
- Problema e público estão explícitos
- Hipóteses foram separadas de evidências
- Escopo e exclusões foram registrados

### 2. Requisitos
A intenção já está clara. Para este MVP individual, uma especificação curta é suficiente; um PRD pode ser acrescentado quando outras pessoas precisarem alinhar o produto.

#### Defina critérios de aceite
Uma criação válida precisa de título. A tarefa entra em A fazer, recebe a prioridade escolhida e permanece disponível após recarregar. Um título vazio produz uma mensagem de erro junto do campo.

```text
bmad-spec Especifique um MVP local de tarefas. A criação exige título não vazio; a tarefa começa em A fazer; a prioridade é baixa, média ou alta; os dados persistem após recarregar. Inclua critérios de aceite.
```

#### Divida o épico em tickets
Primeiro estabeleça o modelo e a persistência, depois criação e edição, em seguida estados, filtros e remoção. Cada ticket deve caber em uma sessão de implementação.

```text
bmad-ticket Planeje o épico do gerenciador de tarefas a partir da especificação. Ordene as histórias e marque dependências e pontos de revisão humana.
```

#### Revise estados e exceções
Inclua uma lista vazia, nenhuma correspondência no filtro, título composto apenas de espaços e dados locais indisponíveis. A remoção deve permitir desfazer enquanto a página estiver aberta.

Revisar:
- Cada requisito pode ser verificado
- Tickets estão ordenados por dependências
- Nenhuma função fora do MVP entrou no plano

### 3. Design & arquitetura
A demonstração usa HTML, CSS e JavaScript, com armazenamento no navegador. Um projeto com usuários reais e sincronização exigiria novas decisões de arquitetura.

#### Registre o modelo de dados
Cada tarefa tem um identificador, título, descrição, prioridade, estado e data de criação. A interface apresenta três colunas; alterações no estado usam um controle acessível por teclado.

```text
{
  "id": "identificador-unico",
  "title": "Revisar a especificação",
  "description": "Conferir critérios de aceite",
  "priority": "alta",
  "status": "todo",
  "createdAt": "2026-10-13T12:00:00.000Z"
}
```

#### Descreva a experiência
No desktop, o quadro tem três colunas. No celular, elas se empilham. O formulário marca campos obrigatórios, o diálogo controla o foco e os filtros exibem uma mensagem quando não há resultados.

```text
bmad-ux Defina a experiência do quadro de tarefas. Inclua formulário, edição, mudança de estado, busca, filtros, estado vazio e navegação por teclado.
```

#### Escolha e documente os limites
A persistência local permite experimentar sem uma conta. Ela não sincroniza entre dispositivos e depende do navegador. Registre essa limitação antes de considerar o aplicativo pronto para um uso mais amplo.

```text
bmad-architecture Documente o MVP local em HTML, CSS e JavaScript. Defina persistência no navegador e tratamento de falhas. Exclua autenticação e colaboração desta arquitetura.
```

Revisar:
- Modelo de dados está claro
- Comportamentos e estados foram definidos
- Limites da persistência local estão documentados

### 4. Desenvolvimento
Cada sessão parte de uma intenção ou ticket e usa as decisões anteriores. O exemplo abaixo pede uma mudança delimitada, com resultados observáveis.

#### Comece pelo primeiro ticket
Em um novo chat da ferramenta de IA, indique a história e os documentos relevantes. Build investiga o projeto antes de decidir qual plano é necessário.

```text
bmad-build Implemente o ticket de criação de tarefas. Consulte a especificação e as decisões de experiência. Valide título obrigatório, prioridade inicial e persistência local.
```

#### Confira o resultado em execução
Crie uma tarefa, altere sua prioridade, recarregue e confira os dados. Avalie também teclado, foco visível e o comportamento em celular. Corrija problemas pertencentes à mudança antes de continuar.

#### Acompanhe o status corretamente
O plano fica em built ao término de Build. Confira a entrega e use bmad-ticket para registrar o aceite. Repita o processo para edição, estados, filtros e remoção.

```text
bmad-ticket Confira o resultado do ticket de criação de tarefas e registre o aceite quando os critérios e as evidências estiverem completos.
```

Revisar:
- Mudança corresponde ao ticket
- Verificação cobre comportamento real
- Aceite foi revisado além do status built

### 5. Testes & revisão
Testar uma função isolada não prova a jornada completa. Combine verificações de regras com testes de criação, edição, filtros e persistência.

#### Cubra os critérios de aceite
Valide título obrigatório e valores de prioridade. Nos testes de jornada, crie uma tarefa, mova para Concluído e recarregue. O resultado deve permanecer visível no estado correto.

```text
bmad-qa-generate-e2e-tests Gere testes para a criação, edição, filtros, mudança de estado e persistência das tarefas. Inclua título vazio, busca sem resultado e navegação por teclado.
```

#### Revise o código e os limites
Confira validação, manipulação de texto do usuário, falhas de armazenamento e comportamento em telas pequenas. Separe defeitos da mudança de problemas preexistentes e ideias futuras.

```text
bmad-code-review Revise as mudanças do gerenciador de tarefas e confira os caminhos de erro e os critérios de aceite.
```

#### Avalie o épico integrado
A edição deve preservar o estado, os filtros precisam responder à mudança de prioridade e uma remoção não pode corromper as outras tarefas. Feche o épico com as evidências disponíveis.

```text
bmad-retrospective Avalie o épico do gerenciador de tarefas contra a especificação e os resultados de verificação. Registre pendências e o que pode ser aceito.
```

Revisar:
- Jornadas essenciais foram executadas
- Estados vazios e erros foram verificados
- Integração entre tickets foi conferida

### 6. Entrega & evolução
Esta demonstração é um aplicativo local no navegador. Uma versão com nuvem e múltiplos usuários precisaria de autenticação, backend, sincronização e novas verificações.

#### Faça a revisão humana final
Percorra a jornada principal e confira as restrições. Verifique a interface, o texto, a persistência e os arquivos entregues. Use walkthrough se quiser uma revisão guiada.

```text
bmad-walkthrough Revise comigo a implementação do gerenciador de tarefas, explicando as decisões e os comportamentos essenciais.
```

#### Prepare a publicação
Para um aplicativo estático, publique HTML, CSS, JavaScript e recursos. Confira a rota inicial, os links e os arquivos. Se houver backend, inclua a verificação de dados e configurações da hospedagem.

#### Planeje a próxima melhoria
Caso o usuário precise usar vários dispositivos, abra uma iniciativa de sincronização. Não acrescente um backend sem decidir identidade, propriedade dos dados e estratégia de migração.

```text
bmad Quero evoluir o gerenciador local para uso entre dispositivos. Ajude a definir a próxima iniciativa, as decisões necessárias e o primeiro épico.
```

Revisar:
- Entrega tem critérios de aceite atendidos
- Limitações estão visíveis
- Próximo trabalho tem uma intenção própria

Fontes: https://github.com/bmad-code-org/BMAD-METHOD/tree/V6.12 e https://docs.bmad-method.org/
