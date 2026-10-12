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
  | "phoneSearch"
  | "createdAt"
  | "avatar"
  | "dob"
  | "gender"
  | "address"
  | "emergencyContact"
  | "idCardUrl"
  | "idCardFrontUrl"
  | "idCardBackUrl"
  | "mrn"
  | "whatsappOptIn"
  | "preferredLanguage"
>;

export function toAuthUser(u: AuthUserPick): AuthUser {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    phone: u.phone,
    phoneSearch: u.phoneSearch,
    avatar: u.avatar || undefined,
    dob: u.dob,
    gender: u.gender,
    address: u.address,
    emergencyContact: u.emergencyContact,
    idCardUrl: u.idCardUrl,
    // Existing accounts only have the legacy single field: treat it as the front.
    idCardFrontUrl: u.idCardFrontUrl || u.idCardUrl || undefined,
    idCardBackUrl: u.idCardBackUrl,
    mrn: u.mrn,
    whatsappOptIn: u.whatsappOptIn ?? false,
    preferredLanguage: u.preferredLanguage === "fr" ? "fr" : "en",
    createdAt: (u.createdAt as unknown as Date).toISOString(),
  };
}

/**
 * Development may be reached over a local HTTP tunnel. Production sessions are
 * HTTPS-only regardless of proxy/header detection, so an accidental plain-HTTP
 * request cannot create a usable session cookie.
 */
function shouldUseSecureCookie(request?: Request): boolean {
  return process.env.NODE_ENV === "production" || isHttpsRequest(request);
}

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
    secure: shouldUseSecureCookie(request),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse, request?: Request): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(request),
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

    // Idle timeout. A session untouched for the configured window is destroyed
    // even while its absolute expiry is still in the future, so an abandoned
    // device does not stay signed in. Active users send a heartbeat, so this
    // never punishes real use.
    const idleMinutes = Math.max(1, Number(process.env.SESSION_IDLE_MINUTES) || 30);
    const lastActive = session.lastActiveAt ?? session.createdAt;
    const lastActiveMs = lastActive ? new Date(lastActive).getTime() : Date.now();
    if (Date.now() - lastActiveMs > idleMinutes * 60 * 1000) {
      await Session.deleteOne({ _id: session._id }).exec();
      return null;
    }
    // Rolling heartbeat, written at most once a minute to keep this cheap.
    if (Date.now() - lastActiveMs > 60 * 1000) {
      await Session.updateOne({ _id: session._id }, { $set: { lastActiveAt: new Date() } }).exec();
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
      phoneSearch: u.phoneSearch,
      avatar: u.avatar,
      dob: u.dob,
      gender: u.gender,
      address: u.address,
      emergencyContact: u.emergencyContact,
      idCardUrl: u.idCardUrl,
      idCardFrontUrl: u.idCardFrontUrl,
      idCardBackUrl: u.idCardBackUrl,
      mrn: u.mrn,
      whatsappOptIn: u.whatsappOptIn,
      preferredLanguage: u.preferredLanguage,
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

export async function isDoctor(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && user.role === "doctor";
}

/** Clinical staff: administrators plus registered doctors. */
export async function isStaff(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user && (user.role === "admin" || user.role === "doctor");
}