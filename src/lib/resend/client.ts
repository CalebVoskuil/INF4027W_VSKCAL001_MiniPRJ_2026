import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing RESEND_API_KEY environment variable. Add it to .env.local"
    );
  }
  // Only cache when we have a real key
  if (!resendInstance) {
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export default getResend;
