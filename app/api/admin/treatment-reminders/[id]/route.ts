import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";

type Params = { params: Promise<{ id: string }> };

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
    if (raw.amountFcfa !== undefined) {
      set.amountFcfa = raw.amountFcfa !== "" ? Number(raw.amountFcfa) : undefined;
    }
    if (raw.forMember !== undefined) set.forMember = String(raw.forMember).trim() || undefined;
    if (raw.notes !== undefined) set.notes = String(raw.notes).trim().slice(0, 1000) || undefined;
    if (raw.status !== undefined) {
      const status = String(raw.status);
      if (status !== "pending" && status !== "done") {
        return NextResponse.json({ error: "Invalid reminder status." }, { status: 400 });
      }
      set.status = status;
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