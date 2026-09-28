import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { User } from "@/lib/models/User";
import { createSession, verifyPassword, isEmailValid, normalizePhone } from "@/lib/auth";
import { setSessionCookie, toAuthUser } from "@/lib/auth-server";
import { rateLimitRequest, rateLimitResponse } from "@/lib/rate-limit";
import { isBotRequest } from "@/lib/bot-trap";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body." }, { status: 400 });
  }

  const data = (body ?? {}) as { identifier?: unknown; email?: unknown; password?: unknown };
  // Accept both "identifier" (email-or-phone) and the legacy "email" field.
  const identifier = String(data.identifier ?? data.email ?? "").trim();
  const password = String(data.password ?? "");

  if (!identifier || !password) {
    return NextResponse.json({ success: false, error: "Enter your email or phone and password." }, { status: 400 });
  }

  // Honeypot trap: silently return a generic failure without touching the DB.
  if (isBotRequest(data as Record<string, unknown>)) {
    return NextResponse.json({ success: false, error: "Incorrect email or password." }, { status: 401 });
  }

  const rateLimit = await rateLimitRequest(request, {
    scope: "auth-login",
    limit: 5,
    windowMs: 15 * 60 * 1000,
    dimensions: [`account:${identifier.toLowerCase()}`],
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { success: false, error: "Sign-in is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  const looksLikeEmail = identifier.includes("@");
  const emailQuery = isEmailValid(identifier) ? identifier.toLowerCase() : "";
  const phoneSearch = looksLikeEmail ? "" : normalizePhone(identifier);

  const user = await User.findOne({
    $or: [
      ...(emailQuery ? [{ email: emailQuery }] : []),
      ...(phoneSearch ? [{ phoneSearch }, { phone: identifier }] : []),
    ],
  });

  // Legacy fallback: accounts created before the normalized phoneSearch field
  // existed only store the formatted phone (e.g. "+237 672 595 989"). If the
  // user signs in with a differently-formatted number, normalize and compare
  // against the stored value, then backfill phoneSearch for future lookups.
  let userDoc = user;
  if (!userDoc && phoneSearch) {
    try {
      const legacyCandidates = await User.find({
        phone: { $exists: true, $ne: "" },
        $or: [{ phoneSearch: { $exists: false } }, { phoneSearch: "" }],
      })
        .select("_id phone phoneSearch passwordHash isActive")
        .limit(200)
        .lean();
      const legacyHit = legacyCandidates.find((candidate) => {
        if (typeof candidate.phone !== "string" || !candidate.phone) return false;
        return normalizePhone(candidate.phone) === phoneSearch;
      });
      if (legacyHit) {
        await User.updateOne({ _id: legacyHit._id }, { $set: { phoneSearch } });
        userDoc = await User.findById(legacyHit._id);
      }
    } catch (error) {
      console.error("[auth] legacy phone lookup failed:", error);
    }
  }

  if (!userDoc || !(await verifyPassword(password, userDoc.passwordHash))) {
    return NextResponse.json({ success: false, error: "Incorrect email or password." }, { status: 401 });
  }
  if (userDoc.isActive === false) {
    return NextResponse.json(
      { success: false, error: "This account has been deactivated. Contact S19 for assistance." },
      { status: 403 }
    );
  }

  userDoc.lastLoginAt = new Date();
  await userDoc.save();

  const sessionToken = await createSession(String(userDoc._id));
  if (!sessionToken) {
    return NextResponse.json(
      { success: false, error: "Could not start a session. Please try again." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({
    success: true,
    message: "Signed in successfully.",
    user: toAuthUser(userDoc),
  });
  return setSessionCookie(res, sessionToken, request);
}