import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySession, SESSION_COOKIE } from "@/lib/auth";
import { clearSessionCookie } from "@/lib/auth-server";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await destroySession(token).catch(() => {});
  }
  return clearSessionCookie(NextResponse.json({ success: true }));
}