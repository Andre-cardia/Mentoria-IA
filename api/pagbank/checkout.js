import { createCheckout } from "../../server/use-cases/create-checkout.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

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
}
