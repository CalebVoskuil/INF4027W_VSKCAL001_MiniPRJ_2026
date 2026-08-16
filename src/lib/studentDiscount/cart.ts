import { createHash } from "node:crypto";

import type { StudentDiscountCartLine } from "@/lib/studentDiscount/types";

const MAX_CART_LINES = 100;

type CanonicalCartLine = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};

function moneyToCents(value: number): number {
  if (!Number.isFinite(value) || value < 0) throw new Error("Cart prices must be valid non-negative numbers.");
  const cents = Math.round(value * 100);
  if (Math.abs(value * 100 - cents) > Number.EPSILON * Math.max(1, Math.abs(value * 100)) * 4) {
    throw new Error("Cart prices may contain at most two decimal places.");
  }
  return cents;
}

/** Produces a stable representation so item ordering cannot change the checkout binding. */
export function canonicalCart(cart: StudentDiscountCartLine[]): CanonicalCartLine[] {
  if (!Array.isArray(cart) || cart.length === 0 || cart.length > MAX_CART_LINES) {
    throw new Error(`Cart must contain between 1 and ${MAX_CART_LINES} items.`);
  }

  const canonical = cart.map((line) => {
    const productId = line.productId?.trim();
    if (!productId || productId.length > 128) throw new Error("Every cart item must have a valid product ID.");
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999) {
      throw new Error("Cart quantities must be whole numbers between 1 and 999.");
    }
    return { productId, quantity: line.quantity, unitPriceCents: moneyToCents(line.unitPrice) };
  });

  return canonical.sort((left, right) =>
    left.productId.localeCompare(right.productId) ||
    left.quantity - right.quantity ||
    left.unitPriceCents - right.unitPriceCents,
  );
}

export function cartFingerprint(cart: StudentDiscountCartLine[]): string {
  return createHash("sha256").update(JSON.stringify(canonicalCart(cart))).digest("hex");
}

export function deterministicCheckoutId(uid: string, clientRequestId: string): string {
  const requestId = clientRequestId.trim();
  if (!requestId || requestId.length > 128) {
    throw new Error("clientRequestId must contain between 1 and 128 characters.");
  }
  if (!uid) throw new Error("A signed-in customer is required.");

  const digest = createHash("sha256").update(`${uid}\0${requestId}`).digest("hex");
  return `technest_${digest}`;
}
