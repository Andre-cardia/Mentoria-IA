const CONVERSIONS_API_URL = "https://bzr.openai.com/v1/events";
const PIXEL_ID = "3j5aQhNBufLJWFfSJFmMLq";

/**
 * Envia um evento de conversão para a OpenAI Conversions API (server-side).
 * @param {Object} params
 * @param {string} params.eventId  - ID único do evento (ex: referenceId do pagamento)
 * @param {string} params.sourceUrl - URL onde a conversão ocorreu
 */
export async function sendConversionEvent({ eventId, sourceUrl }) {
  const apiKey = process.env.OPENAI_CONVERSIONS_API_KEY;
  if (!apiKey) {
    console.warn("[OpenAIConversions] OPENAI_CONVERSIONS_API_KEY não configurada — evento ignorado.");
    return;
  }

  const payload = {
    validate_only: false,
    events: [
      {
        id: eventId,
        type: "subscription_created",
        timestamp_ms: Date.now(),
        source_url: sourceUrl,
        action_source: "web",
        data: {
          type: "plan_enrollment",
        },
      },
    ],
  };

  try {
    const res = await fetch(`${CONVERSIONS_API_URL}?pid=${PIXEL_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[OpenAIConversions] Erro HTTP ${res.status}:`, text);
    } else {
      console.log(`[OpenAIConversions] Evento subscription_created enviado — id: ${eventId}`);
    }
  } catch (err) {
    console.error("[OpenAIConversions] Falha ao enviar evento:", err.message);
  }
}
