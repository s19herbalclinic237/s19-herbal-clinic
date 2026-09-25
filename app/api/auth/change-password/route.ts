import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { SESSION_COOKIE, hashPassword, hashToken, passwordPolicyErrors, verifyPassword } from "@/lib/auth";
import { sendPasswordChangedEmail } from "@/lib/email";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to change your password." }, { status: 401 });
  }

  const rateLimit = await rateLimitRequest(request, {
    scope: "auth-change-password",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    dimensions: [`user:${user.id}`],
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { currentPassword, newPassword } = (body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });
  }
  const policyErrors = passwordPolicyErrors(newPassword);
  if (policyErrors.length > 0) {
    return NextResponse.json({ error: policyErrors[0] }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Password changes are temporarily unavailable." }, { status: 503 });
  }

  try {
    const doc = await User.findById(user.id).lean();
    if (!doc || !verifyPassword(currentPassword, doc.passwordHash)) {
      return NextResponse.json({ error: "Your current password is incorrect." }, { status: 400 });
    }

    await User.updateOne({ _id: user.id }, { $set: { passwordHash: hashPassword(newPassword) } }).exec();

    const cookieStore = await cookies();
    const currentToken = cookieStore.get(SESSION_COOKIE)?.value;
    await Session.deleteMany({
      user: user.id,
      ...(currentToken ? { tokenHash: { $ne: hashToken(currentToken) } } : {}),
    }).exec();

    if (user.email) {
      try {
        await sendPasswordChangedEmail(user.email, user.name);
      } catch (error) {
        console.error("[change-password] notification email failed:", error);
      }
    }

    return NextResponse.json({ success: true, message: "Password changed. Other devices were signed out." });
  } catch (error) {
    console.error("[change-password] failed:", error);
    return NextResponse.json({ error: "Could not change your password. Please try again." }, { status: 500 });
  }
}