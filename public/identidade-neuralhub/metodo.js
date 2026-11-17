(() => {
  const { document } = globalThis;
  const lista = document.querySelector('#etapas-metodo');
  if (!lista || !lista.animate || !globalThis.IntersectionObserver) return;

  const etapas = Array.from(lista.children);
  const controle = document.querySelector('.metodo-reproducao');
  const movimentoReduzido = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
  let atual = 0;
  let visivel = false;
  let automatico = !movimentoReduzido.matches;
  let concluido = false;
  let percurso;

  function sincronizar() {
    if (automatico && visivel && !document.hidden) percurso.play();
    else percurso.pause();

    controle.hidden = movimentoReduzido.matches;
    controle.dataset.acao = automatico ? 'pausar' : 'reproduzir';
    controle.textContent = automatico ? 'Pausar sequência' : concluido ? 'Rever etapas' : 'Reproduzir sequência';
  }

  function mostrar(indice) {
    if (percurso) percurso.cancel();
    atual = indice;
    concluido = false;
    etapas.forEach((etapa, i) => {
      const selecionada = i === atual;
      etapa.classList.toggle('etapa-atual', selecionada);
      etapa.classList.toggle('etapa-anterior', i < atual);
      etapa.querySelector('button').setAttribute('aria-expanded', String(selecionada));
      etapa.querySelector('.etapa-detalhe').hidden = !selecionada;
    });
    const sinal = etapas[atual].querySelector('.etapa-sinal');
    percurso = sinal.animate(
      [{ clipPath: 'inset(var(--inicio-percurso))' }, { clipPath: 'inset(0%)' }],
      { duration: 7500, fill: 'both' }
    );
    percurso.onfinish = () => {
      if (atual < etapas.length - 1) mostrar(atual + 1);
      else {
        automatico = false;
        concluido = true;
        sincronizar();
      }
    };
    sincronizar();
  }

  etapas.forEach((etapa, indice) => {
    const titulo = etapa.querySelector('h3');
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.setAttribute('aria-controls', etapa.querySelector('.etapa-detalhe').id);
    botao.append(...Array.from(titulo.childNodes));
    titulo.append(botao);
    const trilho = document.createElement('span');
    trilho.className = 'etapa-trilho';
    trilho.setAttribute('aria-hidden', 'true');
    const sinal = document.createElement('span');
    sinal.className = 'etapa-sinal';
    trilho.append(sinal);
    titulo.append(trilho);

    botao.addEventListener('click', () => {
      automatico = false;
      mostrar(indice);
    });
    botao.addEventListener('focus', () => {
      if (botao.matches(':focus-visible')) {
        automatico = false;
        sincronizar();
      }
    });
  });

  controle.addEventListener('click', () => {
    automatico = !automatico;
    if (concluido) mostrar(0);
    else sincronizar();
  });
  movimentoReduzido.addEventListener('change', () => {
    if (movimentoReduzido.matches) automatico = false;
    sincronizar();
  });
  document.addEventListener('visibilitychange', sincronizar);
  lista.classList.add('etapas-dinamicas');
  mostrar(0);
  new globalThis.IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting;
    sincronizar();
  }, { threshold: 0.12 }).observe(lista);
})();
