import { NextRequest, NextResponse } from "next/server";

import { authenticatedCustomerId, CustomerAuthError } from "@/lib/studentDiscount/auth";
import { cartFingerprint, deterministicCheckoutId } from "@/lib/studentDiscount/cart";
import { createStoredSession, getStoredSession, publicSession } from "@/lib/studentDiscount/sessionStore";
import type { CreateStudentDiscountSessionRequest } from "@/lib/studentDiscount/types";
import { createUnifyCheckoutSession, UnifyIntegrationError } from "@/lib/studentDiscount/unifyClient";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof CustomerAuthError) return NextResponse.json({ error: error.message }, { status: 401 });
  if (error instanceof UnifyIntegrationError) {
    console.error("UNIFY session creation failed:", error.message);
    return NextResponse.json({ error: "Student verification is temporarily unavailable." }, { status: 502 });
  }
  const message = error instanceof Error ? error.message : "Unable to create a student verification session.";
  const isConfigurationError = message.includes("Firebase Admin is not configured");
  if (isConfigurationError) console.error(message);
  return NextResponse.json(
    { error: isConfigurationError ? "Student verification is temporarily unavailable." : message },
    { status: isConfigurationError ? 503 : 400 },
  );
}

/** Creates or reuses the customer's verification session for one exact cart. */
export async function POST(request: NextRequest) {
  try {
    const uid = await authenticatedCustomerId(request);
    const body = await request.json() as Partial<CreateStudentDiscountSessionRequest>;
    if (typeof body.clientRequestId !== "string" || !Array.isArray(body.cart)) {
      return NextResponse.json({ error: "clientRequestId and cart are required." }, { status: 400 });
    }

    const clientRequestId = body.clientRequestId.trim();
    const checkoutId = deterministicCheckoutId(uid, clientRequestId);
    const fingerprint = cartFingerprint(body.cart);
    const existing = await getStoredSession(checkoutId);
    if (existing) {
      if (existing.uid !== uid) return NextResponse.json({ error: "Verification session not found." }, { status: 404 });
      if (existing.cartFingerprint !== fingerprint) {
        return NextResponse.json(
          { error: "The cart changed. Start a new verification request." },
          { status: 409 },
        );
      }
      return NextResponse.json(publicSession(existing));
    }

    const unify = await createUnifyCheckoutSession(checkoutId);
    const stored = await createStoredSession({
      checkoutId,
      uid,
      clientRequestId,
      cartFingerprint: fingerprint,
      unify,
    });
    if (stored.uid !== uid || stored.cartFingerprint !== fingerprint) {
      return NextResponse.json({ error: "The checkout session is already bound to another cart." }, { status: 409 });
    }
    return NextResponse.json(publicSession(stored), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
