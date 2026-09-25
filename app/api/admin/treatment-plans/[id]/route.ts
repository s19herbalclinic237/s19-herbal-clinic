import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { adminGuard } from "@/lib/admin-guard";
import {
  TreatmentPlan,
  treatmentPlanDays,
  treatmentPlanPhase,
  treatmentMonthInfo,
} from "@/lib/models/TreatmentPlan";
import { notifyPatient } from "@/lib/notify";

type Params = { params: Promise<{ id: string }> };

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const REVIEW_OUTCOMES = ["maintenance", "extended", "completed", "discontinued"];

function parseMonitoring(raw: unknown): Record<string, unknown> | undefined {
  const m = (raw ?? {}) as Record<string, unknown>;
  if (typeof m !== "object" || m === null) return undefined;
  return {
    glucose: Boolean(m.glucose),
    fastingStart: String(m.fastingStart || "06:00").slice(0, 5),
    fastingEnd: String(m.fastingEnd || "10:00").slice(0, 5),
    postLunchStart: String(m.postLunchStart || "14:00").slice(0, 5),
    postLunchEnd: String(m.postLunchEnd || "16:00").slice(0, 5),
  };
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await adminGuard();
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
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const existing = await TreatmentPlan.findById(id).lean();
    if (!existing) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    const raw = (body ?? {}) as Record<string, unknown>;
    const set: Record<string, unknown> = {};
    const unset: string[] = [];

    if (raw.user !== undefined) {
      const clean = String(raw.user).trim();
      if (clean) set.user = clean;
    }
    if (raw.title !== undefined) {
      const clean = String(raw.title).trim().slice(0, 200);
      if (clean) set.title = clean;
    }
    if (raw.program !== undefined) {
      if (String(raw.program).trim()) set.program = String(raw.program).trim().slice(0, 200);
      else unset.push("program");
    }
    if (raw.forMember !== undefined) {
      if (String(raw.forMember).trim()) set.forMember = String(raw.forMember).trim();
      else unset.push("forMember");
    }
    if (raw.notes !== undefined) {
      if (String(raw.notes).trim()) set.notes = String(raw.notes).trim().slice(0, 2000);
      else unset.push("notes");
    }

    const startRaw = raw.startDate !== undefined ? new Date(String(raw.startDate)) : null;
    const endRaw = raw.endDate !== undefined ? new Date(String(raw.endDate)) : null;

    if (startRaw && Number.isNaN(startRaw.getTime())) {
      return NextResponse.json({ error: "Enter a valid start date." }, { status: 400 });
    }
    if (endRaw && Number.isNaN(endRaw.getTime())) {
      return NextResponse.json({ error: "Enter a valid end date." }, { status: 400 });
    }

    const startMs = startRaw ? startRaw.getTime() : new Date(existing.startDate).getTime();
    const endMs = endRaw ? endRaw.getTime() : new Date(existing.endDate).getTime();
    if (endMs <= startMs) {
      return NextResponse.json({ error: "The end date must be after the start date." }, { status: 400 });
    }

    if (startRaw) set.startDate = startRaw;
    if (endRaw) set.endDate = endRaw;

    if (raw.monitoring !== undefined) {
      const monitoring = parseMonitoring(raw.monitoring);
      if (monitoring) set.monitoring = monitoring;
    }

    // ── Close-out: the clinician ends the treatment after the final review. ──
    if (raw.status !== undefined) {
      const status = String(raw.status);
      if (status === "completed") {
        const reviewRaw = (raw.completionReview ?? {}) as Record<string, unknown>;
        const outcome = String(reviewRaw.outcome || "completed");
        if (!REVIEW_OUTCOMES.includes(outcome)) {
          return NextResponse.json({ error: "Choose a valid review outcome." }, { status: 400 });
        }
        set.status = "completed";
        set.completedAt = raw.completedAt ? new Date(String(raw.completedAt)) : new Date();
        set.completionReview = {
          improvements: String(reviewRaw.improvements || "").trim().slice(0, 4000) || undefined,
          resolved: String(reviewRaw.resolved || "").trim().slice(0, 4000) || undefined,
          unresolvedProblems:
            String(reviewRaw.unresolvedProblems || "").trim().slice(0, 4000) || undefined,
          complications: String(reviewRaw.complications || "").trim().slice(0, 4000) || undefined,
          followUpLabs: String(reviewRaw.followUpLabs || "").trim().slice(0, 4000) || undefined,
          outcome,
          notes: String(reviewRaw.notes || "").trim().slice(0, 2000) || undefined,
        };
      } else if (status === "active") {
        // Reopen a closed plan (e.g. extension continues the treatment).
        set.status = "active";
        unset.push("completedAt");
        unset.push("completionReview");
      } else {
        return NextResponse.json({ error: "Invalid plan status." }, { status: 400 });
      }
    }

    const $set = Object.keys(set).length > 0 ? { $set: set } : {};
    const $unset = unset.length > 0 ? { $unset: Object.fromEntries(unset.map((k) => [k, ""])) } : {};

    const plan = await TreatmentPlan.findByIdAndUpdate(id, { ...$set, ...$unset }, { new: true, runValidators: true }).lean();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }

    const reopened = String(raw.status) === "active" && existing.status === "completed";
    const closed = String(raw.status) === "completed" && existing.status !== "completed";
    if (closed) {
      const review = plan.completionReview as { outcome?: string } | undefined;
      await notifyPatient({
        userId: String(plan.user),
        subject: `Treatment closed — ${review?.outcome || "review complete"}`,
        body:
          `The clinic completed the final review of "${plan.title}". ` +
          `Outcome: ${review?.outcome ?? "completed"}.` +
          (plan.completedAt
            ? ` Closed on ${fmtDate(new Date(plan.completedAt))}.`
            : ""),
      });
    } else if (reopened) {
      await notifyPatient({
        userId: String(plan.user),
        subject: `Treatment reopened`,
        body: `The clinic reopened "${plan.title}" - your personalized treatment continues.`,
      });
    }

    return NextResponse.json({
      plan: {
        ...plan,
        phase: treatmentPlanPhase(plan),
        days: treatmentPlanDays(plan),
        months: treatmentMonthInfo(plan).totalMonths,
        month: treatmentMonthInfo(plan).month,
        daysLeft: treatmentMonthInfo(plan).daysLeft,
        elapsed: treatmentMonthInfo(plan).elapsed,
      },
    });
  } catch (error) {
    console.error("[admin treatment-plans] update failed:", error);
    return NextResponse.json({ error: "Could not update the treatment plan." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await adminGuard();
  if (denied) return denied;

  const { id } = await params;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Treatment plans are temporarily unavailable." }, { status: 503 });
  }

  try {
    const plan = await TreatmentPlan.findByIdAndDelete(id).lean();
    if (!plan) {
      return NextResponse.json({ error: "Treatment plan not found." }, { status: 404 });
    }
    return NextResponse.json({ message: "Treatment plan removed." });
  } catch (error) {
    console.error("[admin treatment-plans] delete failed:", error);
    return NextResponse.json({ error: "Could not delete the treatment plan." }, { status: 500 });
  }
}