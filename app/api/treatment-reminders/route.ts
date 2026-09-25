import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth-server";
import { TreatmentReminder, type ITreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentPlan, type ITreatmentPlan } from "@/lib/models/TreatmentPlan";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface ReminderWithState extends ITreatmentReminder {
  overdue: boolean;
}

/**
 * The patient's upcoming / recent treatment reminders (payments, refills,
 * appointments, labs, monitoring). All reminders for plans that have not
 * been completed; sorted by due date.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to view your reminders." }, { status: 401 });
  }

  const url = new URL(request.url);
  const includeDone = url.searchParams.get("includeDone") === "1";

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Reminders are temporarily unavailable." }, { status: 503 });
  }

  try {
    const plans = await TreatmentPlan.find({ user: user.id, status: "active" })
      .select("_id")
      .lean<ITreatmentPlan[]>();
    const planIds = plans.map((p) => String(p._id));
    if (planIds.length === 0) return NextResponse.json({ reminders: [] });

    const filter: Record<string, unknown> = {
      plan: { $in: planIds },
      ...(includeDone ? {} : { status: "pending" }),
    };
    const reminders = await TreatmentReminder.find(filter)
      .sort({ dueDate: 1 })
      .limit(200)
      .lean<ITreatmentReminder[]>();

    const today = todayStr();
    return NextResponse.json({
      reminders: reminders.map((r) => ({
        ...r,
        overdue: r.status === "pending" && r.dueDate < today,
      })),
    });
  } catch (error) {
    console.error("[treatment-reminders] list failed:", error);
    return NextResponse.json({ error: "Could not load your reminders." }, { status: 500 });
  }
}