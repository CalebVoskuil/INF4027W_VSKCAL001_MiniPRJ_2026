import { NextRequest, NextResponse } from "next/server";
import getResend from "@/lib/resend/client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { email, firstName, token, uid } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // If uid/token not provided, look up the user by email in Firestore
    if (!uid || !token) {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return NextResponse.json(
          { error: "No account found with this email" },
          { status: 404 }
        );
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      uid = userDoc.id;
      token = userData.verificationToken;
      firstName = firstName || userData.firstName || "";

      if (!token) {
        return NextResponse.json(
          { error: "Account is already verified" },
          { status: 400 }
        );
      }
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}&uid=${uid}`;

    const resend = getResend();
    await resend.emails.send({
      from: "TechNest <noreply@voskuils.com>",
      to: [email],
      subject: "Verify your email — TechNest",
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
                  <!-- Header -->
                  <tr>
                    <td style="padding:32px 32px 24px;text-align:center;">
                      <h1 style="margin:0;font-size:22px;font-weight:700;color:#1a1a1a;letter-spacing:-0.5px;">
                        TechNest<span style="color:#9ca3af;">.</span>
                      </h1>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:0 32px 32px;">
                      <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#1a1a1a;">
                        Welcome${firstName ? `, ${firstName}` : ""}!
                      </h2>
                      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6b7280;">
                        Thanks for creating a TechNest account. Please verify your email address by clicking the button below.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${verifyUrl}" 
                               style="display:inline-block;padding:12px 32px;background-color:#1a1a1a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;">
                              Verify Email
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#9ca3af;">
                        If you didn't create this account, you can safely ignore this email. This link expires when a new one is requested.
                      </p>
                    </td>
                  </tr>
                  <!-- Footer -->
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Send verification email error:", error);
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    );
  }
}
