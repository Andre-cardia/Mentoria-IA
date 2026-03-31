import { Router } from "express";
import { createCheckout } from "../use-cases/create-checkout.js";
import { handleWebhook } from "../use-cases/handle-webhook.js";

const router = Router();

// POST /api/pagbank/checkout
// Body: { planId: "mensal" | "anual" }
router.post("/checkout", async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ error: true, message: "planId é obrigatório" });
  }

  try {
    const result = await createCheckout(planId);
    return res.json(result);
  } catch (err) {
    console.error("[/checkout]", err.message, err.pagbank ?? "");
    return res.status(500).json({
      error: true,
      message: err.message,
      pagbank: err.pagbank ?? null,
    });
  }
});

// POST /api/pagbank/webhook
// Recebe notificações de status do PagBank
router.post("/webhook", async (req, res) => {
  try {
    await handleWebhook(req.body);
  } catch (err) {
    console.error("[/webhook]", err.message);
  }
  // Sempre retornar 200 para o PagBank não retentar indefinidamente
  return res.status(200).json({ ok: true });
});

export default router;
