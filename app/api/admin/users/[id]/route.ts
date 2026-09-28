import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import { getSessionUser } from "@/lib/auth-server";
import { User } from "@/lib/models/User";
import { Session } from "@/lib/models/Session";
import { ResetToken } from "@/lib/models/ResetToken";
import { Cart } from "@/lib/models/Cart";
import { Message } from "@/lib/models/Message";
import { Appointment } from "@/lib/models/Appointment";
import { MedicalRecord } from "@/lib/models/MedicalRecord";
import { Prescription } from "@/lib/models/Prescription";
import { TreatmentPlan } from "@/lib/models/TreatmentPlan";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentFollowUp } from "@/lib/models/TreatmentFollowUp";
import { GlucoseReading } from "@/lib/models/GlucoseReading";
import { Testimonial } from "@/lib/models/Testimonial";
import { Order } from "@/lib/models/Order";
import { recordAudit } from "@/lib/models/AuditLog";

/**
 * Permanently deletes a patient account. This is intentionally destructive:
 * the request body must carry a typed confirmation word (the account's email,
 * case-insensitive) so the admin has to consciously type what they are about
 * to delete. Cascade cleanup removes every user-owned record, while orders are
 * kept as financial records but detached from the deleted account.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await adminGuard();
  if (denied) return denied;

  const admin = await getSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const confirm = String((body as { confirm?: unknown }).confirm ?? "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Accounts are temporarily unavailable." }, { status: 503 });
  }

  const user = await User.findById(id).lean();
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (user.role === "admin") {
    return NextResponse.json({ error: "Administrator accounts cannot be deleted." }, { status: 400 });
  }
  if (String(user._id) === admin.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }
  // The admin must type the account's email to prove intent.
  if (confirm.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json(
      { error: "The confirmation word did not match the account's email." },
      { status: 400 }
    );
  }

  const userId = String(user._id);

  try {
    // Cascade: remove every user-owned record and session.
    await Promise.all([
      Session.deleteMany({ user: userId }),
      ResetToken.deleteMany({ user: userId }),
      Cart.deleteMany({ user: userId }),
      Message.deleteMany({ user: userId }),
      Appointment.deleteMany({ user: userId }),
      MedicalRecord.deleteMany({ user: userId }),
      Prescription.deleteMany({ user: userId }),
      TreatmentPlan.deleteMany({ user: userId }),
      TreatmentReminder.deleteMany({ user: userId }),
      TreatmentFollowUp.deleteMany({ user: userId }),
      GlucoseReading.deleteMany({ user: userId }),
      Testimonial.deleteMany({ user: userId }),
      // Keep order history for financial records, but detach the deleted user.
      Order.updateMany({ user: userId }, { $unset: { user: 1 } }),
      User.deleteOne({ _id: userId }),
    ]);

    await recordAudit({
      actorId: admin.id,
      actorName: admin.name,
      action: "user.deleted",
      targetId: userId,
      targetLabel: user.email,
      details: `Permanently deleted ${user.name} (${user.email}) and all linked records.`,
    });

    return NextResponse.json({ success: true, message: "Account permanently deleted." });
  } catch (error) {
    console.error("[admin/users] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the account." }, { status: 500 });
  }
}