"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase/config";
import type {
  CreateStudentDiscountSessionRequest,
  StudentDiscountCartLine,
  StudentDiscountSession,
} from "@/lib/studentDiscount/types";

const POLL_INTERVAL_MS = 2_000;
const APPROVAL_VALIDITY_MS = 15 * 60 * 1_000;

type StudentDiscountCardProps = {
  cart: StudentDiscountCartLine[];
  onSessionChange: (session: StudentDiscountSession | null) => void;
};

type ErrorResponse = {
  message?: string;
  error?: string;
};

type GuardedRequest = {
  controller: AbortController;
  generation: number;
  cartFingerprint: string;
};

export function getStudentDiscountCartFingerprint(
  cart: StudentDiscountCartLine[]
): string {
  return JSON.stringify(
    [...cart]
      .sort((left, right) => left.productId.localeCompare(right.productId))
      .map(({ productId, quantity, unitPrice }) => ({
        productId,
        quantity,
        unitPrice,
      }))
  );
}

export function getStudentDiscountValidUntil(
  session: StudentDiscountSession
): number | null {
  if (session.discountValidUntil) {
    const timestamp = Date.parse(session.discountValidUntil);
    return Number.isNaN(timestamp) ? null : timestamp;
  }

  if (session.completedAt) {
    const completedAt = Date.parse(session.completedAt);
    return Number.isNaN(completedAt)
      ? null
      : completedAt + APPROVAL_VALIDITY_MS;
  }

  return null;
}

export function isStudentDiscountActive(
  session: StudentDiscountSession | null,
  now = Date.now()
): session is StudentDiscountSession {
  if (!session || session.status !== "APPROVED") return false;

  const validUntil = getStudentDiscountValidUntil(session);
  return validUntil !== null && validUntil > now;
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.message ?? body.error ?? "Student verification could not be completed.";
  } catch {
    return "Student verification could not be completed.";
  }
}

async function getIdToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("Please sign in again before verifying your student status.");
  }

  return currentUser.getIdToken();
}

