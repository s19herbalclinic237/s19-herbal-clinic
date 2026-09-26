import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { getSessionUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";
import { recordAudit } from "@/lib/models/AuditLog";

/** Loose clinic MRN format: letters, digits and dashes (e.g. "S1900615"). */
const MRN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{1,29}$/;

function normalizeMrn(raw: unknown): string {
  return String(raw ?? "").trim().toUpperCase().replace(/\s+/g, "-");
}

/**
 * Assign, change or remove a patient's Medical Record Number (MRN).
 *
 * Admin-only on purpose: patients must never be able to create, edit or
 * change their own MRN. Staff can view and search by MRN through the
 * patient list, but only administrators reach this endpoint.
 */
export async function PATCH(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { userId, mrn } = (body ?? {}) as { userId?: unknown; mrn?: unknown };
  if (typeof userId !== "string" || !userId.trim()) {
    return NextResponse.json({ error: "Patient is required." }, { status: 400 });
  }

  const nextMrn = normalizeMrn(mrn);
  const removing = nextMrn === "";

  if (!removing && !MRN_PATTERN.test(nextMrn)) {
    return NextResponse.json(
      { error: "Enter a valid Medical Record Number (letters, numbers and dashes only)." },
      { status: 400 }
    );
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { error: "This service is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  try {
    const target = await User.findById(userId);
    if (!target) {
      return NextResponse.json({ error: "Patient not found." }, { status: 404 });
    }
    if (target.role === "admin") {
      return NextResponse.json({ error: "Administrator accounts do not get an MRN." }, { status: 400 });
    }

    const previous = target.mrn ?? "";
    if (!removing && previous === nextMrn) {
      return NextResponse.json({ success: true, message: "That MRN is already set on this patient." });
    }

    // Duplicate prevention: the same MRN can never appear on two patients.
    if (!removing) {
      const duplicate = await User.findOne({ mrn: nextMrn, _id: { $ne: target._id } }).lean();
      if (duplicate) {
        return NextResponse.json(
          {
            error: `MRN ${nextMrn} is already assigned to another patient.`,
          },
          { status: 409 }
        );
      }
    }

    if (removing) {
      await User.updateOne({ _id: target._id }, { $unset: { mrn: 1 } });
    } else {
      await User.updateOne({ _id: target._id }, { $set: { mrn: nextMrn } });
    }

    // Audit trail: who changed it and when.
    const actor = await getSessionUser();
    const action = previous ? (removing ? "mrn.removed" : "mrn.changed") : "mrn.assigned";
    const details = removing
      ? `MRN removed from ${target.name} (was ${previous}).`
      : previous
        ? `MRN changed for ${target.name}: ${previous} -> ${nextMrn}.`
        : `MRN ${nextMrn} assigned to ${target.name}.`;
    await recordAudit({
      actorId: actor?.id ?? "unknown",
      actorName: actor?.name,
      action,
      targetId: String(target._id),
      targetLabel: target.name,
      details,
    });

    return NextResponse.json({
      success: true,
      message: removing ? "Medical Record Number removed." : `Medical Record Number set to ${nextMrn}.`,
    });
  } catch (error) {
    // The sparse-unique index is the final safety net against duplicates.
    const code = (error as { code?: number }).code;
    if (code === 11000) {
      return NextResponse.json(
        { error: "That Medical Record Number is already assigned to another patient." },
        { status: 409 }
      );
    }
    console.error("[admin/mrn] update failed:", error);
    return NextResponse.json({ error: "Could not update the Medical Record Number." }, { status: 500 });
  }
}