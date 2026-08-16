import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  setUser: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/firebase/auth", () => ({
  signIn: mocks.signIn,
  signUp: mocks.signUp,
}));

vi.mock("@/store/authStore", () => ({
  useAuthStore: () => ({ setUser: mocks.setUser }),
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError, success: mocks.toastSuccess },
}));

import LoginPage from "@/app/(auth)/login/page";
import SignupPage from "@/app/(auth)/signup/page";

const user = {
  uid: "user-001",
  email: "student@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  role: "customer" as const,
  demographics: { age: null, location: null },
  passwordHash: "hashed-password",
  salt: "salt",
  createdAt: new Date("2026-08-16T12:00:00.000Z"),
  lastLoginAt: new Date("2026-08-16T12:00:00.000Z"),
};

describe("email and password auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUp.mockResolvedValue(user);
  });

  it("signs a newly registered customer in and returns to the storefront", async () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText("First Name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Last Name"), { target: { value: "Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: "student@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm Password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith(
        "student@example.com",
        "password123",
        "Ada",
        "Lovelace"
      );
    });
    expect(mocks.setUser).toHaveBeenCalledWith(user);
    expect(mocks.push).toHaveBeenCalledWith("/");
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Account created! Welcome to TechNest.");
  });

  it("exposes no Google or email-verification controls", () => {
    const signup = render(<SignupPage />);
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
    signup.unmount();

    render(<LoginPage />);
    expect(screen.queryByText("Continue with Google")).not.toBeInTheDocument();
    expect(screen.queryByText(/verification email/i)).not.toBeInTheDocument();
  });
});
