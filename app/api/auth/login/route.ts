import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createSession, verifyPassword, isEmailValid } from "@/lib/auth";
import { setSessionCookie, toAuthUser } from "@/lib/auth-server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const email = String((body as { email?: unknown }).email ?? "").trim().toLowerCase();
  const password = String((body as { password?: unknown }).password ?? "");

  if (!isEmailValid(email) || !password) {
    return NextResponse.json({ success: false, error: "Enter your email and password." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { success: false, error: "Sign-in is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const user = await User.findOne({ email });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ success: false, error: "Incorrect email or password." }, { status: 401 });
  }
  if (user.isActive === false) {
    return NextResponse.json(
      { success: false, error: "This account has been deactivated. Contact S19 for assistance." },
      { status: 403 }
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const sessionToken = await createSession(String(user._id));
  if (!sessionToken) {
    return NextResponse.json(
      { success: false, error: "Could not start a session. Please try again." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({
    success: true,
    message: "Signed in successfully.",
    user: toAuthUser(user),
  });
  return setSessionCookie(res, sessionToken);
}