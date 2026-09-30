import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentPlan, type ITreatmentPlan } from "@/lib/models/TreatmentPlan";

type Params = { params: Promise<{ id: string }> };

/**
 * Patients may mark one of their own reminders as done (e.g. "Paid",
 * "Ordered refill"). The reminder must belong to a plan on their account.
 */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to update your reminders." }, { status: 401 });
  }

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
    const reminder = await TreatmentReminder.findById(id).lean();
    if (!reminder) {
      return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
    }

    const plan = await TreatmentPlan.findOne({ _id: String(reminder.plan), user: user.id })
      .select("_id")
      .lean<ITreatmentPlan | null>();
    if (!plan) {
      return NextResponse.json({ error: "Reminder not found on your account." }, { status: 404 });
    }

    const raw = (body ?? {}) as Record<string, unknown>;
    const status = String(raw.status ?? "done");
    if (status !== "done" && status !== "pending") {
      return NextResponse.json({ error: "Invalid reminder status." }, { status: 400 });
    }

    // A withdrawn reminder is not the patient's to revive. The list never returns
    // one, so this is only reachable by keeping an old id - and letting it through
    // would put a task back on a patient's dashboard that the clinic has already
    // decided against.
    if (reminder.status === "cancelled") {
      return NextResponse.json({ error: "Reminder not found on your account." }, { status: 404 });
    }

    const updated = await TreatmentReminder.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    ).lean();
    return NextResponse.json({ reminder: updated });
  } catch (error) {
    console.error("[treatment-reminders] update failed:", error);
    return NextResponse.json({ error: "Could not update the reminder." }, { status: 500 });
  }
}