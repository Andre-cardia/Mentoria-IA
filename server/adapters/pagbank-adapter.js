import { IPaymentGateway } from "../ports/payment-gateway.js";
import { PAGBANK_BASE_URL, PAGBANK_TOKEN } from "../config.js";

const REDIRECT_URL = "https://mentoria.neuralhub.ia.br/obrigado.html";
const RETURN_URL = "https://mentoria.neuralhub.ia.br/";
const WEBHOOK_URL = "https://mentoria.neuralhub.ia.br/api/pagbank/webhook";

export class PagBankAdapter extends IPaymentGateway {
  async createCheckout(plan) {
    const payload = {
      reference_id: plan.referenceId,
      redirect_url: REDIRECT_URL,
      return_url: RETURN_URL,
      notification_urls: [WEBHOOK_URL],
      payment_notification_urls: [WEBHOOK_URL],
      items: [
        {
          reference_id: plan.referenceId,
          name: plan.name,
          quantity: 1,
          unit_amount: plan.amount,
        },
      ],
    };

    const response = await fetch(`${PAGBANK_BASE_URL}/checkouts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAGBANK_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error("PagBank retornou erro ao criar checkout");
      error.pagbank = data;
      throw error;
    }

    const payLink = data?.links?.find((l) => l.rel === "PAY")?.href;
    if (!payLink) {
      const error = new Error("PagBank não retornou link de pagamento (rel=PAY)");
      error.pagbank = data;
      throw error;
    }

    return { checkoutId: data.id, payLink };
  }
}
