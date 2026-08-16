import { NextRequest, NextResponse } from "next/server";

import { authenticatedCustomerId, CustomerAuthError } from "@/lib/studentDiscount/auth";
import { applyPolledResult, getStoredSession, publicSession } from "@/lib/studentDiscount/sessionStore";
import { getUnifyCheckoutSession, UnifyIntegrationError } from "@/lib/studentDiscount/unifyClient";

export const runtime = "nodejs";

/** Returns the customer's latest result, polling UNIFY while the proof is pending. */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ checkoutId: string }> },
) {
  try {
    const uid = await authenticatedCustomerId(request);
    const { checkoutId } = await context.params;
    let session = await getStoredSession(checkoutId);
    if (!session || session.uid !== uid) {
      return NextResponse.json({ error: "Verification session not found." }, { status: 404 });
    }

    if (session.status === "PENDING") {
      const result = await getUnifyCheckoutSession(session.verificationRequestId);
      session = await applyPolledResult(session, result);
    }
    return NextResponse.json(publicSession(session));
  } catch (error) {
    if (error instanceof CustomerAuthError) return NextResponse.json({ error: error.message }, { status: 401 });
    if (error instanceof UnifyIntegrationError) {
      console.error("UNIFY session polling failed:", error.message);
      return NextResponse.json({ error: "Unable to refresh student verification." }, { status: 502 });
    }
    console.error("Student verification lookup failed:", error);
    return NextResponse.json({ error: "Unable to load student verification." }, { status: 500 });
  }
}
