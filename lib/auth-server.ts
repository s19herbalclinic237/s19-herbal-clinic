import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Session } from "@/lib/models/Session";
import { SESSION_COOKIE, SESSION_DAYS, hashToken } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import type { IUser } from "@/lib/models/User";

export type { AuthUser } from "@/lib/auth";

export function toAuthUser(u: Pick<IUser, "_id" | "name" | "email" | "role" | "emailVerified" | "phone" | "createdAt" | "avatar">): AuthUser {
  return {
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    phone: u.phone,
    avatar: u.avatar || undefined,
    createdAt: (u.createdAt as unknown as Date).toISOString(),
  };
}

export function setSessionCookie(res: NextResponse, token: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return res;
}

export function clearSessionCookie(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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
    const u = session.user as (Pick<IUser, "_id" | "name" | "email" | "role" | "emailVerified" | "phone" | "createdAt" | "avatar"> & { _id: unknown });
    if (!u || !u._id) return null;
    return toAuthUser({ _id: String(u._id), name: u.name, email: u.email, role: u.role, emailVerified: u.emailVerified, phone: u.phone, avatar: u.avatar, createdAt: u.createdAt });
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