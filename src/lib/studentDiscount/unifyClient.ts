import "server-only";

import type { StudentDiscountStatus } from "@/lib/studentDiscount/types";

const UNIFY_TIMEOUT_MS = 8_000;

export type UnifyCheckoutSessionResult = {
  verificationRequestId: string;
  checkoutId: string;
  verificationUrl?: string;
  status: StudentDiscountStatus;
  failureCode?: string;
  expiresAt: string;
  completedAt?: string;
};

export class UnifyIntegrationError extends Error {
  constructor(message: string, readonly responseStatus?: number) {
    super(message);
  }
}

function integrationConfig() {
  const baseUrl = process.env.UNIFY_ADMIN_PORTAL_BASE_URL?.replace(/\/+$/, "");
  const apiKey = process.env.UNIFY_VENDOR_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new UnifyIntegrationError(
      "UNIFY is not configured. Set UNIFY_ADMIN_PORTAL_BASE_URL and UNIFY_VENDOR_API_KEY.",
    );
  }
  return { baseUrl, apiKey };
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string" || !value) throw new UnifyIntegrationError(`UNIFY returned an invalid ${key}.`);
  return value;
}

function parseStatus(value: unknown): StudentDiscountStatus {
  if (["PENDING", "APPROVED", "DECLINED", "EXPIRED", "FAILED"].includes(String(value))) {
    return value as StudentDiscountStatus;
  }
  throw new UnifyIntegrationError("UNIFY returned an unknown verification status.");
}

function parseUnifyResult(value: unknown): UnifyCheckoutSessionResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new UnifyIntegrationError("UNIFY returned an invalid verification response.");
  }
  const record = value as Record<string, unknown>;
  const result: UnifyCheckoutSessionResult = {
    verificationRequestId: requiredString(record, "verificationRequestId"),
    checkoutId: requiredString(record, "checkoutId"),
    status: parseStatus(record.status),
    expiresAt: requiredString(record, "expiresAt"),
  };
  if (typeof record.verificationUrl === "string") result.verificationUrl = record.verificationUrl;
  if (typeof record.failureCode === "string") result.failureCode = record.failureCode;
  if (typeof record.completedAt === "string") result.completedAt = record.completedAt;
  return result;
}

async function unifyRequest(path: string, init?: RequestInit): Promise<UnifyCheckoutSessionResult> {
  const { baseUrl, apiKey } = integrationConfig();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(UNIFY_TIMEOUT_MS),
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    throw new UnifyIntegrationError(error instanceof Error ? error.message : "UNIFY could not be reached.");
  }

  const body = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message = body && typeof body === "object" && "error" in body
      ? JSON.stringify((body as { error: unknown }).error)
      : `UNIFY returned HTTP ${response.status}.`;
    throw new UnifyIntegrationError(message, response.status);
  }
  return parseUnifyResult(body);
}

export function createUnifyCheckoutSession(checkoutId: string) {
  return unifyRequest("/api/vendor/v1/verification-sessions", {
    method: "POST",
    body: JSON.stringify({ checkoutId }),
  });
}

export function getUnifyCheckoutSession(verificationRequestId: string) {
  return unifyRequest(`/api/vendor/v1/verification-sessions/${encodeURIComponent(verificationRequestId)}`);
}
