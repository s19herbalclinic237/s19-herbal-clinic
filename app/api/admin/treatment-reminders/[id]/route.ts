import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";

type Params = { params: Promise<{ id: string }> };

/**
 * The fields that constitute a claim about *when* something happens.
 *
 * Editing any of these hands the row back from the derivation engine by pinning
 * it. `notes` is deliberately absent - see the comment at the pin below.
 */
const SCHEDULE_FIELDS = ["title", "kind", "dueDate", "eventDate", "amountFcfa"] as const;

export async function PATCH(request: Request, { params }: Params) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Reminders are temporarily unavailable." }, { status: 503 });
  }

  try {
    const raw = (body ?? {}) as Record<string, unknown>;
    const set: Record<string, unknown> = {};

    if (raw.title !== undefined) {
      const clean = String(raw.title).trim().slice(0, 200);
      if (clean) set.title = clean;
    }
    if (raw.kind !== undefined) {
      const kind = String(raw.kind);
      if (!["payment", "refill", "appointment", "lab", "monitoring", "custom"].includes(kind)) {
        return NextResponse.json({ error: "Invalid reminder type." }, { status: 400 });
      }
      set.kind = kind;
    }
    if (raw.dueDate !== undefined) {
      const dueDate = String(raw.dueDate).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        return NextResponse.json({ error: "Enter a valid due date." }, { status: 400 });
      }
      set.dueDate = dueDate;
    }
    if (raw.eventDate !== undefined) {
      // Cleared with `null` or an empty string: a manual reminder often has only
      // one meaningful date, and forcing one on every row would be noise.
      const eventDate = String(raw.eventDate ?? "").trim();
      if (!eventDate) {
        set.eventDate = undefined;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        return NextResponse.json({ error: "Enter a valid event date." }, { status: 400 });
      } else {
        set.eventDate = eventDate;
      }
    }
    if (raw.amountFcfa !== undefined) {
      set.amountFcfa = raw.amountFcfa !== "" ? Number(raw.amountFcfa) : undefined;
    }
    if (raw.forMember !== undefined) set.forMember = String(raw.forMember).trim() || undefined;
    if (raw.notes !== undefined) set.notes = String(raw.notes).trim().slice(0, 1000) || undefined;
    if (raw.status !== undefined) {
      const status = String(raw.status);
      if (status !== "pending" && status !== "done" && status !== "cancelled") {
        return NextResponse.json({ error: "Invalid reminder status." }, { status: 400 });
      }
      set.status = status;
    }

    // Taking ownership of a derived reminder.
    //
    // If a clinician moves a generated review from the 14th to the 20th, that
    // decision has to outlive the next re-derivation - which happens on every
    // plan date change. Pinning on the edit is what makes the engine back off
    // that row permanently.
    //
    // A pure note edit does not pin: typing a note into a reminder is not a claim
    // about when the thing should happen, and pinning on it would quietly freeze
    // dates the clinician never intended to touch. `pinned: false` is therefore a
    // deliberate hand-back, and reverts the row to whatever the rules say.
    if (raw.pinned !== undefined) {
      set.pinned = Boolean(raw.pinned);
    } else if (SCHEDULE_FIELDS.some((f) => raw[f] !== undefined)) {
      set.pinned = true;
    }

    const updated = await TreatmentReminder.findByIdAndUpdate(
      id,
      { $set: set },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
    }
    return NextResponse.json({ reminder: updated });
  } catch (error) {
    console.error("[admin treatment-reminders] update failed:", error);
    return NextResponse.json({ error: "Could not update the reminder." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const { id } = await params;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Reminders are temporarily unavailable." }, { status: 503 });
  }

  try {
    const removed = await TreatmentReminder.findByIdAndDelete(id).lean();
    if (!removed) {
      return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Reminder removed." });
  } catch (error) {
    console.error("[admin treatment-reminders] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the reminder." }, { status: 500 });
  }
}