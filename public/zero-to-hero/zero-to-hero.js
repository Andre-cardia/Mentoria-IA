const { document: documento, location, fetch: buscar, console: registro } = globalThis;
const botoes = documento.querySelectorAll('.botao-compra');
const status = documento.querySelector('.status-compra');
let comprando = false;

botoes.forEach((botao) => {
  botao.addEventListener('click', async () => {
    if (comprando) return;
    comprando = true;
    const textoOriginal = botao.innerHTML;
    botao.disabled = true;
    botao.textContent = 'Aguarde, abrindo o pagamento…';
    if (status) status.textContent = '';
    globalThis.fbq?.('track', 'InitiateCheckout', { value: 3561.4, currency: 'BRL', content_name: 'Mentoria Zero to Hero - Pacote completo' });
    try {
      const resposta = await buscar('/api/pagbank/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: botao.dataset.plano }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok || !dados.payLink) throw new Error(dados?.message || 'Erro ' + resposta.status);
      location.href = dados.payLink;
    } catch (erro) {
      registro.error('[PagBank]', erro);
      if (status) status.textContent = 'Não foi possível iniciar o pagamento. Tente novamente em instantes.';
      botao.disabled = false;
      botao.innerHTML = textoOriginal;
      comprando = false;
    }
  });
});
