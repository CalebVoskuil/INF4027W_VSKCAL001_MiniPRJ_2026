import { NextRequest, NextResponse } from "next/server";

import { applyWebhookResult } from "@/lib/studentDiscount/sessionStore";
import type { StudentDiscountStatus, UnifyVerificationWebhookPayload } from "@/lib/studentDiscount/types";
import { validUnifyWebhookSignature } from "@/lib/studentDiscount/webhookSignature";

export const runtime = "nodejs";

const TERMINAL_STATUSES = new Set<StudentDiscountStatus>(["APPROVED", "DECLINED", "EXPIRED", "FAILED"]);

function parsedWebhook(value: unknown): UnifyVerificationWebhookPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (
    typeof body.eventId !== "string" || !body.eventId ||
    typeof body.verificationRequestId !== "string" || !body.verificationRequestId ||
    typeof body.checkoutId !== "string" || !body.checkoutId ||
    typeof body.status !== "string" || !TERMINAL_STATUSES.has(body.status as StudentDiscountStatus)
  ) return null;

  return {
    eventId: body.eventId,
    verificationRequestId: body.verificationRequestId,
    checkoutId: body.checkoutId,
    status: body.status as StudentDiscountStatus,
    ...(typeof body.failureCode === "string" ? { failureCode: body.failureCode } : {}),
    ...(typeof body.expiresAt === "string" ? { expiresAt: body.expiresAt } : {}),
    ...(typeof body.completedAt === "string" ? { completedAt: body.completedAt } : {}),
  };
}

/** Receives the minimal, signed completion event from the UNIFY Admin Portal. */
export async function POST(request: NextRequest) {
  const secret = process.env.UNIFY_VENDOR_WEBHOOK_SECRET;
  if (!secret) {
    console.error("UNIFY_VENDOR_WEBHOOK_SECRET is not configured.");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!validUnifyWebhookSignature(rawBody, request.headers.get("x-unify-signature"), secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: UnifyVerificationWebhookPayload | null = null;
  try {
    payload = parsedWebhook(JSON.parse(rawBody));
  } catch {
    // The signature is checked before parsing so unauthenticated input never reaches storage.
  }
  if (!payload || !payload.checkoutId || payload.status === "PENDING") {
    return NextResponse.json({ error: "Invalid verification event." }, { status: 400 });
  }
  const headerEventId = request.headers.get("x-unify-event-id");
  if (!headerEventId || headerEventId !== payload.eventId) {
    return NextResponse.json({ error: "Webhook event ID does not match its header." }, { status: 400 });
  }

  try {
    const outcome = await applyWebhookResult({
      eventId: payload.eventId,
      checkoutId: payload.checkoutId,
      verificationRequestId: payload.verificationRequestId,
      status: payload.status,
      ...(payload.failureCode ? { failureCode: payload.failureCode } : {}),
      ...(payload.expiresAt ? { expiresAt: payload.expiresAt } : {}),
      ...(payload.completedAt ? { completedAt: payload.completedAt } : {}),
    });
    return NextResponse.json({ received: true, duplicate: outcome === "duplicate" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook could not be recorded.";
    const notFound = message.includes("was not found");
    console.error("UNIFY webhook rejected:", message);
    return NextResponse.json(
      { error: notFound ? "Verification session not found." : "Verification event does not match the checkout." },
      { status: notFound ? 404 : 409 },
    );
  }
}
