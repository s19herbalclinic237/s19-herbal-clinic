import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import {
  TreatmentPlan,
  treatmentPlanDays,
  treatmentPlanPhase,
} from "@/lib/models/TreatmentPlan";
import { User } from "@/lib/models/User";
import { notifyPatient } from "@/lib/notify";
import { sendTreatmentPlanEmail } from "@/lib/email";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export async function GET(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  const url = new URL(request.url);
  const userId = String(url.searchParams.get("user") || "").trim();

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const filter = userId ? { user: userId } : {};
    const plans = await TreatmentPlan.find(filter)
      .populate("user", "name email")
      .sort({ startDate: -1 })
      .limit(500)
      .lean();
    return NextResponse.json({
      plans: plans.map((p) => ({
        ...p,
        phase: treatmentPlanPhase(p),
        days: treatmentPlanDays(p),
      })),
    });
  } catch (error) {
    console.error("[admin treatment-plans] list failed:", error);
    return NextResponse.json({ error: "Could not load treatment plans." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await adminGuard();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const raw = (body ?? {}) as Record<string, unknown>;
    const user = String(raw.user || "").trim();
    const title = String(raw.title || "").trim().slice(0, 200);
    const program = String(raw.program || "").trim().slice(0, 200) || undefined;
    const forMember = String(raw.forMember || "").trim() || undefined;
    const startDate = new Date(String(raw.startDate || ""));
    const endDate = new Date(String(raw.endDate || ""));
    const notes = String(raw.notes || "").trim().slice(0, 2000) || undefined;

    if (!user) {
      return NextResponse.json({ error: "Choose a patient for the treatment plan." }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ error: "Give the treatment plan a name." }, { status: 400 });
    }
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Enter valid start and end dates." }, { status: 400 });
    }
    if (endDate.getTime() <= startDate.getTime()) {
      return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });
    }

    const patient = await User.findById(user).select("name email").lean();
    if (!patient) {
      return NextResponse.json({ error: "Patient account not found." }, { status: 404 });
    }

    const plan = await TreatmentPlan.create({
      user,
      forMember,
      title,
      program,
      startDate,
      endDate,
      notes,
    });

    const patientName = (patient as { name?: string }).name || "there";
    const patientEmail = (patient as { email?: string }).email || "";
    const startLabel = fmtDate(startDate);
    const endLabel = fmtDate(endDate);

    await notifyPatient({
      userId: user,
      subject: `Treatment plan - ${title}`,
      body:
        `Your personalized treatment plan "${title}"${forMember ? ` for ${forMember}` : ""} starts on ` +
        `${startLabel} and ends on ${endLabel}. We will follow your progress in the portal.`,
    });

    if (patientEmail) {
      await sendTreatmentPlanEmail({
        to: patientEmail,
        patientName,
        title,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        forMember,
      });
    }

    return NextResponse.json(
      { plan: { ...plan.toObject(), phase: treatmentPlanPhase(plan), days: treatmentPlanDays(plan) } },
      { status: 201 }
    );
  } catch (error) {
    console.error("[admin treatment-plans] create failed:", error);
    return NextResponse.json({ error: "Could not create the treatment plan." }, { status: 500 });
  }
}