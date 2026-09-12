import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { generateToken, hashToken, isEmailValid } from "@/lib/auth";
import { sendVerificationEmail, siteOrigin } from "@/lib/email";

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
  if (user && !user.emailVerified) {
    const verifyToken = generateToken();
    user.verifyTokenHash = hashToken(verifyToken);
    user.verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    const verifyLink = `${siteOrigin()}/account/verify?token=${verifyToken}`;
    sendVerificationEmail(email, user.name, verifyLink).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    message: "If an account exists for that email, a new verification link has been sent.",
  });
}