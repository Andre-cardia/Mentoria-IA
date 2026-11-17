// As páginas de produto continuam a ser servidas por mais de um domínio.
export function aplicarIdentidade(pagina) {
  const html = document.documentElement
  if (html.dataset.nhPagina) return
  html.dataset.nhPagina = pagina

  const estilo = document.createElement('link')
  estilo.rel = 'stylesheet'
  estilo.href = '/identidade-neuralhub/paginas.css'
  document.head.append(estilo)

  const icone = document.querySelector('link[rel~="icon"]') || document.createElement('link')
  icone.rel = 'icon'
  icone.type = 'image/png'
  icone.href = '/identidade-neuralhub/favicon.png'
  if (!icone.isConnected) document.head.append(icone)

  function inserirNavegacao() {
    if (pagina === 'guia-de-marca') aplicarExemplosDeMarca()
    const barra = document.createElement('div')
    barra.className = 'nh-barra-institucional'
    barra.innerHTML = `
      <nav aria-label="Neural Hub institucional">
        <a class="nh-assinatura" href="/neuralhub.html">
          <img src="/identidade-neuralhub/assinatura.webp" alt="Neural Hub, início" width="210" height="59">
        </a>
        <div class="nh-destinos">
          <a href="/neuralhub.html#servicos">Serviços</a>
          <a href="/neuralhub.html#formacao">Formação</a>
          <a class="nh-pedir-proposta" href="https://mentoria.neuralhub.ia.br/solicitar-proposta">Solicitar proposta <span aria-hidden="true">↗</span></a>
        </div>
      </nav>`
    const salto = document.body.querySelector(':scope > .skip-link')
    if (salto) salto.after(barra)
    else document.body.prepend(barra)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inserirNavegacao, { once: true })
  } else {
    inserirNavegacao()
  }
}

function aplicarExemplosDeMarca() {
  document.title = 'Identidade visual | Neural Hub'
  document.querySelector('#overview h1').textContent = 'Identidade visual da Neural Hub'
  document.querySelector('#overview h1 + p').textContent =
    'A marca institucional, a tipografia e as cores aplicadas ao site. Os componentes abaixo também documentam os padrões da Mentoria.'
  const secao = document.getElementById('logo')
  secao.innerHTML = `
    <h2>Marca e assinatura</h2>
    <p>Aplique o símbolo original em prata e laranja com o nome NEURAL HUB em maiúsculas.</p>
    <div class="nh-exemplos-marca">
      <figure><img src="/identidade-neuralhub/assinatura.webp" alt="Neural Hub em fundo escuro"><figcaption>Assinatura sobre grafite</figcaption></figure>
      <figure><img src="/identidade-neuralhub/assinatura-clara.webp" alt="Neural Hub em fundo claro"><figcaption>Assinatura sobre marfim</figcaption></figure>
    </div>`
}
