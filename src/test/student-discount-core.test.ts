import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { canonicalCart, cartFingerprint, deterministicCheckoutId } from "@/lib/studentDiscount/cart";
import { validUnifyWebhookSignature } from "@/lib/studentDiscount/webhookSignature";

describe("student discount checkout binding", () => {
  it("creates the same cart fingerprint regardless of item order", () => {
    const first = [
      { productId: "phone-b", quantity: 1, unitPrice: 8_999.99 },
      { productId: "phone-a", quantity: 2, unitPrice: 3_500 },
    ];
    const second = [...first].reverse();

    expect(canonicalCart(first)).toEqual([
      { productId: "phone-a", quantity: 2, unitPriceCents: 350_000 },
      { productId: "phone-b", quantity: 1, unitPriceCents: 899_999 },
    ]);
    expect(cartFingerprint(first)).toBe(cartFingerprint(second));
  });

  it("changes the fingerprint when quantity or price changes", () => {
    const cart = [{ productId: "phone-a", quantity: 1, unitPrice: 1_000 }];
    expect(cartFingerprint(cart)).not.toBe(cartFingerprint([{ ...cart[0], quantity: 2 }]));
    expect(cartFingerprint(cart)).not.toBe(cartFingerprint([{ ...cart[0], unitPrice: 999 }]));
  });

  it("derives an idempotent checkout ID scoped to both customer and request", () => {
    const original = deterministicCheckoutId("customer-a", "request-1");
    expect(original).toBe(deterministicCheckoutId("customer-a", " request-1 "));
    expect(original).not.toBe(deterministicCheckoutId("customer-b", "request-1"));
    expect(original).not.toBe(deterministicCheckoutId("customer-a", "request-2"));
    expect(original).toMatch(/^technest_[a-f0-9]{64}$/);
  });

  it("rejects invalid cart data before calling UNIFY", () => {
    expect(() => cartFingerprint([])).toThrow(/between 1 and 100/);
    expect(() => cartFingerprint([{ productId: "phone", quantity: 0, unitPrice: 10 }])).toThrow(/quantities/);
    expect(() => cartFingerprint([{ productId: "phone", quantity: 1, unitPrice: 10.999 }])).toThrow(/decimal/);
  });
});

describe("UNIFY webhook signatures", () => {
  it("accepts the signed raw request body and rejects changed content", () => {
    const secret = "test-webhook-secret";
    const body = JSON.stringify({ eventId: "event-1", status: "APPROVED" });
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(validUnifyWebhookSignature(body, signature, secret)).toBe(true);
    expect(validUnifyWebhookSignature(`${body} `, signature, secret)).toBe(false);
    expect(validUnifyWebhookSignature(body, "sha256=invalid", secret)).toBe(false);
  });
});