function formatTimeRemaining(expiresAt: string): string | null {
  const expiry = Date.parse(expiresAt);
  if (Number.isNaN(expiry)) return null;

  const remainingSeconds = Math.max(0, Math.ceil((expiry - Date.now()) / 1_000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function StudentDiscountCard({
  cart,
  onSessionChange,
}: StudentDiscountCardProps) {
  const [session, setSession] = useState<StudentDiscountSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cartChanged, setCartChanged] = useState(false);
  const cartFingerprint = useMemo(
    () => getStudentDiscountCartFingerprint(cart),
    [cart]
  );
  const previousCartFingerprint = useRef(cartFingerprint);
  const currentCartFingerprint = useRef(cartFingerprint);
  currentCartFingerprint.current = cartFingerprint;
  const requestGeneration = useRef(0);
  const outstandingRequests = useRef(new Set<AbortController>());
  const clientRequestId = useRef<string | null>(null);
  const onSessionChangeRef = useRef(onSessionChange);

  useEffect(() => {
    onSessionChangeRef.current = onSessionChange;
  }, [onSessionChange]);

  const publishSession = useCallback((nextSession: StudentDiscountSession | null) => {
    setSession(nextSession);
    onSessionChangeRef.current(nextSession);
  }, []);

  const abortOutstandingRequests = useCallback(() => {
    requestGeneration.current += 1;
    outstandingRequests.current.forEach((controller) => controller.abort());
    outstandingRequests.current.clear();
  }, []);

  const createGuardedRequest = useCallback((): GuardedRequest => {
    const controller = new AbortController();
    outstandingRequests.current.add(controller);
    return {
      controller,
      generation: requestGeneration.current,
      cartFingerprint: currentCartFingerprint.current,
    };
  }, []);

  const requestIsCurrent = useCallback((request: GuardedRequest): boolean => {
    return (
      !request.controller.signal.aborted &&
      request.generation === requestGeneration.current &&
      request.cartFingerprint === currentCartFingerprint.current
    );
  }, []);

  const finishRequest = useCallback((request: GuardedRequest) => {
    outstandingRequests.current.delete(request.controller);
  }, []);

  const refreshSession = useCallback(
    async (checkoutId: string): Promise<StudentDiscountSession | null> => {
      const guardedRequest = createGuardedRequest();
      try {
        const token = await getIdToken();
        if (!requestIsCurrent(guardedRequest)) return null;

        const response = await fetch(
          `/api/student-discount/sessions/${encodeURIComponent(checkoutId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
            signal: guardedRequest.controller.signal,
          }
        );
        if (!requestIsCurrent(guardedRequest)) return null;

        if (!response.ok) {
          const message = await getErrorMessage(response);
          if (!requestIsCurrent(guardedRequest)) return null;
          throw new Error(message);
        }

        const nextSession = (await response.json()) as StudentDiscountSession;
        if (!requestIsCurrent(guardedRequest)) return null;

        publishSession(nextSession);
        setErrorMessage(null);
        return nextSession;
      } catch (error) {
        if (!requestIsCurrent(guardedRequest)) return null;
        throw error;
      } finally {
        finishRequest(guardedRequest);
      }
    },
    [createGuardedRequest, finishRequest, publishSession, requestIsCurrent]
  );

  useEffect(() => {
    return () => abortOutstandingRequests();
  }, [abortOutstandingRequests]);

  useEffect(() => {
    if (previousCartFingerprint.current === cartFingerprint) return;

    const hadVerification = session !== null || starting;
    abortOutstandingRequests();
    clientRequestId.current = null;
    previousCartFingerprint.current = cartFingerprint;
    setStarting(false);
    setErrorMessage(null);
    publishSession(null);
    setCartChanged(hadVerification);
  }, [abortOutstandingRequests, cartFingerprint, publishSession, session, starting]);

  useEffect(() => {
    if (!session || session.status !== "PENDING") return;

    let cancelled = false;
    let pollInFlight = false;
    const poll = async () => {
      if (cancelled || pollInFlight) return;
      pollInFlight = true;
      try {
        await refreshSession(session.checkoutId);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to check verification status."
          );
        }
      } finally {
        pollInFlight = false;
      }
    };

    const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [refreshSession, session]);

  useEffect(() => {
    if (!session || session.status !== "APPROVED") return;

    const validUntil = getStudentDiscountValidUntil(session);
    if (validUntil === null) return;

    const expireApproval = () => {
      publishSession({
        ...session,
        status: "EXPIRED",
        failureCode: "DISCOUNT_WINDOW_EXPIRED",
      });
    };
    const remainingMs = validUntil - Date.now();

    if (remainingMs <= 0) {
      expireApproval();
      return;
    }

    const timeoutId = window.setTimeout(expireApproval, remainingMs);
    return () => window.clearTimeout(timeoutId);
  }, [publishSession, session]);

  const startVerification = async (newAttempt = false) => {
    abortOutstandingRequests();
    const guardedRequest = createGuardedRequest();
    if (newAttempt) clientRequestId.current = null;
    clientRequestId.current ??= crypto.randomUUID();
    setStarting(true);
    setErrorMessage(null);
    setCartChanged(false);
    publishSession(null);

    try {
      const token = await getIdToken();
      if (!requestIsCurrent(guardedRequest)) return;

      const body: CreateStudentDiscountSessionRequest = {
        clientRequestId: clientRequestId.current,
        cart,
      };
      const response = await fetch("/api/student-discount/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: guardedRequest.controller.signal,
      });

      if (!requestIsCurrent(guardedRequest)) return;

      if (!response.ok) {
        const message = await getErrorMessage(response);
        if (!requestIsCurrent(guardedRequest)) return;
        throw new Error(message);
      }

      const nextSession = (await response.json()) as StudentDiscountSession;
      if (!requestIsCurrent(guardedRequest)) return;

      publishSession(nextSession);
    } catch (error) {
      if (!requestIsCurrent(guardedRequest)) return;
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start student verification."
      );
    } finally {
      if (requestIsCurrent(guardedRequest)) setStarting(false);
      finishRequest(guardedRequest);
    }
  };

  const cancelVerification = () => {
    abortOutstandingRequests();
    clientRequestId.current = null;
    setStarting(false);
    setErrorMessage(null);
    setCartChanged(false);
    publishSession(null);
  };

  const isPending = session?.status === "PENDING";
  const pendingTimeRemaining = isPending && session
    ? formatTimeRemaining(session.expiresAt)
    : null;
  const canRetry =
    session?.status === "DECLINED" ||
    session?.status === "EXPIRED" ||
    session?.status === "FAILED" ||
    errorMessage !== null;

  return (
    <section
      aria-labelledby="student-discount-heading"
      className="border-y border-gray-200 py-4"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-emerald-50 p-2 text-emerald-700">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="student-discount-heading" className="text-sm font-semibold text-gray-950">
            UNIFY Student Discount
          </h3>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Verify with your UNIFY Wallet to save 10% on this order.
          </p>
        </div>
      </div>

      {!session && !starting ? (
        <div className="mt-4">
          {cartChanged ? (
            <p className="mb-3 text-xs text-amber-700" role="status">
              Your cart changed, so it needs a new student verification.
            </p>
          ) : null}
          {errorMessage ? (
            <p className="mb-3 text-xs text-red-600" role="alert">
              {errorMessage}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full border-emerald-700 text-emerald-800 hover:bg-emerald-50"
            onClick={() => void startVerification()}
          >
            {canRetry ? <RefreshCw className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            {canRetry ? "Try verification again" : "Verify student status"}
          </Button>
        </div>
      ) : null}

      {starting ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600" role="status">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Creating a secure verification…
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full text-gray-600"
            onClick={cancelVerification}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {isPending && session ? (
        <div className="mt-4" aria-live="polite">
          <div className="mx-auto w-fit rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <QRCodeSVG
              value={session.verificationUrl}
              size={176}
              level="M"
              marginSize={1}
              title="UNIFY student verification QR code"
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-600">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" aria-hidden="true" />
            Waiting for your wallet
          </div>
          {pendingTimeRemaining ? (
            <p className="mt-1 text-center text-[11px] text-gray-500">
              Expires in {pendingTimeRemaining}
            </p>
          ) : null}
          <a
            href={session.verificationUrl}
            className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Open UNIFY Wallet
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <p className="mt-2 text-center text-[11px] leading-4 text-gray-500">
            Scan on another device, or use the button on this phone. You approve exactly what is shared.
          </p>
          {errorMessage ? (
            <p className="mt-3 text-center text-xs text-amber-700" role="status">
              {errorMessage} We will keep checking.
            </p>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full text-gray-600"
            onClick={cancelVerification}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      {session?.status === "APPROVED" ? (
        <div className="mt-4 flex items-start gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-emerald-800" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Student status verified</p>
            <p className="mt-0.5 text-xs">Your 10% discount has been applied.</p>
          </div>
        </div>
      ) : null}

      {session && ["DECLINED", "EXPIRED", "FAILED"].includes(session.status) ? (
        <div className="mt-4">
          <div className="flex items-start gap-2 text-sm text-amber-800" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <p>
              {session.status === "DECLINED"
                ? "We could not confirm an eligible student credential."
                : session.status === "EXPIRED"
                  ? "This verification has expired."
                  : "Student verification could not be completed."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={() => void startVerification(true)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : null}
    </section>
  );
}
