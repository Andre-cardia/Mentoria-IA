const documento = globalThis.document;
const dialogo = documento.querySelector('#player');
const video = dialogo.querySelector('video');
const titulo = dialogo.querySelector('h2');
const linkDireto = dialogo.querySelector('.link-arquivo');
let origem;

if (typeof dialogo.showModal === 'function') {
  documento.querySelectorAll('a[data-filme]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      origem = link;
      titulo.textContent = link.dataset.filme;
      linkDireto.href = link.href;
      video.src = link.href;
      if (link.dataset.legenda) {
        const track = documento.createElement('track');
        track.kind = 'captions';
        track.srclang = 'pt-BR';
        track.label = 'Português';
        track.src = link.dataset.legenda;
        video.append(track);
      }
      dialogo.showModal();
      video.play().catch(() => {
        // Os controles nativos permitem iniciar a reprodução manualmente.
      });
    });
  });
  dialogo.querySelector('.fechar-player').addEventListener('click', () => dialogo.close());
  dialogo.addEventListener('click', (event) => {
    if (event.target === dialogo) dialogo.close();
  });
  dialogo.addEventListener('close', () => {
    video.pause();
    video.removeAttribute('src');
    video.replaceChildren();
    video.load();
    origem?.focus({ preventScroll: true });
  });
}
