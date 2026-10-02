import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { User } from "@/lib/models/User";
import { buildDirectoryFilter, toDirectoryRow, type DirectoryRole, type MrnState } from "@/lib/user-directory";
import type { UserRole } from "@/lib/models/User";

/**
 * Every account on the system, with the details a clinic needs to recognise a
 * person who walks in.
 *
 * This is deliberately separate from /api/admin/users, which feeds the Staff &
 * Roles and Users & Messages screens. Those two must not show administrators:
 * Staff & Roles would then offer to demote or delete the account it is signed
 * in as, and the messaging screen has no business carrying the clinic owner's
 * address and date of birth into a chat view. Nothing here is ever shown to a
 * patient, so this route is admin-only rather than clinicalGuard.
 *
 * Admin-only is also the reason the MRN lives here and not in the staff list:
 * staff can already search by MRN and see it on a patient, which is all they
 * need. Writing one stays with administrators, in /api/admin/mrn.
 */

const ROLES: DirectoryRole[] = ["all", "admin", "doctor", "user"];
const MRN_STATES: MrnState[] = ["any", "assigned", "unassigned"];

function oneOf<T extends string>(raw: string | null, allowed: T[], fallback: T): T {
  return allowed.includes((raw ?? "") as T) ? ((raw ?? "") as T) : fallback;
}

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { error: "The user directory is temporarily unavailable." },
      { status: 503 }
    );
  }

  const params = new URL(request.url).searchParams;
  const query = params.get("q") ?? "";
  const role = oneOf<DirectoryRole>(params.get("role"), ROLES, "all");
  const mrnState = oneOf<MrnState>(params.get("mrn"), MRN_STATES, "any");

  const filter = buildDirectoryFilter({ query, role, mrnState });

  try {
    const users = await User.find(filter)
      .select(
        "name email phone role isActive emailVerified mrn dob gender address avatar whatsappOptIn lastLoginAt createdAt familyMembers"
      )
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const rows = users.map((u) =>
      toDirectoryRow({ ...u, _id: u._id, role: u.role as UserRole })
    );

    return NextResponse.json({
      users: rows,
      /** Counts across the whole directory, so an admin can see at a glance
       *  whether anyone is missing an MRN before starting to issue them. */
      totals: {
        shown: rows.length,
        unassignedMrn: users.filter((u) => !u.mrn).length,
        disabled: users.filter((u) => !u.isActive).length,
        unverified: users.filter((u) => !u.emailVerified).length,
      },
    });
  } catch (error) {
    console.error("[admin/directory] list failed:", error);
    return NextResponse.json({ error: "Could not load the user directory." }, { status: 500 });
  }
}