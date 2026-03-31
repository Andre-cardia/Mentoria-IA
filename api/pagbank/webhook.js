import { handleWebhook } from "../../server/use-cases/handle-webhook.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  try {
    await handleWebhook(req.body);
  } catch (err) {
    console.error("[/webhook]", err.message);
  }

  // Sempre 200 para o PagBank não retentar
  return res.status(200).json({ ok: true });
}
