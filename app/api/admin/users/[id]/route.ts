import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard, clinicalGuard } from "@/lib/admin-guard";
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
 * One account in full.
 *
 * clinicalGuard rather than adminGuard, deliberately: the specification is that
 * clinical staff may view a patient's details and their MRN, and only
 * administrators may change the MRN. A doctor looking at the file of someone
 * walking in should not have to ask an administrator for a read-only view.
 * Nothing here can be modified from this endpoint.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing user id." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json(
      { error: "Accounts are temporarily unavailable." },
      { status: 503 }
    );
  }

  try {
    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Counts are taken per collection rather than embedded, so opening a file
    // stays one query per clinical area and never drags whole documents over
    // the wire.
    const count = (model: { countDocuments: (f: Record<string, unknown>) => Promise<number> }) =>
      model.countDocuments({ user: id }).catch(() => 0);

    const [orders, appointments, records, prescriptions, plans, reminders, followUps, readings, messages, testimonials] =
      await Promise.all([
        count(Order as never),
        count(Appointment as never),
        count(MedicalRecord as never),
        count(Prescription as never),
        count(TreatmentPlan as never),
        count(TreatmentReminder as never),
        count(TreatmentFollowUp as never),
        count(GlucoseReading as never),
        Message.countDocuments({ user: id }).catch(() => 0),
        count(Testimonial as never),
      ]);

    return NextResponse.json({
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        /** Present so the UI can show the number prominently and say plainly
         *  when one has not been issued yet. */
        mrn: user.mrn ?? "",
        dob: user.dob ?? "",
        gender: user.gender ?? "",
        address: user.address ?? "",
        avatar: user.avatar ?? "",
        emergencyContact: {
          name: user.emergencyContact?.name ?? "",
          phone: user.emergencyContact?.phone ?? "",
          relation: user.emergencyContact?.relation ?? "",
        },
        whatsappOptIn: Boolean(user.whatsappOptIn),
        whatsappOptInAt: user.whatsappOptInAt ?? null,
        preferredLanguage: user.preferredLanguage ?? "en",
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt,
        idCardFrontUrl: user.idCardFrontUrl ?? "",
        idCardBackUrl: user.idCardBackUrl ?? user.idCardUrl ?? "",
        familyMembers: (user.familyMembers ?? []).map((m) => ({
          id: String(m._id),
          name: m.name,
          dob: m.dob ?? "",
          gender: m.gender ?? "",
          relation: m.relation ?? "",
          notes: m.notes ?? "",
        })),
        counts: {
          orders,
          appointments,
          records,
          prescriptions,
          plans,
          reminders,
          followUps,
          readings,
          messages,
          testimonials,
        },
      },
    });
  } catch (error) {
    console.error("[admin/users] detail failed:", error);
    return NextResponse.json({ error: "Could not load that account." }, { status: 500 });
  }
}

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