import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  addDoc: vi.fn(),
  getDocs: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: mocks.addDoc,
  collection: vi.fn((_db: unknown, name: string) => name),
  getDocs: mocks.getDocs,
  query: vi.fn((collection: string) => collection),
  Timestamp: { now: vi.fn(() => "timestamp") },
  where: vi.fn(),
}));

vi.mock("@/lib/firebase/config", () => ({ db: {} }));

import { POST } from "@/app/api/newsletter/subscribe/route";

describe("newsletter subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getDocs.mockResolvedValue({ empty: true });
    mocks.addDoc.mockResolvedValue({ id: "subscription-001" });
  });

  it("stores a valid subscriber and succeeds without an email provider", async () => {
    const request = new Request("http://localhost/api/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Student@Example.com" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ success: true });
    expect(mocks.addDoc).toHaveBeenCalledWith("newsletter_subscribers", {
      email: "student@example.com",
      subscribedAt: "timestamp",
    });
  });
});
