import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import {
  generateToken,
  hashPassword,
  hashToken,
  isEmailValid,
  isPhoneValid,
  normalizePhone,
  passwordPolicyErrors,
} from "@/lib/auth";
import { sendNewAccountNotification, sendVerificationEmail, siteOrigin } from "@/lib/email";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";
import { isBotRequest } from "@/lib/bot-trap";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const data = (body ?? {}) as {
    name?: unknown;
    phone?: unknown;
    email?: unknown;
    password?: unknown;
  };
  const name = String(data.name ?? "").trim();
  const phone = String(data.phone ?? "").trim();
  const email = String(data.email ?? "").trim().toLowerCase();
  const password = String(data.password ?? "");

  // Honeypot trap: pretend the account was created (without doing any work)
  // so bots cannot tell they were caught and keep grinding the rate limit.
  if (isBotRequest(data as Record<string, unknown>)) {
    return NextResponse.json(
      {
        success: true,
        message: "Account created. Check your email to verify your address, then sign in.",
      },
      { status: 201 }
    );
  }

  if (name.length < 2) {
    return NextResponse.json({ success: false, error: "Enter your full name." }, { status: 400 });
  }
  if (!isEmailValid(email)) {
    return NextResponse.json({ success: false, error: "Enter a valid email address." }, { status: 400 });
  }
  if (phone && !isPhoneValid(phone)) {
    return NextResponse.json({ success: false, error: "Enter a valid phone number (6-15 digits)." }, { status: 400 });
  }
  const passwordErrors = passwordPolicyErrors(password);
  if (passwordErrors.length > 0) {
    return NextResponse.json({ success: false, error: passwordErrors[0] }, { status: 400 });
  }

  const rateLimit = await rateLimitRequest(request, {
    scope: "auth-register",
    limit: 5,
    windowMs: 60 * 60 * 1000,
    dimensions: [`email:${email}`],
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { success: false, error: "Accounts are temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists. Try signing in." },
      { status: 409 }
    );
  }

  let user;
  try {
    user = await User.create({
      name,
      phone: phone || undefined,
      phoneSearch: phone ? normalizePhone(phone) : undefined,
      email,
      passwordHash: hashPassword(password),
      role: "user",
    });
  } catch (error) {
    console.error("[auth] register create failed:", error);
    return NextResponse.json({ success: false, error: "Could not create your account. Please try again." }, { status: 500 });
  }

  const verifyToken = generateToken();
  user.verifyTokenHash = hashToken(verifyToken);
  // Allow 72 hours so slow or delayed email delivery cannot expire the link
  // before the patient has a chance to use it.
  user.verifyExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await user.save();

  const verifyLink = `${siteOrigin()}/account/verify?token=${verifyToken}`;
  const emailSent = await sendVerificationEmail(email, name, verifyLink);
  sendNewAccountNotification(name, email).catch((err) =>
    console.error("[auth] new-account notification failed:", err)
  );

  return NextResponse.json(
    {
      success: true,
      message: "Account created. Check your email to verify your address, then sign in.",
      ...(emailSent
        ? {}
        : {
            warning:
              "We could not send the verification email right now. Please use \"Resend verification email\" after signing in, or contact the clinic on WhatsApp so we can verify your account.",
          }),
    },
    { status: 201 }
  );
}