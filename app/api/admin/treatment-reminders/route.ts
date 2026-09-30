import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { TreatmentReminder, type ITreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentPlan } from "@/lib/models/TreatmentPlan";

function todayStr(): string {
  // Local calendar date - reminder due dates are user-facing days.
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const REMINDER_KINDS = ["payment", "refill", "appointment", "lab", "monitoring", "custom"] as const;
type ReminderKindT = (typeof REMINDER_KINDS)[number];

export async function GET(request: Request) {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const planId = String(url.searchParams.get("plan") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Reminders are temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter = planId ? { plan: planId } : {};
    // Withdrawn rows are excluded by default. They are kept rather than deleted so
    // the record survives, but a clinician opening a plan wants to see what is
    // outstanding, not a list of things the schedule has already retracted.
    // `?all=1` brings them back for auditing.
    const includeWithdrawn = new URL(request.url).searchParams.get("all") === "1";
    const reminders = await TreatmentReminder.find(
      includeWithdrawn ? filter : { ...filter, status: { $ne: "cancelled" } }
    )
      .populate("plan", "title forMember")
      .populate("user", "name email")
      .sort({ dueDate: 1 })
      .limit(500)
      .lean();
    const today = todayStr();
    return NextResponse.json({
      reminders: (reminders as ITreatmentReminder[]).map((r) => ({
        ...r,
        overdue: r.status === "pending" && r.dueDate < today,
      })),
    });
  } catch (error) {
    console.error("[admin treatment-reminders] list failed:", error);
    return NextResponse.json({ error: "Could not load reminders." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await clinicalGuard();
  if (denied) return denied;

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
    const planId = String(raw.plan || "").trim();
    const kind = String(raw.kind || "custom") as ReminderKindT;
    const title = String(raw.title || "").trim().slice(0, 200);
    const dueDate = String(raw.dueDate || "").trim();
    const amountFcfa = raw.amountFcfa !== undefined && raw.amountFcfa !== "" ? Number(raw.amountFcfa) : undefined;
    const forMember = String(raw.forMember || "").trim().slice(0, 120) || undefined;
    const notes = String(raw.notes || "").trim().slice(0, 1000) || undefined;
    const eventDate = String(raw.eventDate || "").trim();

    if (!planId || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json({ error: "Choose a plan and a valid due date." }, { status: 400 });
    }
    if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      return NextResponse.json({ error: "Enter a valid event date." }, { status: 400 });
    }
    if (!REMINDER_KINDS.includes(kind)) {
      return NextResponse.json({ error: "Invalid reminder type." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Give the reminder a title." }, { status: 400 });
    }

    const plan = await TreatmentPlan.findById(planId).select("user title forMember").lean();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    const reminder = await TreatmentReminder.create({
      user: plan.user,
      plan: planId,
      forMember,
      kind,
      title,
      dueDate,
      // A manually-created reminder has no rule behind it, so it is `manual` and
      // carries no dedupe key. The derivation engine leaves it alone entirely -
      // see `reconcilePlanSchedule`. `origin` defaults to "manual" in the schema;
      // it is spelled out here so that the one field this route's correctness
      // depends on is visible where it is set.
      origin: "manual",
      ...(eventDate ? { eventDate } : {}),
      amountFcfa,
      notes,
      status: "pending",
    });

    return NextResponse.json({ reminder: reminder.toObject() }, { status: 201 });
  } catch (error) {
    console.error("[admin treatment-reminders] create failed:", error);
    return NextResponse.json({ error: "Could not create the reminder." }, { status: 500 });
  }
}