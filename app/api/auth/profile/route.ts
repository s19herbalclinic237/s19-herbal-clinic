import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser, toAuthUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";

export async function PATCH(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = (body ?? {}) as { name?: string; phone?: string };
  const name = payload.name?.trim();
  const phone = payload.phone?.trim() || undefined;

  if (name !== undefined && (name.length < 2 || name.length > 100)) {
    return NextResponse.json({ error: "Please provide a valid name." }, { status: 400 });
  }
  if (phone !== undefined && phone.length > 30) {
    return NextResponse.json({ error: "Please provide a valid phone number." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Profile updates are temporarily unavailable." }, { status: 503 });
  }

  try {
    const updated = await User.findByIdAndUpdate(
      user.id,
      {
        $set: {
          ...(name !== undefined ? { name } : {}),
          ...(phone !== undefined ? { phone } : {}),
        },
      },
      { new: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: "Profile updated.", user: toAuthUser(updated) });
  } catch (error) {
    console.error("[profile] update failed:", error);
    return NextResponse.json({ error: "Could not update your profile." }, { status: 500 });
  }
}