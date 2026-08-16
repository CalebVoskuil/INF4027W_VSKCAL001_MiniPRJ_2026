import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  firebaseSignOut: vi.fn(),
  getDoc: vi.fn(),
  hashPassword: vi.fn(() => "hashed-password"),
  setDoc: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  verifyPassword: vi.fn(() => true),
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: mocks.createUserWithEmailAndPassword,
  onAuthStateChanged: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signOut: mocks.firebaseSignOut,
  updatePassword: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db: unknown, collection: string, id: string) => `${collection}/${id}`),
  getDoc: mocks.getDoc,
  setDoc: mocks.setDoc,
  Timestamp: { now: vi.fn(() => "timestamp") },
}));

vi.mock("@/lib/firebase/config", () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock("@/lib/crypto/password", () => ({
  generateSalt: vi.fn(() => "salt"),
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword,
}));

import { signIn, signUp } from "@/lib/firebase/auth";

describe("email and password authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-001", email: "student@example.com" },
    });
    mocks.signInWithEmailAndPassword.mockResolvedValue({
      user: { uid: "user-001", email: "student@example.com" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates an immediately usable account without verification fields or email calls", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const user = await signUp("student@example.com", "password123", "Ada", "Lovelace");

    expect(user).toMatchObject({
      uid: "user-001",
      email: "student@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "customer",
    });
    expect(user).not.toHaveProperty("emailVerified");
    expect(user).not.toHaveProperty("verificationToken");
    expect(mocks.setDoc).toHaveBeenCalledWith(
      "users/user-001",
      expect.not.objectContaining({
        emailVerified: expect.anything(),
        verificationToken: expect.anything(),
      })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("allows a legacy user whose stored emailVerified field is false to sign in", async () => {
    const legacyUser = {
      uid: "user-001",
      email: "student@example.com",
      firstName: "Ada",
      lastName: "Lovelace",
      role: "customer",
      demographics: { age: null, location: null },
      passwordHash: "hashed-password",
      salt: "salt",
      emailVerified: false,
      verificationToken: "legacy-token",
      createdAt: "timestamp",
      lastLoginAt: "timestamp",
    };
    mocks.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => legacyUser,
    });

    await expect(signIn("student@example.com", "password123")).resolves.toEqual(legacyUser);
    expect(mocks.verifyPassword).toHaveBeenCalledWith("password123", "hashed-password");
    expect(mocks.firebaseSignOut).not.toHaveBeenCalled();
  });
});
