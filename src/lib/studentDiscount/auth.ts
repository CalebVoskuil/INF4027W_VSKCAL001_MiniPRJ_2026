import type { NextRequest } from "next/server";

import { firebaseAdminAuth } from "@/lib/firebase/admin";

export class CustomerAuthError extends Error {}

export async function authenticatedCustomerId(request: NextRequest): Promise<string> {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw new CustomerAuthError("A Firebase ID token is required.");

  const auth = firebaseAdminAuth();
  try {
    return (await auth.verifyIdToken(token, true)).uid;
  } catch {
    throw new CustomerAuthError("The Firebase ID token is invalid or expired.");
  }
}
