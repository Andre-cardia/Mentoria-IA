import crypto from "crypto";
import { afterEach, describe, expect, it } from "vitest";
import { verifyPagBankWebhookSignature } from "../lib/pagbank-webhook.js";

describe("verifyPagBankWebhookSignature", () => {
  const originalToken = process.env.PAGBANK_WEBHOOK_AUTH_TOKEN;

  afterEach(() => {
    process.env.PAGBANK_WEBHOOK_AUTH_TOKEN = originalToken;
  });

  it("aprova quando a verificação está desabilitada", () => {
    delete process.env.PAGBANK_WEBHOOK_AUTH_TOKEN;

    expect(verifyPagBankWebhookSignature('{"ok":true}', "")).toEqual({
      ok: true,
      reason: "verification_disabled",
    });
  });

  it("valida a assinatura correta", () => {
    process.env.PAGBANK_WEBHOOK_AUTH_TOKEN = "pagbank-secret";
    const rawBody = '{"id":"123","status":"PAID"}';
    const signature = crypto
      .createHash("sha256")
      .update(`pagbank-secret-${rawBody}`, "utf8")
      .digest("hex");

    expect(verifyPagBankWebhookSignature(rawBody, signature)).toEqual({
      ok: true,
      reason: "verified",
    });
  });

  it("rejeita a assinatura incorreta", () => {
    process.env.PAGBANK_WEBHOOK_AUTH_TOKEN = "pagbank-secret";

    expect(
      verifyPagBankWebhookSignature('{"id":"123","status":"PAID"}', "invalid")
    ).toEqual({
      ok: false,
      reason: "signature_mismatch",
    });
  });
});
