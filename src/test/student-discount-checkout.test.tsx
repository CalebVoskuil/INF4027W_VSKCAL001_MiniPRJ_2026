import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getIdToken = vi.hoisted(() => vi.fn().mockResolvedValue("firebase-token"));
vi.mock("@/lib/firebase/config", () => ({
  auth: { currentUser: { getIdToken } },
}));

import StudentDiscountCard, {
  getStudentDiscountCartFingerprint,
  getStudentDiscountValidUntil,
  isStudentDiscountActive,
} from "@/components/checkout/StudentDiscountCard";
import type { StudentDiscountSession } from "@/lib/studentDiscount/types";

const approvedSession: StudentDiscountSession = {
  checkoutId: "checkout-001",
  verificationRequestId: "verification-001",
  verificationUrl: "https://verify.example/checkout/verification-001",
  status: "APPROVED",
  discountRate: 0.1,
  expiresAt: "2026-08-16T12:05:00.000Z",
  completedAt: "2026-08-16T12:00:00.000Z",
};

const pendingSession: StudentDiscountSession = {
  ...approvedSession,
  status: "PENDING",
  completedAt: undefined,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("student discount checkout state", () => {
  it("uses an order-independent fingerprint for the displayed cart", () => {
    const cart = [
      { productId: "phone-b", quantity: 1, unitPrice: 8_999.99 },
      { productId: "phone-a", quantity: 2, unitPrice: 3_500 },
    ];

    expect(getStudentDiscountCartFingerprint(cart)).toBe(
      getStudentDiscountCartFingerprint([...cart].reverse())
    );
  });

  it("invalidates the checkout fingerprint when quantity or price changes", () => {
    const cart = [{ productId: "phone-a", quantity: 1, unitPrice: 1_000 }];

    expect(getStudentDiscountCartFingerprint(cart)).not.toBe(
      getStudentDiscountCartFingerprint([{ ...cart[0], quantity: 2 }])
    );
    expect(getStudentDiscountCartFingerprint(cart)).not.toBe(
      getStudentDiscountCartFingerprint([{ ...cart[0], unitPrice: 999 }])
    );
  });

  it("keeps an approval for fifteen minutes after completion", () => {
    const validUntil = Date.parse("2026-08-16T12:15:00.000Z");

    expect(getStudentDiscountValidUntil(approvedSession)).toBe(validUntil);
    expect(isStudentDiscountActive(approvedSession, validUntil - 1)).toBe(true);
    expect(isStudentDiscountActive(approvedSession, validUntil)).toBe(false);
  });

  it("never treats a non-approved result as an active discount", () => {
    expect(
      isStudentDiscountActive(
        { ...approvedSession, status: "DECLINED" },
        Date.parse("2026-08-16T12:01:00.000Z")
      )
    ).toBe(false);
  });

  it("ignores and aborts a session response from the previous cart", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    let requestSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      requestSignal = init?.signal ?? undefined;
      return new Promise<Response>((resolve) => {
        resolveRequest = resolve;
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    const onSessionChange = vi.fn();
    const originalCart = [{ productId: "phone-a", quantity: 1, unitPrice: 1_000 }];
    const changedCart = [{ productId: "phone-a", quantity: 2, unitPrice: 1_000 }];
    const view = render(
      <StudentDiscountCard cart={originalCart} onSessionChange={onSessionChange} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Verify student status" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    view.rerender(
      <StudentDiscountCard cart={changedCart} onSessionChange={onSessionChange} />
    );
    await waitFor(() => expect(requestSignal?.aborted).toBe(true));

    await act(async () => {
      resolveRequest?.(
        new Response(JSON.stringify(approvedSession), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      );
      await Promise.resolve();
    });

    expect(onSessionChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ verificationRequestId: "verification-001" })
    );
    expect(screen.queryByText("Student status verified")).not.toBeInTheDocument();
    expect(
      screen.getByText("Your cart changed, so it needs a new student verification.")
    ).toBeInTheDocument();
  });

  it("reuses the client request ID after an ambiguous creation failure", async () => {
    const requestBodies: Array<{ clientRequestId: string }> = [];
    const fetchMock = vi
      .fn(async (_url: string | URL | Request, init?: RequestInit) => {
        requestBodies.push(JSON.parse(String(init?.body)) as { clientRequestId: string });
        if (requestBodies.length === 1) throw new TypeError("network interrupted");
        return new Response(JSON.stringify(pendingSession), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <StudentDiscountCard
        cart={[{ productId: "phone-a", quantity: 1, unitPrice: 1_000 }]}
        onSessionChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Verify student status" }));
    await screen.findByText("network interrupted");
    fireEvent.click(screen.getByRole("button", { name: "Try verification again" }));
    await screen.findByText("Waiting for your wallet");

    expect(requestBodies).toHaveLength(2);
    expect(requestBodies[1].clientRequestId).toBe(requestBodies[0].clientRequestId);
  });

  it("cancels a pending local verification and aborts its polling", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(pendingSession), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    const onSessionChange = vi.fn();
    render(
      <StudentDiscountCard
        cart={[{ productId: "phone-a", quantity: 1, unitPrice: 1_000 }]}
        onSessionChange={onSessionChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Verify student status" }));
    await screen.findByText("Waiting for your wallet");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("Waiting for your wallet")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verify student status" })).toBeInTheDocument();
    expect(onSessionChange).toHaveBeenLastCalledWith(null);
  });

  it("does not overlap polling requests when a previous GET is still pending", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(pendingSession), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        })
      )
      .mockImplementation(() => new Promise<Response>(() => undefined));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <StudentDiscountCard
        cart={[{ productId: "phone-a", quantity: 1, unitPrice: 1_000 }]}
        onSessionChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Verify student status" }));
    await screen.findByText("Waiting for your wallet");
    await new Promise((resolve) => window.setTimeout(resolve, 4_500));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      `/api/student-discount/sessions/${pendingSession.checkoutId}`
    );
  }, 8_000);
});
