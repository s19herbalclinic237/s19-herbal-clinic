import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { User, type UserRole } from "@/lib/models/User";
import { destroyUserSessions } from "@/lib/auth";

const ALLOWED_ROLES: UserRole[] = ["user", "doctor"];

export async function GET() {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Users are temporarily unavailable." }, { status: 503 });
  }

  try {
    const users = await User.find({ role: { $in: ALLOWED_ROLES } })
      .select("name email phone role emailVerified isActive lastLoginAt createdAt")
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();
    return NextResponse.json({
      users: users.map((u) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        phone: u.phone ?? "",
        role: u.role,
        emailVerified: u.emailVerified,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt ?? null,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("[admin/roles] list failed:", error);
    return NextResponse.json({ error: "Could not load users." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const { id, role, isActive } = (body ?? {}) as {
    id?: unknown;
    role?: unknown;
    isActive?: unknown;
  };
  if (typeof id !== "string" || !id.trim()) {
    return NextResponse.json({ error: "User id is required." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Users are temporarily unavailable." }, { status: 503 });
  }

  const update: Record<string, unknown> = {};
  if (role !== undefined) {
    const normalized = String(role).toLowerCase();
    if (!ALLOWED_ROLES.includes(normalized as UserRole)) {
      return NextResponse.json(
        { error: "Role must be one of: " + ALLOWED_ROLES.join(", ") + "." },
        { status: 400 }
      );
    }
    update.role = normalized;
  }
  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 });
    }
    update.isActive = isActive;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }
    // Administrators are managed outside this endpoint and can never be
    // demoted through it.
    if (user.role === "admin" && update.role) {
      return NextResponse.json(
        { error: "Administrator roles are not managed here." },
        { status: 400 }
      );
    }
    if (role && String(role).toLowerCase() === "doctor" && user.role !== "doctor") {
      // A user must have a verified email before holding a staff role.
      if (!user.emailVerified) {
        return NextResponse.json(
          { error: "Verify the user's email before granting the Doctor role." },
          { status: 400 }
        );
      }
    }
    const wasActive = user.isActive;
    await User.updateOne({ _id: user._id }, { $set: update });

    // Deactivating a clinician immediately revokes their existing sessions.
    if (isActive === false && wasActive) {
      await destroyUserSessions(String(user._id)).catch(() => undefined);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[admin/roles] update failed:", error);
    return NextResponse.json({ error: "Could not update the user." }, { status: 500 });
  }
}