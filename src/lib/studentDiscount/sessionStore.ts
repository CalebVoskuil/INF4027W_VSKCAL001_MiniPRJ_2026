import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { firebaseAdminDb } from "@/lib/firebase/admin";
import { STUDENT_DISCOUNT_RATE, type StudentDiscountSession, type StudentDiscountStatus } from "@/lib/studentDiscount/types";
import type { UnifyCheckoutSessionResult } from "@/lib/studentDiscount/unifyClient";

const COLLECTION = "studentDiscountSessions";
export const APPROVED_DISCOUNT_VALIDITY_MS = 15 * 60 * 1000;

export type StoredStudentDiscountSession = {
  checkoutId: string;
  uid: string;
  clientRequestId: string;
  cartFingerprint: string;
  verificationRequestId: string;
  verificationUrl: string;
  status: StudentDiscountStatus;
  failureCode?: string;
  expiresAt: string;
  completedAt?: string;
  discountValidUntil?: string;
  terminalEventId?: string;
};

function sessionRef(checkoutId: string) {
  return firebaseAdminDb().collection(COLLECTION).doc(checkoutId);
}

function approvedUntil(completedAt: string | undefined): string | undefined {
  if (!completedAt) return undefined;
  const completedTime = new Date(completedAt).getTime();
  if (!Number.isFinite(completedTime)) return undefined;
  return new Date(completedTime + APPROVED_DISCOUNT_VALIDITY_MS).toISOString();
}

export function publicSession(session: StoredStudentDiscountSession): StudentDiscountSession {
  const discountExpired = session.status === "APPROVED" && (
    !session.discountValidUntil || new Date(session.discountValidUntil).getTime() <= Date.now()
  );
  return {
    checkoutId: session.checkoutId,
    verificationRequestId: session.verificationRequestId,
    verificationUrl: session.verificationUrl,
    status: discountExpired ? "EXPIRED" : session.status,
    discountRate: STUDENT_DISCOUNT_RATE,
    expiresAt: session.expiresAt,
    ...(session.completedAt ? { completedAt: session.completedAt } : {}),
    ...(session.discountValidUntil ? { discountValidUntil: session.discountValidUntil } : {}),
    ...(discountExpired ? { failureCode: "DISCOUNT_VALIDITY_EXPIRED" } : session.failureCode ? { failureCode: session.failureCode } : {}),
  };
}

export async function getStoredSession(checkoutId: string): Promise<StoredStudentDiscountSession | null> {
  const snapshot = await sessionRef(checkoutId).get();
  return snapshot.exists ? snapshot.data() as StoredStudentDiscountSession : null;
}

export async function createStoredSession(input: {
  checkoutId: string;
  uid: string;
  clientRequestId: string;
  cartFingerprint: string;
  unify: UnifyCheckoutSessionResult;
}): Promise<StoredStudentDiscountSession> {
  if (!input.unify.verificationUrl) throw new Error("UNIFY did not return a verification URL.");
  if (input.unify.checkoutId !== input.checkoutId) throw new Error("UNIFY returned a mismatched checkout ID.");

  const created: StoredStudentDiscountSession = {
    checkoutId: input.checkoutId,
    uid: input.uid,
    clientRequestId: input.clientRequestId,
    cartFingerprint: input.cartFingerprint,
    verificationRequestId: input.unify.verificationRequestId,
    verificationUrl: input.unify.verificationUrl,
    status: input.unify.status,
    expiresAt: input.unify.expiresAt,
    ...(input.unify.failureCode ? { failureCode: input.unify.failureCode } : {}),
    ...(input.unify.completedAt ? { completedAt: input.unify.completedAt } : {}),
    ...(input.unify.status === "APPROVED" && input.unify.completedAt
      ? { discountValidUntil: approvedUntil(input.unify.completedAt) }
      : {}),
  };

  return firebaseAdminDb().runTransaction(async (transaction) => {
    const reference = sessionRef(input.checkoutId);
    const snapshot = await transaction.get(reference);
    if (snapshot.exists) return snapshot.data() as StoredStudentDiscountSession;
    transaction.create(reference, { ...created, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return created;
  });
}

export async function applyPolledResult(
  session: StoredStudentDiscountSession,
  result: UnifyCheckoutSessionResult,
): Promise<StoredStudentDiscountSession> {
  if (result.checkoutId !== session.checkoutId || result.verificationRequestId !== session.verificationRequestId) {
    throw new Error("UNIFY returned a result for a different checkout session.");
  }

  return firebaseAdminDb().runTransaction(async (transaction) => {
    const reference = sessionRef(session.checkoutId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error("The checkout session was removed while it was being refreshed.");
    const current = snapshot.data() as StoredStudentDiscountSession;
    // A signed webhook may complete while the polling request is in flight.
    // Never overwrite that terminal event with an older poll response.
    if (current.terminalEventId || current.status !== "PENDING") return current;

    const next: StoredStudentDiscountSession = {
      ...current,
      status: result.status,
      expiresAt: result.expiresAt,
      ...(result.failureCode ? { failureCode: result.failureCode } : {}),
      ...(result.completedAt ? { completedAt: result.completedAt } : {}),
      ...(result.status === "APPROVED" ? { discountValidUntil: approvedUntil(result.completedAt) } : {}),
    };
    transaction.set(reference, {
      status: next.status,
      expiresAt: next.expiresAt,
      failureCode: next.failureCode ?? FieldValue.delete(),
      completedAt: next.completedAt ?? FieldValue.delete(),
      discountValidUntil: next.discountValidUntil ?? FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return next;
  });
}

export async function applyWebhookResult(input: {
  eventId: string;
  checkoutId: string;
  verificationRequestId: string;
  status: Exclude<StudentDiscountStatus, "PENDING">;
  failureCode?: string;
  expiresAt?: string;
  completedAt?: string;
}): Promise<"applied" | "duplicate"> {
  return firebaseAdminDb().runTransaction(async (transaction) => {
    const reference = sessionRef(input.checkoutId);
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) throw new Error("The webhook checkout session was not found.");
    const session = snapshot.data() as StoredStudentDiscountSession;
    if (session.verificationRequestId !== input.verificationRequestId) {
      throw new Error("The webhook verification request does not match the checkout session.");
    }
    if (session.terminalEventId === input.eventId) return "duplicate";
    if (session.terminalEventId) throw new Error("A different terminal event was already recorded for this checkout.");

    const completedAt = input.completedAt ?? new Date().toISOString();
    transaction.set(reference, {
      terminalEventId: input.eventId,
      status: input.status,
      failureCode: input.failureCode ?? FieldValue.delete(),
      expiresAt: input.expiresAt ?? session.expiresAt,
      completedAt,
      discountValidUntil: input.status === "APPROVED"
        ? approvedUntil(completedAt)
        : FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return "applied";
  });
}
