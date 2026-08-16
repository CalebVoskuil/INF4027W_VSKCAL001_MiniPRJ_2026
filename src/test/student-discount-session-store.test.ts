import { beforeEach, describe, expect, it, vi } from "vitest";

const firestore = vi.hoisted(() => {
  const reference = { id: "checkout-001" };
  const transaction = { get: vi.fn(), set: vi.fn() };
  const db = {
    collection: vi.fn(() => ({ doc: vi.fn(() => reference) })),
    runTransaction: vi.fn(async (handler: (value: typeof transaction) => unknown) => handler(transaction)),
  };
  return { db, reference, transaction };
});

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebase/admin", () => ({ firebaseAdminDb: () => firestore.db }));

import { applyPolledResult, type StoredStudentDiscountSession } from "@/lib/studentDiscount/sessionStore";

const pending: StoredStudentDiscountSession = {
  checkoutId: "checkout-001",
  uid: "customer-001",
  clientRequestId: "request-001",
  cartFingerprint: "cart-fingerprint",
  verificationRequestId: "verification-001",
  verificationUrl: "https://example.test/verify/checkout/verification-001",
  status: "PENDING",
  expiresAt: "2026-08-16T12:05:00.000Z",
};

describe("student discount polling persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not overwrite a terminal webhook event with a stale pending poll", async () => {
    const webhookCompleted: StoredStudentDiscountSession = {
      ...pending,
      status: "APPROVED",
      terminalEventId: "event-001",
      completedAt: "2026-08-16T12:01:00.000Z",
      discountValidUntil: "2026-08-16T12:16:00.000Z",
    };
    firestore.transaction.get.mockResolvedValue({ exists: true, data: () => webhookCompleted });

    const result = await applyPolledResult(pending, {
      verificationRequestId: pending.verificationRequestId,
      checkoutId: pending.checkoutId,
      status: "PENDING",
      expiresAt: pending.expiresAt,
    });

    expect(result).toEqual(webhookCompleted);
    expect(firestore.transaction.set).not.toHaveBeenCalled();
  });

  it("stores the authoritative poll result when the current session is still pending", async () => {
    firestore.transaction.get.mockResolvedValue({ exists: true, data: () => pending });

    const result = await applyPolledResult(pending, {
      verificationRequestId: pending.verificationRequestId,
      checkoutId: pending.checkoutId,
      status: "DECLINED",
      failureCode: "STUDENT_NOT_REGISTERED",
      expiresAt: pending.expiresAt,
      completedAt: "2026-08-16T12:01:00.000Z",
    });

    expect(result.status).toBe("DECLINED");
    expect(firestore.transaction.set).toHaveBeenCalledOnce();
  });
});
