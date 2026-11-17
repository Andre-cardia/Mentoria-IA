/* Exploração educativa local. Não executa modelos nem representa telemetria. */
(() => {
  "use strict";
  const document = globalThis.document;
  const $ = (id) => document.getElementById(id);
  const sources = {
    astra: "https://openai.com/index/gpt-6-astra/",
    api: "https://developers.openai.com/api/docs/models/gpt-6-astra",
    deepseek: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash",
    config:
      "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/config.json",
    encoding:
      "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash/blob/main/encoding/README.md",
  };
  const state = { model: "astra", view: "journey", step: 0 };
  const names = { astra: "GPT-6 Astra", deepseek: "DeepSeek V4.1 Flash" };
  const number = new Intl.NumberFormat("pt-BR");
  const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const node = (title, kind, text, chips, source) => ({
    title,
    kind,
    text,
    chips,
    source,
  });
  const generic = (title, text, chips) =>
    node(title, "ESQUEMA DIDÁTICO", text, chips);

  function journey() {
    const deep = state.model === "deepseek";
    const own = $("hosting").value === "own";
    const steps = [
      generic(
        "Entrada e contexto",
        "A aplicação organiza sua pergunta, instruções e histórico. Documentos recuperados por uma busca podem compor esse contexto. O modelo recebe o material que a aplicação envia; seus arquivos não ficam automaticamente disponíveis.",
        ["Pergunta", "Instruções", "Histórico"],
      ),
      generic(
        "Gateway e fila",
        own
          ? "Seu serviço valida a requisição, aplica limites e organiza a fila de processamento no cluster que você administra. Autenticação, escalonamento e operação ficam sob responsabilidade da sua infraestrutura."
          : "A requisição passa pela interface do provedor. Autenticação e limites de uso controlam a entrada. Filas e distribuição de trabalho são componentes usuais de um serviço de inferência; sua implementação exata varia por provedor.",
        ["Aplicação", "API", "Fila"],
      ),
      node(
        "Codificação",
        deep ? "FORMATO DOCUMENTADO" : "ESQUEMA DIDÁTICO",
        deep
          ? "O formato público do DeepSeek organiza papéis da conversa, imagens e chamadas de ferramentas. O modo de raciocínio aceita orçamento inteiro de 1 a 100. A codificação produz a entrada que será processada pelo modelo."
          : "Um tokenizer transforma texto em identificadores numéricos. Embeddings representam as unidades de entrada em vetores. Abaixo, as palavras são apenas uma ilustração; os limites dos tokens reais podem cortar ou agrupar palavras.",
        ["Texto", "IDs", "Vetores"],
        deep ? sources.encoding : undefined,
      ),
      node(
        "Prefill: ler o contexto",
        deep ? "ARQUITETURA PUBLICADA" : "ESQUEMA DIDÁTICO",
        deep
          ? "No DeepSeek, o encoder causal processa o contexto; o KV global do decoder é projetado a partir de seus estados finais. O modelo informa 8 bilhões de parâmetros ativos por token no prefill."
          : "Na leitura inicial, o serviço processa o contexto fornecido e prepara o estado necessário para continuar a geração. Comprimento do contexto, capacidade disponível e estratégias de cache afetam essa etapa. Os detalhes internos do Astra não foram divulgados nas fontes consultadas.",
        ["Contexto", "Processamento", "Estado de atenção"],
        deep ? sources.deepseek : undefined,
      ),
      node(
        "Decode: gerar a continuação",
        deep ? "ARQUITETURA PUBLICADA" : "ESQUEMA DIDÁTICO",
        deep
          ? "O DeepSeek gera texto autorregressivamente, com 16 bilhões de parâmetros ativos por token no decode. DSpark propõe blocos de continuação e os verifica para acelerar a geração."
          : "A geração produz uma continuação com base no contexto disponível. O esforço de raciocínio do Astra é configurável; esforço maior não corresponde a uma quantidade pública de camadas, loops ou GPUs. Nenhum raciocínio interno real é exibido nesta demonstração.",
        ["Estado atual", "Continuação", "Próximo passo"],
        deep ? sources.deepseek : sources.api,
      ),
    ];
    if ($("tools").checked)
      steps.push(
        generic(
          "Ciclo de ferramenta",
          "O modelo pode pedir uma consulta. A aplicação executa a ferramenta autorizada e devolve seu resultado como novo contexto. O modelo pode então continuar a geração. Este diagrama representa um ciclo de exemplo, não garante que toda pergunta use ferramentas.",
          ["Modelo → chamada", "Aplicação → execução", "Resultado → modelo"],
        ),
      );
    steps.push(
      generic(
        "Entrega e observação",
        "A aplicação apresenta a resposta, possivelmente em partes via streaming. Métricas operacionais permitem acompanhar erros, duração e uso de recursos. Logs devem ser definidos conforme a política de dados da aplicação.",
        ["Resposta", "Interface", "Métricas"],
      ),
    );
    return steps;
  }

  function architecture() {
    if (state.model === "astra")
      return [
        node(
          "Interface do modelo",
          "CAPACIDADE DOCUMENTADA",
          "O Astra é oferecido como serviço. A documentação descreve entradas, saídas e recursos acessíveis pela API. Isso permite integrar aplicações, mas não revela uma planta completa da rede neural.",
          ["Aplicação", "gpt-6-astra", "Resposta"],
          sources.api,
        ),
        generic(
          "Representações internas",
          "Vetores e transformações aprendidas são conceitos gerais de modelos neurais. Não há, nas fontes consultadas, configuração pública detalhando largura, número de camadas ou organização dos blocos do Astra.",
          ["Vetores · conceito", "Blocos internos · não divulgados"],
        ),
        generic(
          "Parâmetros e atenção",
          "Não atribuímos ao Astra contagem de parâmetros, roteamento de especialistas, layout de atenção ou número de GPUs. São informações necessárias para dimensionar uma execução própria e não estão disponíveis nas fontes consultadas.",
          ["Parâmetros: não divulgados", "Topologia: não divulgada"],
        ),
        node(
          "Esforço de raciocínio",
          "CAPACIDADE DOCUMENTADA",
          "A ficha da API permite selecionar low, medium, high, xhigh e max. Esses níveis expressam esforço de raciocínio e não demonstram o uso de uma arquitetura de profundidade recorrente.",
          ["low", "medium", "high", "xhigh", "max"],
          sources.api,
        ),
        node(
          "Ferramentas e aplicação",
          "CAPACIDADE DOCUMENTADA",
          "O Astra possui capacidades de uso de computador e navegação. A aplicação que envolve o modelo fornece ferramentas, contexto e condições de execução. A qualidade da solução também depende dessa camada de software.",
          ["Modelo", "Ferramentas", "Aplicação"],
          sources.astra,
        ),
        node(
          "Distribuição",
          "ACESSO DOCUMENTADO",
          "A OpenAI anuncia acesso por seus produtos e API, além de Azure e Amazon Bedrock. Uma interface disponível não implica pesos abertos ou possibilidade de executar o Astra em um servidor particular.",
          ["OpenAI", "Azure", "Amazon Bedrock"],
          sources.astra,
        ),
      ];
    return [
      node(
        "Texto e visão",
        "ARQUITETURA PUBLICADA",
        "O encoder visual DeepSeek-ViT e um projetor MLP convertem imagens em embeddings, combinados com os de texto.",
        ["Imagem → ViT → projetor", "Texto → embeddings"],
        sources.deepseek,
      ),
      node(
        "Encoder → decoder",
        "CONFIGURAÇÃO PUBLICADA",
        "A arquitetura CED divide 40 camadas em 20 de encoder causal e 20 de decoder. O backbone possui 552 bilhões de parâmetros; parâmetros totais e ativos são medidas diferentes.",
        ["Encoder × 20", "Decoder × 20"],
        sources.deepseek,
      ),
      node(
        "Especialistas MoE",
        "CONFIGURAÇÃO PUBLICADA",
        "Cada camada MoE possui 384 especialistas roteados e 1 compartilhado; 6 roteados são ativados por token. O roteador determina quais participam. A seleção abaixo é ilustrativa.",
        ["Roteador", "6 de 384", "+ 1 compartilhado"],
        sources.config,
      ),
      node(
        "Atenção CSA2",
        "ARQUITETURA PUBLICADA",
        "Os modos Full, Reindex e Reuse compartilham estados e índices de atenção esparsa entre camadas. Um indexador hierárquico restringe a busca no decoder.",
        ["Full", "Reindex", "Reuse"],
        sources.deepseek,
      ),
      node(
        "KV e memória Engram",
        "ARQUITETURA PUBLICADA",
        "O KV global usa 890 bytes por token. SWA Bounded Replay reconstrói estados locais. Engram é uma memória condicional de 196 bilhões de parâmetros, distinta do cache de atenção.",
        ["KV global", "SWA replay", "Engram"],
        sources.deepseek,
      ),
      node(
        "Precisão numérica",
        "CONFIGURAÇÃO PUBLICADA",
        "A configuração registra quantização FP8 e especialistas FP4. Representações numéricas compactas economizam espaço; o uso efetivo de memória também inclui ativações, buffers e o runtime.",
        ["Pesos quantizados", "Ativações", "Buffers"],
        sources.config,
      ),
    ];
  }

  function infrastructure() {
    const own = $("hosting").value === "own";
    return [
      generic(
        "Aplicação e rede",
        "O dispositivo envia uma requisição pela rede. Um endpoint recebe mensagens e as encaminha ao serviço de inferência. Latência de rede é apenas uma parte do tempo total de resposta.",
        ["Dispositivo", "Rede", "Endpoint"],
      ),
      generic(
        "Serviço de inferência",
        "O servidor coordena fila, agrupamento de requisições e execução. A estratégia de batching pode aumentar o aproveitamento dos aceleradores, com efeitos sobre o tempo de espera de cada sessão.",
        own
          ? ["Operado por você", "Fila", "Batching"]
          : ["Operado pelo provedor", "Fila", "Batching"],
      ),
      generic(
        "Aceleradores e HBM",
        "GPUs ou outros aceleradores executam operações de matrizes. A memória HBM mantém dados próximos ao chip. Processamento e movimentação de dados precisam funcionar juntos: mais operações por segundo não resolvem todos os gargalos.",
        ["Cálculo", "Memória HBM", "Transferência"],
      ),
      generic(
        "Interconexão",
        "Quando o trabalho é distribuído entre chips ou servidores, eles precisam trocar dados. Paralelismo de tensores, etapas ou especialistas pode exigir padrões diferentes de comunicação. O diagrama não especifica a rede real de nenhum provedor.",
        ["Chip ↔ chip", "Servidor ↔ servidor"],
      ),
      generic(
        "Pesos, cache e disco",
        "Pesos são valores aprendidos no treinamento. O cache de atenção mantém estados associados ao contexto de uma sessão. Disco guarda arquivos e checkpoints; ele não substitui automaticamente a capacidade ou a velocidade da memória do acelerador.",
        ["Pesos aprendidos", "Estado da sessão", "Armazenamento"],
      ),
      generic(
        "Energia e refrigeração",
        "Fontes e distribuição elétrica alimentam os equipamentos; refrigeração remove o calor gerado. Capacidade elétrica, dissipação e operação contínua limitam o que pode ser instalado em um rack. Não há estimativa de watts ou número de racks nesta simulação.",
        ["Energia → equipamentos", "Calor → refrigeração", "Monitoramento"],
      ),
    ];
  }

  function training() {
    return [
      generic(
        "Preparar os dados",
        "Uma etapa de preparação organiza exemplos, avalia qualidade e define o que entra no treinamento. O conteúdo e a composição exatos dos conjuntos de dados não são reproduzidos aqui.",
        ["Coleta", "Curadoria", "Exemplos"],
      ),
      generic(
        "Pré-treinar",
        "A rede aprende regularidades a partir de exemplos. Uma passagem calcula previsões, uma função de perda mede o erro e a otimização ajusta os pesos. É diferente de enviar um prompt a um modelo pronto.",
        ["Previsão", "Erro", "Gradientes", "Ajuste dos pesos"],
      ),
      generic(
        "Pós-treinar",
        "Exemplos de respostas e sinais de recompensa podem melhorar o comportamento do modelo. Esta é uma visão geral de ajuste supervisionado e aprendizado por reforço, não uma reprodução das receitas privadas.",
        ["Exemplos orientados", "Feedback", "Ajuste"],
      ),
      generic(
        "Avaliar",
        "Testes investigam capacidades e falhas antes da disponibilização. Um resultado de benchmark descreve um conjunto de condições; não garante o mesmo desempenho para todo usuário, ferramenta ou tarefa.",
        ["Tarefas", "Resultados", "Falhas"],
      ),
      generic(
        "Preparar a execução",
        "Checkpoints são organizados para servir o modelo. Engenharia de inferência cuida de como os pesos são carregados e executados, respeitando as precisões numéricas e operações suportadas pelo runtime.",
        ["Checkpoint", "Runtime", "Serviço"],
      ),
      generic(
        "Usar em inferência",
        "Na inferência comum, o prompt muda o contexto e os estados de execução, não atualiza os pesos a cada resposta. Memória de conversa e cache não equivalem a re-treinar a rede.",
        ["Pesos disponíveis", "Novo contexto", "Resposta"],
      ),
    ];
  }

  const views = {
    journey: ["O caminho de uma requisição", "SEQUÊNCIA DIDÁTICA", journey],
    model: [
      "Blocos e mecanismos do modelo",
      "MAPA DE COMPONENTES",
      architecture,
    ],
    infra: [
      "Camadas que sustentam a execução",
      "CAMADAS CONCEITUAIS",
      infrastructure,
    ],
    training: ["Como os pesos chegam à inferência", "CICLO DIDÁTICO", training],
  };
  function steps() {
    return views[state.view][2]();
  }
  function renderDetails(announce = false) {
    const items = steps();
    state.step = Math.min(state.step, items.length - 1);
    const item = items[state.step];
    $("detail-title").textContent = item.title;
    $("detail-text").textContent = item.text;
    $("detail-kind").textContent = item.kind;
    $("detail-number").textContent = String(state.step + 1).padStart(2, "0");
    if (announce === true)
      $("selection-status").textContent =
        `${names[state.model]}. ${state.step + 1} de ${items.length}: ${item.title}. ${item.kind}.`;
    $("step-counter").textContent = `${state.step + 1} / ${items.length}`;
    $("previous").disabled = state.step === 0;
    $("next").disabled = state.step === items.length - 1;
    $("detail-source").hidden = !item.source;
    if (item.source) $("detail-source").href = item.source;
    else $("detail-source").removeAttribute("href");
    const diagramNodes = $("diagram").querySelectorAll("button");
    diagramNodes.forEach((el, i) =>
      el.setAttribute("aria-pressed", String(i === state.step)),
    );
    let chips = item.chips;
    if (state.view === "journey" && state.step === 2) {
      chips = $("prompt")
        .value.trim()
        .split(/\s+/u)
        .filter(Boolean)
        .slice(0, 20);
      if (chips.length === 0) chips = ["Digite uma pergunta no formulário"];
    }
    $("detail-visual").replaceChildren(
      ...chips.map((value, index) => {
        const el = document.createElement("span");
        el.textContent = value;
        if (index === 0) el.className = "selected";
        return el;
      }),
    );
    const context = number.format(Number($("context").value));
    const concurrency = $("concurrency").value;
    let scenario = `${context} tokens por sessão × ${concurrency} sessões. Esse cenário representa ocupação de contexto, não uma medida de velocidade.`;
    if (state.view === "journey" && state.step === 0)
      scenario = $("prompt").value.trim()
        ? `Sua entrada: “${$("prompt").value.trim()}”`
        : "Digite uma pergunta para visualizar sua entrada.";
    if (state.view === "journey" && state.step === 2)
      scenario =
        "Divisão ilustrativa em palavras (até 20). Não são tokens reais nem uma contagem do modelo.";
    if (state.view === "infra")
      scenario =
        $("hosting").value === "own"
          ? "Neste cenário, você opera o serviço e dimensiona a infraestrutura. A calculadora cobre apenas parte da memória."
          : "Neste cenário, o provedor opera a infraestrutura. Sua aplicação consome o serviço por API.";
    if (state.view === "training")
      scenario =
        "O formulário altera uma simulação de uso. Ele não treina nem modifica os modelos.";
    if (state.view === "model" && state.model === "astra")
      scenario =
        "A representação do Astra termina onde terminam os dados públicos. Não inferimos uma topologia interna.";
    $("scenario-detail").textContent = scenario;
  }

  function renderMemory() {
    const tokens = Number($("context").value);
    const sessions = Number($("concurrency").value);
    $("context-value").textContent = `${number.format(tokens)} tokens`;
    $("concurrency-value").textContent = String(sessions);
    if (state.model === "deepseek") {
      const bytes = tokens * sessions * 890;
      const gib = bytes / 1073741824;
      $("memory-title").textContent = "Estimativa parcial de KV global";
      const small = gib < 1;
      $("memory-value").textContent = decimal.format(
        small ? bytes / 1048576 : gib,
      );
      $("memory-unit").textContent = `${small ? "MiB" : "GiB"} no cenário`;
      $("memory-explanation").textContent =
        `${number.format(tokens)} × ${sessions} × 890 bytes ÷ ${small ? "2²⁰" : "2³⁰"}. Assume contextos independentes e ocupados, sem compartilhamento. Exclui pesos, Engram, SWA, ativações e buffers; não dimensiona GPUs nem memória total. Fonte: model card DeepSeek.`;
    } else {
      $("memory-title").textContent = "KV por token não divulgado";
      $("memory-value").textContent = "—";
      $("memory-unit").textContent = "sem estimativa pública";
      $("memory-explanation").textContent =
        `${number.format(tokens)} tokens × ${sessions} sessões no cenário. Contextos maiores demandam mais estado, mas não há coeficiente público suficiente para calcular a memória do Astra.`;
    }
  }

  function render() {
    const deep = state.model === "deepseek";
    $("model-title").textContent = names[state.model];
    $("evidence-badge").textContent = deep
      ? "Arquitetura publicada"
      : "Arquitetura não divulgada";
    $("model-note").textContent = deep
      ? "Pesos abertos e model card técnico. Backbone, memória e parâmetros ativos são medidas distintas."
      : "Serviço proprietário. Parâmetros e topologia interna não divulgados nas fontes consultadas.";
    $("hosting").querySelector('[value="own"]').disabled = !deep;
    if (!deep) $("hosting").value = "api";
    $("hosting-note").textContent = deep
      ? "Explore o serviço gerenciado ou as responsabilidades de operar pesos abertos."
      : "A execução própria não está disponível nas fontes consultadas.";
    $("view-description").textContent = views[state.view][0];
    $("map-tag").textContent = views[state.view][1];
    $("diagram").dataset.sequential = String(
      state.view === "journey" || state.view === "training",
    );
    document
      .querySelectorAll("[data-view]")
      .forEach((el) =>
        el.setAttribute("aria-pressed", String(el.dataset.view === state.view)),
      );
    const items = steps();
    state.step = Math.min(state.step, items.length - 1);
    $("diagram").replaceChildren(
      ...items.map((item, i) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "node";
        button.setAttribute("aria-pressed", String(i === state.step));
        button.setAttribute(
          "aria-label",
          `${i + 1}. ${item.title}. ${item.kind}`,
        );
        const top = document.createElement("span");
        top.className = "node-top";
        top.textContent = `${String(i + 1).padStart(2, "0")} / ${item.kind === "ESQUEMA DIDÁTICO" ? "CONCEITO" : "FONTE PÚBLICA"}`;
        const title = document.createElement("strong");
        title.textContent = item.title;
        button.append(top, title);
        button.addEventListener("click", () => {
          state.step = i;
          renderDetails(true);
        });
        return button;
      }),
    );
    renderMemory();
    renderDetails(true);
  }

  $("model").addEventListener("change", () => {
    state.model = $("model").value;
    state.step = 0;
    render();
  });
  $("hosting").addEventListener("change", render);
  $("tools").addEventListener("change", () => {
    state.step = 0;
    render();
  });
  ["context", "concurrency"].forEach((id) =>
    $(id).addEventListener("input", () => {
      $("context-number").value = $("context").value;
      renderMemory();
      renderDetails();
    }),
  );
  $("context-number").addEventListener("input", () => {
    if (!$("context-number").validity.valid) return;
    $("context").value = $("context-number").value;
    renderMemory();
    renderDetails();
  });
  $("prompt").addEventListener("input", renderDetails);
  document.querySelectorAll("[data-view]").forEach((button) =>
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      state.step = 0;
      render();
    }),
  );
  $("previous").addEventListener("click", () => {
    state.step = Math.max(0, state.step - 1);
    renderDetails(true);
  });
  $("next").addEventListener("click", () => {
    state.step = Math.min(steps().length - 1, state.step + 1);
    renderDetails(true);
  });
  $("scenario").addEventListener("submit", (event) => {
    event.preventDefault();
    state.view = "journey";
    state.step = 0;
    render();
    $("diagram").querySelector("button").focus({ preventScroll: true });
    $("model-title").scrollIntoView({ behavior: "instant", block: "start" });
  });
  render();
})();
