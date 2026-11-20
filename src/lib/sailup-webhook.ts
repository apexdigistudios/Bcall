import { createHmac, timingSafeEqual } from "node:crypto";

const signatureToleranceSeconds = 5 * 60;

export function verifySailupWebhookSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
  secret: string,
  nowMs = Date.now(),
): boolean {
  if (!/^\d{10}$/.test(timestamp) || !secret) return false;
  const timestampSeconds = Number(timestamp);
  if (Math.abs(Math.floor(nowMs / 1_000) - timestampSeconds) > signatureToleranceSeconds) return false;

  const match = /^sha256=([a-f0-9]{64})$/i.exec(signature);
  if (!match) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest();
  const received = Buffer.from(match[1], "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
