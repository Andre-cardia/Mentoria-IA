import crypto from "crypto";

const SIGNATURE_HEADER = "x-authenticity-token";

export function isPagBankWebhookVerificationEnabled() {
  return Boolean(process.env.PAGBANK_WEBHOOK_AUTH_TOKEN);
}

export function verifyPagBankWebhookSignature(rawBody, signature) {
  const token = process.env.PAGBANK_WEBHOOK_AUTH_TOKEN;
  if (!token) return { ok: true, reason: "verification_disabled" };
  if (!rawBody) return { ok: false, reason: "missing_raw_body" };
  if (!signature) return { ok: false, reason: "missing_signature" };

  const expected = crypto
    .createHash("sha256")
    .update(`${token}-${rawBody}`, "utf8")
    .digest("hex");

  const provided = signature.trim().toLowerCase();
  const matches =
    provided.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));

  return { ok: matches, reason: matches ? "verified" : "signature_mismatch" };
}

export function getPagBankSignature(req) {
  const signature = req.headers[SIGNATURE_HEADER];
  return Array.isArray(signature) ? signature[0] : signature ?? "";
}
