import { createHmac } from "node:crypto";

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ applyWebhookResult: vi.fn() }));
vi.mock("@/lib/studentDiscount/sessionStore", () => store);

import { POST } from "@/app/api/webhooks/unify/verification/route";

const secret = "test-webhook-secret";
const payload = {
  eventId: "event-001",
  verificationRequestId: "verification-001",
  checkoutId: "checkout-001",
  status: "APPROVED",
  expiresAt: "2026-08-16T12:05:00.000Z",
  completedAt: "2026-08-16T12:01:00.000Z",
};

function webhookRequest(body: string, overrides: Record<string, string> = {}) {
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  return new NextRequest("https://store.example/api/webhooks/unify/verification", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "x-unify-event-id": payload.eventId,
      "x-unify-signature": signature,
      ...overrides,
    },
  });
}

describe("UNIFY verification webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("UNIFY_VENDOR_WEBHOOK_SECRET", secret);
    store.applyWebhookResult.mockResolvedValue("applied");
  });

  it("records an authenticated terminal result using only checkout metadata", async () => {
    const response = await POST(webhookRequest(JSON.stringify(payload)));

    expect(response.status).toBe(200);
    expect(store.applyWebhookResult).toHaveBeenCalledWith(payload);
    await expect(response.json()).resolves.toEqual({ received: true, duplicate: false });
  });

  it("rejects a signature calculated for a different body", async () => {
    const body = JSON.stringify(payload);
    const request = webhookRequest(body, { "x-unify-signature": `sha256=${"0".repeat(64)}` });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(store.applyWebhookResult).not.toHaveBeenCalled();
  });

  it("rejects pending events and mismatched event headers", async () => {
    const pending = JSON.stringify({ ...payload, status: "PENDING" });
    expect((await POST(webhookRequest(pending))).status).toBe(400);

    const terminal = JSON.stringify(payload);
    expect((await POST(webhookRequest(terminal, { "x-unify-event-id": "another-event" }))).status).toBe(400);
    expect(store.applyWebhookResult).not.toHaveBeenCalled();
  });

  it("rejects signed malformed JSON before calling the session store", async () => {
    const response = await POST(webhookRequest("{not-json"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid verification event." });
    expect(store.applyWebhookResult).not.toHaveBeenCalled();
  });

  it("returns 404 when the signed event references a checkout that is not stored", async () => {
    store.applyWebhookResult.mockRejectedValue(new Error("The webhook checkout session was not found."));

    const response = await POST(webhookRequest(JSON.stringify(payload)));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Verification session not found." });
  });

  it("returns 409 when verification and checkout identifiers do not match", async () => {
    store.applyWebhookResult.mockRejectedValue(
      new Error("The webhook verification request does not match the checkout session."),
    );

    const response = await POST(webhookRequest(JSON.stringify(payload)));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Verification event does not match the checkout.",
    });
  });

  it("acknowledges a replayed event without writing a second terminal result", async () => {
    store.applyWebhookResult.mockResolvedValue("duplicate");
    const response = await POST(webhookRequest(JSON.stringify(payload)));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true, duplicate: true });
  });
});
