import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createResetToken, isEmailValid } from "@/lib/auth";
import { sendPasswordResetEmail, siteOrigin } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const email = String((body as { email?: unknown }).email ?? "").trim().toLowerCase();
  if (!isEmailValid(email)) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { success: false, error: "This service is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const user = await User.findOne({ email });
  if (user) {
    const token = await createResetToken(String(user._id));
    if (token) {
      const resetLink = `${siteOrigin()}/account/reset-password?token=${token}`;
      sendPasswordResetEmail(email, user.name, resetLink).catch((err) =>
        console.error("[auth] forgot-password email failed:", err)
      );
    }
  }

  return NextResponse.json({
    success: true,
    message: "If an account exists for that email, a password reset link has been sent.",
  });
}