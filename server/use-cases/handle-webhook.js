import { SupabaseAdapter } from "../adapters/supabase-adapter.js";

const supabaseAdapter = new SupabaseAdapter();

const STATUS_LABELS = {
  PAID: "Pagamento aprovado",
  WAITING: "Aguardando confirmação",
  IN_ANALYSIS: "Em análise",
  DECLINED: "Recusado",
  CANCELED: "Cancelado",
};

/**
 * Processa um evento de webhook recebido do PagBank.
 * @param {Object} body - Corpo do POST do PagBank
 */
export async function handleWebhook(body) {
  console.log("[Webhook PagBank]", JSON.stringify(body, null, 2));

  const status = body?.charges?.[0]?.status ?? body?.status;
  const referenceId = body?.reference_id ?? body?.charges?.[0]?.reference_id;
  const checkoutId = body?.id;
  const amount = body?.charges?.[0]?.amount?.value ?? null;
  const email = body?.customer?.email ?? null;

  const label = STATUS_LABELS[status] ?? `Status desconhecido: ${status}`;
  console.log(`[Webhook PagBank] ${label} — ref: ${referenceId} — email: ${email ?? 'não informado'}`);

  if (referenceId && status) {
    await supabaseAdapter.savePayment({
      referenceId,
      checkoutId,
      status,
      amount,
      email,
      rawEvent: body,
    });
  }
}
