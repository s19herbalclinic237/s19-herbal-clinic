import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Session } from "@/lib/models/Session";
import "@/lib/models/User";
import { SESSION_COOKIE, SESSION_DAYS, hashToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { IUser } from "@/lib/models/User";

export type { AuthUser } from "@/lib/auth";

type AuthUserPick = Pick<
  IUser,
  | "_id"
  | "name"
  | "email"
  | "role"
  | "emailVerified"
  | "phone"
  | "createdAt"
  | "avatar"
  | "dob"
  | "gender"
  | "address"
  | "emergencyContact"
  | "idCardUrl"
  | "idCardFrontUrl"
  | "idCardBackUrl"
>;

export function toAuthUser(u: AuthUserPick): AuthUser {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    phone: u.phone,
    avatar: u.avatar || undefined,
    dob: u.dob,
    gender: u.gender,
    address: u.address,
    emergencyContact: u.emergencyContact,
    idCardUrl: u.idCardUrl,
    // Existing accounts only have the legacy single field: treat it as the front.
    idCardFrontUrl: u.idCardFrontUrl || u.idCardUrl || undefined,
    idCardBackUrl: u.idCardBackUrl,
    createdAt: (u.createdAt as unknown as Date).toISOString(),
  };
}

/**
 * The session cookie should carry the `Secure` flag only when the browser is
 * actually talking to us over HTTPS. Production deployments are HTTPS, but a
 * phone may reach the same app over plain HTTP (LAN test, http:// tunnel,
 * pre-SSL host). Setting `Secure` in that case silently makes browsers drop
 * the cookie: the login response still returns the user body so the dashboard
 * shell renders, yet every later API call (orders, messages, testimonials)
 * arrives without the session cookie and answers 401 "Sign in to ...".
 */
function isHttpsRequest(request?: Request): boolean {
  if (!request) return process.env.NODE_ENV === "production";
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function setSessionCookie(res: NextResponse, token: string, request?: Request): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(request),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse, request?: Request): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isHttpsRequest(request),
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const conn = await connectDb();
  if (!conn) return null;

  try {
    const session = await Session.findOne({ tokenHash: hashToken(token) }).populate("user").lean();
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await Session.deleteOne({ _id: session._id }).exec();
      return null;
    }
    const u = session.user as (AuthUserPick & { _id: unknown });
    if (!u || !u._id) return null;
    return toAuthUser({
      _id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      emailVerified: u.emailVerified,
      phone: u.phone,
      avatar: u.avatar,
      dob: u.dob,
      gender: u.gender,
      address: u.address,
      emergencyContact: u.emergencyContact,
      idCardUrl: u.idCardUrl,
      idCardFrontUrl: u.idCardFrontUrl,
      idCardBackUrl: u.idCardBackUrl,
      createdAt: u.createdAt,
    });
  } catch (error) {
    console.error("[auth] getSessionUser error:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  return getSessionUser();
}

export async function isAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && user.role === "admin";
}