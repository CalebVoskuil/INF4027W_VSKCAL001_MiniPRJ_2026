import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dependencies = vi.hoisted(() => ({
  authenticatedCustomerId: vi.fn(),
  cartFingerprint: vi.fn(),
  deterministicCheckoutId: vi.fn(),
  createStoredSession: vi.fn(),
  getStoredSession: vi.fn(),
  publicSession: vi.fn((session: unknown) => session),
  applyPolledResult: vi.fn(),
  createUnifyCheckoutSession: vi.fn(),
  getUnifyCheckoutSession: vi.fn(),
}));

vi.mock("@/lib/studentDiscount/auth", () => ({
  authenticatedCustomerId: dependencies.authenticatedCustomerId,
  CustomerAuthError: class CustomerAuthError extends Error {},
}));

vi.mock("@/lib/studentDiscount/cart", () => ({
  cartFingerprint: dependencies.cartFingerprint,
  deterministicCheckoutId: dependencies.deterministicCheckoutId,
}));

vi.mock("@/lib/studentDiscount/sessionStore", () => ({
  applyPolledResult: dependencies.applyPolledResult,
  createStoredSession: dependencies.createStoredSession,
  getStoredSession: dependencies.getStoredSession,
  publicSession: dependencies.publicSession,
}));

vi.mock("@/lib/studentDiscount/unifyClient", () => ({
  createUnifyCheckoutSession: dependencies.createUnifyCheckoutSession,
  getUnifyCheckoutSession: dependencies.getUnifyCheckoutSession,
  UnifyIntegrationError: class UnifyIntegrationError extends Error {},
}));

import { GET } from "@/app/api/student-discount/sessions/[checkoutId]/route";
import { POST } from "@/app/api/student-discount/sessions/route";
import { CustomerAuthError } from "@/lib/studentDiscount/auth";
import { UnifyIntegrationError } from "@/lib/studentDiscount/unifyClient";

const cart = [{ productId: "phone-001", quantity: 1, unitPrice: 8_999.99 }];
const pendingSession = {
  checkoutId: "checkout-001",
  uid: "customer-001",
  clientRequestId: "request-001",
  cartFingerprint: "fingerprint-001",
  verificationRequestId: "verification-001",
  verificationUrl: "https://voskuils.com/verify/checkout/verification-001?token=claim-token-value-001",
  status: "PENDING" as const,
  expiresAt: "2026-08-16T12:05:00.000Z",
};

const unifyPending = {
  verificationRequestId: pendingSession.verificationRequestId,
  checkoutId: pendingSession.checkoutId,
  verificationUrl: pendingSession.verificationUrl,
  status: "PENDING" as const,
  expiresAt: pendingSession.expiresAt,
};

