import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { clinicalGuard } from "@/lib/admin-guard";
import { TreatmentPlan, treatmentPlanPhase, treatmentMonthInfo, type ITreatmentPlan } from "@/lib/models/TreatmentPlan";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentFollowUp } from "@/lib/models/TreatmentFollowUp";
import { GlucoseReading, isGlucoseConcerning } from "@/lib/models/GlucoseReading";
import { Appointment } from "@/lib/models/Appointment";

export type AlertSeverity = "high" | "medium" | "low";

export interface TreatmentAlert {
  id: string;
  severity: AlertSeverity;
  category:
    | "final-review"
    | "ending-soon"
    | "missed-glucose"
    | "overdue-reminder"
    | "concerning-reading"
    | "new-complication"
    | "missed-follow-up";
  title: string;
  detail: string;
  planId?: string;
  patientId?: string;
  patientName?: string;
}

function todayIso(): string {
  // Local calendar date (YYYY-MM-DD) so comparisons with user-facing
  // dates (reminder due dates, appointment dates) match the clinic's day.
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const severityRank: Record<AlertSeverity, number> = { high: 3, medium: 2, low: 1 };

/**
 * The S19 team's alert feed, computed live from portal data:
 * treatments approaching their end date, plans awaiting the final review,
 * missed glucose submissions, overdue payments/reminders, concerning
 * readings, newly reported complications and missed follow-up appointments.
 */
export async function GET() {
  const denied = await clinicalGuard();
  if (denied) return denied;

  const conn = await connectDb();
  if (!conn) {
    return NextResponse.json({ error: "Alerts are temporarily unavailable." }, { status: 503 });
  }

  try {
    const alerts: TreatmentAlert[] = [];
    const today = todayIso();

    const plans = (await TreatmentPlan.find()
      .populate("user", "name email")
      .sort({ startDate: -1 })
      .limit(500)
      .lean()) as unknown as Array<
      ITreatmentPlan & { user: { _id: string; name?: string; email?: string } | null }
    >;

    const activePlans = plans.filter((p) => p.status !== "completed");
    const activeIds = activePlans.map((p) => String(p._id));

    const patientName = (p: { user?: { name?: string } | null; forMember?: string }) =>
      p.forMember || p.user?.name || "Patient";
    const patientId = (p: { user?: { _id: string } | null }) => (p.user ? String(p.user._id) : "");

    for (const p of activePlans) {
      const phase = treatmentPlanPhase(p);
      const pid = String(p._id);
      const info = treatmentMonthInfo(p);

      // 1) Period ended, no final review yet → prompt the clinician to close it.
      if (phase === "expired") {
        alerts.push({
          id: `final-review-${pid}`,
          severity: "high",
          category: "final-review",
          title: "Treatment period ended — final review required",
          detail: `${patientName(p)} · "${p.title}" ended on ${new Date(p.endDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}. Record the end-of-treatment review and close the plan.`,
          planId: pid,
          patientId: patientId(p),
          patientName: patientName(p),
        });
      }

      // 2) Approaching the end date → schedule the final review.
      if (phase === "active" && info.daysLeft <= 14) {
        alerts.push({
          id: `ending-${pid}`,
          severity: "low",
          category: "ending-soon",
          title:
            info.daysLeft === 0
              ? "Final day of treatment"
              : `Treatment ends in ${info.daysLeft} day${info.daysLeft === 1 ? "" : "s"}`,
          detail: `${patientName(p)} · "${p.title}" reaches its expected end date on ${new Date(p.endDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}.`,
          planId: pid,
          patientId: patientId(p),
          patientName: patientName(p),
        });
      }

      // 3) Glucose monitoring plan with no reading in the last 48 hours.
      if (p.monitoring?.glucose && phase === "active") {
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const recent = await GlucoseReading.countDocuments({ plan: pid, createdAt: { $gte: cutoff } });
        if (recent === 0) {
          alerts.push({
            id: `glucose-${pid}`,
            severity: "medium",
            category: "missed-glucose",
            title: "No glucose reading in the last 48 hours",
            detail: `${patientName(p)} · "${p.title}" requires daily fasting and post-lunch readings (${p.monitoring.fastingStart}–${p.monitoring.fastingEnd} AM and post-lunch).`,
            planId: pid,
            patientId: patientId(p),
            patientName: patientName(p),
          });
        }
      }

      // 4) Latest follow-up reports new symptoms or adverse reactions.
      const latest = await TreatmentFollowUp.findOne({ plan: pid }).sort({ date: -1 }).lean();
      if (latest && (latest.newSymptoms.length > 0 || latest.adverseReactions.length > 0)) {
        const pieces: string[] = [];
        if (latest.newSymptoms.length > 0) pieces.push(`new symptoms: ${latest.newSymptoms.join(", ")}`);
        if (latest.adverseReactions.length > 0)
          pieces.push(`adverse reactions: ${latest.adverseReactions.join(", ")}`);
        alerts.push({
          id: `complication-${pid}-${String(latest._id)}`,
          severity: "medium",
          category: "new-complication",
          title: "Newly reported symptoms or adverse reaction",
          detail: `${patientName(p)} · ${pieces.join(" · ")} (follow-up ${new Date(latest.date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}).`,
          planId: pid,
          patientId: patientId(p),
          patientName: patientName(p),
        });
      }
    }

    // 5) Overdue pending reminders (payments, refills, labs...).
    if (activeIds.length > 0) {
      const overdue = await TreatmentReminder.find({
        plan: { $in: activeIds },
        status: "pending",
        dueDate: { $lt: today },
      })
        .populate("plan", "title forMember")
        .populate("user", "name email")
        .sort({ dueDate: 1 })
        .limit(100)
        .lean();
      for (const r of overdue) {
        const plan = r.plan as { _id: string; title: string; forMember?: string } | null;
        const user = r.user as { _id: string; name?: string } | null;
        const name = plan?.forMember || user?.name || "Patient";
        alerts.push({
          id: `reminder-${String(r._id)}`,
          severity: r.kind === "payment" ? "high" : "medium",
          category: "overdue-reminder",
          title: `Overdue: ${r.title}${r.kind === "payment" && r.amountFcfa ? ` (${r.amountFcfa.toLocaleString()} FCFA)` : ""}`,
          detail: `Due ${new Date(`${r.dueDate}T12:00:00`).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })} · ${name} · "${plan?.title || "Treatment plan"}".`,
          planId: plan ? String(plan._id) : undefined,
          patientId: user ? String(user._id) : undefined,
          patientName: name,
        });
      }
    }

    // 6) Concerning glucose readings in the last 14 days.
    const concerningCutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const concerning = await GlucoseReading.find({ createdAt: { $gte: concerningCutoff } })
      .populate("plan", "title forMember")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    for (const r of concerning.filter((x) => isGlucoseConcerning(x))) {
      const plan = r.plan as { _id: string; title: string; forMember?: string } | null;
      const user = r.user as { _id: string; name?: string } | null;
      const name = plan?.forMember || user?.name || "Patient";
      alerts.push({
        id: `glucose-concern-${String(r._id)}`,
        severity: "high",
        category: "concerning-reading",
        title: `Concerning glucose reading: ${r.reading} mg/dL (${r.kind === "fasting" ? "fasting" : "2h post-lunch"})`,
        detail: `${name} · "${plan?.title || "Treatment plan"}" · submitted ${new Date(r.createdAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}${r.mealInfo ? ` · meal: ${r.mealInfo}` : ""}.`,
        planId: plan ? String(plan._id) : undefined,
        patientId: user ? String(user._id) : undefined,
        patientName: name,
      });
    }

    // 7) Follow-up appointments that passed without being completed.
    const missedAppointments = await Appointment.find({
      status: "confirmed",
      date: { $lt: today },
    })
      .populate("user", "name email")
      .sort({ date: 1 })
      .limit(100)
      .lean();
    for (const a of missedAppointments) {
      const user = a.user as { _id: string; name?: string } | null;
      alerts.push({
        id: `followup-${String(a._id)}`,
        severity: "high",
        category: "missed-follow-up",
        title: "Follow-up appointment passed without completion",
        detail: `${a.forMember || user?.name || "Patient"} · ${a.date} at ${a.time} (${a.mode === "clinic" ? "clinic" : "video"})${a.concern ? ` · ${a.concern}` : ""}.`,
        patientId: user ? String(user._id) : undefined,
        patientName: a.forMember || user?.name || "Patient",
      });
    }

    alerts.sort((a, b) => {
      const sev = severityRank[b.severity] - severityRank[a.severity];
      if (sev !== 0) return sev;
      return a.title.localeCompare(b.title);
    });

    const counts = { high: 0, medium: 0, low: 0 };
    for (const a of alerts) counts[a.severity] += 1;

    return NextResponse.json({ alerts, counts });
  } catch (error) {
    console.error("[admin treatment-alerts] failed:", error);
    return NextResponse.json({ error: "Could not load treatment alerts." }, { status: 500 });
  }
}