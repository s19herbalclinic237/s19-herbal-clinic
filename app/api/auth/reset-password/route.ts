import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { consumeResetToken, destroyUserSessions, hashPassword, passwordPolicyErrors } from "@/lib/auth";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const token = String((body as { token?: unknown }).token ?? "");
  const password = String((body as { password?: unknown }).password ?? "");

  if (!token) {
    return NextResponse.json({ success: false, error: "Reset token is required." }, { status: 400 });
  }
  const passwordErrors = passwordPolicyErrors(password);
  if (passwordErrors.length > 0) {
    return NextResponse.json({ success: false, error: passwordErrors[0] }, { status: 400 });
  }

  const rateLimit = await rateLimitRequest(request, {
    scope: "auth-reset-password",
    limit: 10,
    windowMs: 60 * 60 * 1000,
    dimensions: [`token:${token}`],
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const connectError = () =>
    NextResponse.json(
      { success: false, error: "Password reset is temporarily unavailable. Please try again later." },
      { status: 503 }
    );

  const conn = await connectDb();
  if (!conn) return connectError();

  const userId = await consumeResetToken(token);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json({ success: false, error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  user.passwordHash = hashPassword(password);
  user.verifyTokenHash = undefined;
  user.verifyExpires = undefined;
  user.emailVerified = true;
  await user.save();

  await destroyUserSessions(String(user._id)).catch(() => {});

  return NextResponse.json({ success: true, message: "Password reset successfully. You can now sign in." });
}