import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const uid = searchParams.get("uid");

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    if (!token || !uid) {
      return NextResponse.redirect(`${baseUrl}/login?verified=false`);
    }

    // Read the user doc from Firestore
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.redirect(`${baseUrl}/login?verified=false`);
    }

    const userData = userSnap.data();

    // Check token matches
    if (userData.verificationToken !== token) {
      return NextResponse.redirect(`${baseUrl}/login?verified=false`);
    }

    // Already verified
    if (userData.emailVerified === true) {
      return NextResponse.redirect(`${baseUrl}/login?verified=true`);
    }

    // Mark as verified
    await updateDoc(userRef, {
      emailVerified: true,
      verificationToken: null,
    });

    return NextResponse.redirect(`${baseUrl}/login?verified=true`);
  } catch (error) {
    console.error("Verify email error:", error);
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
    return NextResponse.redirect(`${baseUrl}/login?verified=false`);
  }
}
