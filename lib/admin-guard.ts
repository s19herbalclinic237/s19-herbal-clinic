import "server-only";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth-server";

export async function adminGuard(): Promise<NextResponse | null> {
  const ok = await isAdmin();
  if (!ok) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }
  return null;
}