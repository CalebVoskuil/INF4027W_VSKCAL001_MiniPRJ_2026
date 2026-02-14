import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import getResend from "@/lib/resend/client";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const subscribersRef = collection(db, "newsletter_subscribers");
    const q = query(subscribersRef, where("email", "==", email.toLowerCase()));
    const existing = await getDocs(q);

    if (!existing.empty) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 409 }
      );
    }

    // Store in Firestore
    await addDoc(subscribersRef, {
      email: email.toLowerCase(),
      subscribedAt: Timestamp.now(),
    });

    // Send welcome email via Resend
    try {
      const resend = getResend();
      await resend.emails.send({
        from: "TechNest <newsletter@voskuils.com>",
        to: [email],
        subject: "Welcome to the TechNest Newsletter!",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
                    <tr>
                      <td style="padding:32px 32px 24px;text-align:center;">
                        <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">
                          TechNest<span style="color:#9ca3af;">.</span>
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 32px 32px;">
                        <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#1a1a1a;">
                          You're subscribed!
                        </h2>
                        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6b7280;">
                          Thanks for subscribing to the TechNest newsletter. You'll be the first to know about new phone releases, exclusive deals, and tech insights.
                        </p>
                        <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                          Stay tuned — great things are coming!
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#9ca3af;">
                          &copy; ${new Date().getFullYear()} TechNest. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    } catch (emailError) {
      // Don't fail the subscription if the welcome email fails
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
