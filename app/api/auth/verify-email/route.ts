import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { hashToken } from "@/lib/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const token = String((body as { token?: unknown }).token ?? "");
  if (!token) {
    return NextResponse.json({ success: false, error: "Verification token is required." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { success: false, error: "Verification is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const user = await User.findOne({ verifyTokenHash: hashToken(token) });
  if (!user) {
    return NextResponse.json(
      { success: false, error: "This verification link is invalid. Request a new one from your account." },
      { status: 400 }
    );
  }
  if (user.emailVerified) {
    return NextResponse.json({ success: true, message: "Your email is already verified." });
  }
  if (user.verifyExpires && user.verifyExpires < new Date()) {
    return NextResponse.json(
      { success: false, error: "This verification link has expired. Request a new one from your account." },
      { status: 400 }
    );
  }

  user.emailVerified = true;
  user.verifyTokenHash = undefined;
  user.verifyExpires = undefined;
  await user.save();

  return NextResponse.json({ success: true, message: "Email verified successfully." });
}