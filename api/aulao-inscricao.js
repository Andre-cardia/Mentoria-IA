import { createHmac } from 'node:crypto';

const mensagens = {
  400: 'Confira seu nome, e-mail e WhatsApp com DDD.',
  503: 'A gravação está temporariamente indisponível. Volte ao cadastro e tente novamente em instantes.',
};

function responderErro(res, status) {
  return res.status(status).setHeader('Content-Type', 'text/html; charset=utf-8').send(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Inscrição no aulão | Neural Hub</title><link rel="stylesheet" href="/aulao/evento.css"><main class="wrap confirmacao"><p class="rotulo">Aulão Neural Hub</p><h1>Confira sua inscrição.</h1><p>' + mensagens[status] + '</p><a class="cta" href="/aulao#inscricao">Voltar ao cadastro</a></main></html>'
  );
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).setHeader('Allow', 'POST').end();
  const body = typeof req.body === 'string' ? Object.fromEntries(new URLSearchParams(req.body)) : req.body || {};
  const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() : '';
  if (nome.length < 2 || nome.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      || !/^[+\d().\s-]{8,26}$/.test(whatsapp) || !/^\d{10,15}$/.test(whatsapp.replace(/\D/g, ''))) {
    return responderErro(res, 400);
  }
  const destino = process.env.AULAO_SHEETS_WEBAPP;
  if (!destino || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(destino)) return responderErro(res, 503);
  try {
    const escrita = await fetch(destino, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, whatsapp }),
      signal: AbortSignal.timeout(20000),
    });
    const resultado = escrita.ok && await escrita.json();
    if (!resultado || typeof resultado !== 'object' || !('inscricao' in resultado) || resultado.inscricao !== 'registrada') {
      return responderErro(res, 503);
    }
    const deveMedirLead = !('eventoLead' in resultado) || resultado.eventoLead !== null;
    if (deveMedirLead && process.env.AULAO_CONVERSION_KEY) {
      const id = createHmac('sha256', process.env.AULAO_CONVERSION_KEY)
        .update('aulao-20261119:' + email).digest('hex');
      res.setHeader('Set-Cookie', 'nh_aulao_lead=' + id + '; Path=/aulao/obrigado; Max-Age=300; Secure; SameSite=Lax');
    }
  } catch {
    return responderErro(res, 503);
  }
  return res.status(303).setHeader('Location', '/aulao/obrigado').end();
}
