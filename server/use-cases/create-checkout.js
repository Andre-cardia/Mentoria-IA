import { PagBankAdapter } from "../adapters/pagbank-adapter.js";

const PLANS = {
  mensal: {
    name: "Mentoria NeuralHub — Plano Mensal",
    amount: 49700, // R$ 497,00 em centavos
  },
  anual: {
    name: "Mentoria NeuralHub — Plano Anual",
    amount: 356140, // R$ 3.561,40 em centavos (12x de R$ 368,64 com desconto à vista)
  },
};

const gateway = new PagBankAdapter();

/**
 * Cria um checkout no PagBank para o plano solicitado.
 * @param {string} planId - "mensal" | "anual"
 * @returns {Promise<{ ok: boolean, payLink: string, checkoutId: string }>}
 */
export async function createCheckout(planId) {
  const plan = PLANS[planId];
  if (!plan) throw new Error(`Plano inválido: ${planId}`);

  const referenceId = `${planId}-${Date.now()}`;

  const result = await gateway.createCheckout({
    referenceId,
    name: plan.name,
    amount: plan.amount,
  });

  return { ok: true, payLink: result.payLink, checkoutId: result.checkoutId };
}
