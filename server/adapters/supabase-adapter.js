import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from "../config.js";

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

export class SupabaseAdapter {
  /**
   * Persiste ou atualiza um evento de pagamento na tabela `payments`.
   * @param {Object} params
   * @param {string} params.referenceId
   * @param {string} [params.checkoutId]
   * @param {string} params.status
   * @param {number} [params.amount]
   * @param {Object} params.rawEvent
   */
  async savePayment({ referenceId, checkoutId, status, amount, rawEvent }) {
    if (!supabase) {
      console.warn("[SupabaseAdapter] SUPABASE_SERVICE_KEY não configurada — evento não salvo.");
      return;
    }
    const { error } = await supabase.from("payments").upsert(
      {
        reference_id: referenceId,
        checkout_id: checkoutId ?? null,
        status,
        amount: amount ?? null,
        raw_event: rawEvent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "reference_id" }
    );

    if (error) {
      console.error("[SupabaseAdapter] Erro ao salvar pagamento:", error);
      throw error;
    }
  }
}