function postRequest(body: unknown) {
  return new NextRequest("https://store.example/api/student-discount/sessions", {
    method: "POST",
    headers: { authorization: "Bearer firebase-token", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getRequest(checkoutId = pendingSession.checkoutId) {
  return new NextRequest(`https://store.example/api/student-discount/sessions/${checkoutId}`, {
    headers: { authorization: "Bearer firebase-token" },
  });
}

function getContext(checkoutId = pendingSession.checkoutId) {
  return { params: Promise.resolve({ checkoutId }) };
}

describe("student discount session creation route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.authenticatedCustomerId.mockResolvedValue(pendingSession.uid);
    dependencies.deterministicCheckoutId.mockReturnValue(pendingSession.checkoutId);
    dependencies.cartFingerprint.mockReturnValue(pendingSession.cartFingerprint);
    dependencies.getStoredSession.mockResolvedValue(null);
    dependencies.createUnifyCheckoutSession.mockResolvedValue(unifyPending);
    dependencies.createStoredSession.mockResolvedValue(pendingSession);
  });

  it("rejects an unauthenticated request before reading or creating checkout state", async () => {
    dependencies.authenticatedCustomerId.mockRejectedValue(new CustomerAuthError("A Firebase ID token is required."));

    const response = await POST(postRequest({ clientRequestId: "request-001", cart }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "A Firebase ID token is required." });
    expect(dependencies.getStoredSession).not.toHaveBeenCalled();
    expect(dependencies.createUnifyCheckoutSession).not.toHaveBeenCalled();
  });

  it("creates and stores one Agent-authoritative checkout session", async () => {
    const response = await POST(postRequest({ clientRequestId: "request-001", cart }));

    expect(response.status).toBe(201);
    expect(dependencies.deterministicCheckoutId).toHaveBeenCalledWith(pendingSession.uid, "request-001");
    expect(dependencies.cartFingerprint).toHaveBeenCalledWith(cart);
    expect(dependencies.createUnifyCheckoutSession).toHaveBeenCalledWith(pendingSession.checkoutId);
    expect(dependencies.createStoredSession).toHaveBeenCalledWith({
      checkoutId: pendingSession.checkoutId,
      uid: pendingSession.uid,
      clientRequestId: "request-001",
      cartFingerprint: pendingSession.cartFingerprint,
      unify: unifyPending,
    });
    await expect(response.json()).resolves.toEqual(pendingSession);
  });

  it("reuses an idempotent session for the same customer and exact cart", async () => {
    dependencies.getStoredSession.mockResolvedValue(pendingSession);

    const response = await POST(postRequest({ clientRequestId: "request-001", cart }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(pendingSession);
    expect(dependencies.createUnifyCheckoutSession).not.toHaveBeenCalled();
    expect(dependencies.createStoredSession).not.toHaveBeenCalled();
  });

  it("does not reveal a session owned by another customer", async () => {
    dependencies.getStoredSession.mockResolvedValue({ ...pendingSession, uid: "another-customer" });

    const response = await POST(postRequest({ clientRequestId: "request-001", cart }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Verification session not found." });
    expect(dependencies.createUnifyCheckoutSession).not.toHaveBeenCalled();
  });

  it("rejects reuse when the idempotency key is bound to a different cart", async () => {
    dependencies.getStoredSession.mockResolvedValue({ ...pendingSession, cartFingerprint: "another-fingerprint" });

    const response = await POST(postRequest({ clientRequestId: "request-001", cart }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "The cart changed. Start a new verification request.",
    });
    expect(dependencies.createUnifyCheckoutSession).not.toHaveBeenCalled();
  });

  it("maps upstream UNIFY failures to a generic 502 response", async () => {
    dependencies.createUnifyCheckoutSession.mockRejectedValue(new UnifyIntegrationError("Agent timed out."));

    const response = await POST(postRequest({ clientRequestId: "request-001", cart }));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Student verification is temporarily unavailable." });
  });
});

describe("student discount session result route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dependencies.authenticatedCustomerId.mockResolvedValue(pendingSession.uid);
    dependencies.getStoredSession.mockResolvedValue(pendingSession);
    dependencies.getUnifyCheckoutSession.mockResolvedValue(unifyPending);
    dependencies.applyPolledResult.mockResolvedValue(pendingSession);
  });

  it("rejects unauthenticated polling before loading checkout state", async () => {
    dependencies.authenticatedCustomerId.mockRejectedValue(new CustomerAuthError("The Firebase ID token is invalid or expired."));

    const response = await GET(getRequest(), getContext());

    expect(response.status).toBe(401);
    expect(dependencies.getStoredSession).not.toHaveBeenCalled();
    expect(dependencies.getUnifyCheckoutSession).not.toHaveBeenCalled();
  });

  it("hides another customer's checkout session", async () => {
    dependencies.getStoredSession.mockResolvedValue({ ...pendingSession, uid: "another-customer" });

    const response = await GET(getRequest(), getContext());

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Verification session not found." });
    expect(dependencies.getUnifyCheckoutSession).not.toHaveBeenCalled();
  });

  it("polls UNIFY and persists the result while a checkout is pending", async () => {
    const approved = {
      ...pendingSession,
      status: "APPROVED" as const,
      completedAt: "2026-08-16T12:01:00.000Z",
      discountValidUntil: "2026-08-16T12:16:00.000Z",
    };
    dependencies.applyPolledResult.mockResolvedValue(approved);

    const response = await GET(getRequest(), getContext());

    expect(response.status).toBe(200);
    expect(dependencies.getUnifyCheckoutSession).toHaveBeenCalledWith(pendingSession.verificationRequestId);
    expect(dependencies.applyPolledResult).toHaveBeenCalledWith(pendingSession, unifyPending);
    await expect(response.json()).resolves.toEqual(approved);
  });

  it("returns a terminal local result without polling UNIFY again", async () => {
    const approved = {
      ...pendingSession,
      status: "APPROVED" as const,
      completedAt: "2026-08-16T12:01:00.000Z",
      discountValidUntil: "2026-08-16T12:16:00.000Z",
    };
    dependencies.getStoredSession.mockResolvedValue(approved);

    const response = await GET(getRequest(), getContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(approved);
    expect(dependencies.getUnifyCheckoutSession).not.toHaveBeenCalled();
    expect(dependencies.applyPolledResult).not.toHaveBeenCalled();
  });

  it("maps an upstream polling failure to 502 without replacing local state", async () => {
    dependencies.getUnifyCheckoutSession.mockRejectedValue(new UnifyIntegrationError("Agent unavailable."));

    const response = await GET(getRequest(), getContext());

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: "Unable to refresh student verification." });
    expect(dependencies.applyPolledResult).not.toHaveBeenCalled();
  });
});
