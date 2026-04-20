import { handleWebhook } from "../../server/use-cases/handle-webhook.js";
import {
  getPagBankSignature,
  isPagBankWebhookVerificationEnabled,
  verifyPagBankWebhookSignature,
} from "../../server/lib/pagbank-webhook.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  try {
    const rawBody = await readRawBody(req);

    if (isPagBankWebhookVerificationEnabled()) {
      const verification = verifyPagBankWebhookSignature(
        rawBody,
        getPagBankSignature(req)
      );

      if (!verification.ok) {
        console.warn("[/webhook] assinatura inválida:", verification.reason);
        return res.status(401).json({ error: true, message: "Invalid webhook signature" });
      }
    }

    const payload = rawBody ? JSON.parse(rawBody) : {};
    await handleWebhook(payload);
  } catch (err) {
    console.error("[/webhook]", err.message);
  }

  // Sempre 200 para o PagBank não retentar
  return res.status(200).json({ ok: true });
}
