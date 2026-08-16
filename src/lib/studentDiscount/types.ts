export const STUDENT_DISCOUNT_RATE = 0.1 as const;

export type StudentDiscountStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "EXPIRED"
  | "FAILED";

export type StudentDiscountCartLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type StudentDiscountSession = {
  checkoutId: string;
  verificationRequestId: string;
  verificationUrl: string;
  status: StudentDiscountStatus;
  discountRate: typeof STUDENT_DISCOUNT_RATE;
  expiresAt: string;
  completedAt?: string;
  discountValidUntil?: string;
  failureCode?: string;
};

export type CreateStudentDiscountSessionRequest = {
  clientRequestId: string;
  cart: StudentDiscountCartLine[];
};

export type UnifyVerificationWebhookPayload = {
  eventId: string;
  verificationRequestId: string;
  checkoutId?: string;
  status: StudentDiscountStatus;
  failureCode?: string;
  expiresAt?: string;
  completedAt?: string;
};
