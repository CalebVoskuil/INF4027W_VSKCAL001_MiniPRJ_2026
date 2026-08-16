import { createHmac, timingSafeEqual } from "node:crypto";

export function validUnifyWebhookSignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  const supplied = signatureHeader?.match(/^sha256=([a-f0-9]{64})$/i)?.[1];
  if (!supplied || !secret) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return suppliedBuffer.length === expectedBuffer.length && timingSafeEqual(suppliedBuffer, expectedBuffer);
}
