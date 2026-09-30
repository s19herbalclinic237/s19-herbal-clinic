import { treatmentPlanPhase, treatmentMonthInfo } from "@/lib/models/TreatmentPlan";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";
import type { ITreatmentReminder } from "@/lib/models/TreatmentReminder";
import type { IGlucoseReading } from "@/lib/models/GlucoseReading";
import type { IAppointment } from "@/lib/models/Appointment";
import type { PipelineStage, QueryFilter } from "mongoose";

export type AlertSeverity = "high" | "medium" | "low";

export type AlertCategory =
  | "final-review"
  | "ending-soon"
  | "missed-glucose"
  | "overdue-reminder"
  | "concerning-reading"
  | "new-complication"
  | "missed-follow-up";

export interface TreatmentAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  detail: string;
  planId?: string;
  patientId?: string;
  patientName?: string;
}

/** Stable ordering weight. Higher wins. */
export const severityRank: Record<AlertSeverity, number> = { high: 3, medium: 2, low: 1 };

/** A patient reference denormalised onto anything we alert about. */
export interface AlertPerson {
  planId: string;
  patientId?: string;
  patientName: string;
}

export interface OverdueReminderInput extends AlertPerson {
  /** The `TreatmentReminder._id`. Used to build the alert id. */
  reminderId: string;
  /** Plan title, for the detail line staff read. */
  planTitle?: string;
  kind: string;
  title: string;
  amountFcfa?: number;
  dueDate: string;
}

export interface ConcerningReadingInput extends AlertPerson {
  planTitle?: string;
  readingId: string;
  kind: string;
  reading: number;
  mealInfo?: string;
  createdAt: Date;
}

export interface LatestFollowUpInput extends AlertPerson {
  followUpId: string;
  newSymptoms: string[];
  adverseReactions: string[];
  date: Date | string;
}

export interface MissedAppointmentInput {
  appointmentId: string;
  /**
   * Always absent in practice. An appointment is booked by a patient, not
   * derived from a plan, so there is no plan to point at — modelled as its own
   * shape rather than `AlertPerson` so that cannot be forgotten at the call
   * site.
   */
  planId?: string;
  patientId?: string;
  patientName: string;
  date: string;
  time: string;
  mode: string;
  concern?: string;
}

/**
 * Everything the alert rules need, already loaded.
 *
 * Passed in rather than queried inline so that `computeTreatmentAlerts` stays a
 * pure function: the rules are then testable without a database, and the loader
 * below can batch its queries instead of issuing two per plan.
 */
export interface AlertInputs {
  /** The instant the rules are evaluated against. Passed in, never read from the clock. */
  now: Date;
  /** Non-completed plans, already populated with `user`. */
  plans: Array<ITreatmentPlan & { user: { _id: string; name?: string; email?: string } | null }>;
  /** Plans whose latest follow-up reported symptoms or an adverse reaction. */
  followUps: LatestFollowUpInput[];
  /** Plan ids with no glucose reading inside the window. */
  glucoseMissedPlanIds: Set<string>;
  /** Pending reminders past their due date. */
  overdueReminders: OverdueReminderInput[];
  /** Out-of-range glucose readings inside the window. */
  concerningReadings: ConcerningReadingInput[];
  /** Appointments that passed in `confirmed` state. */
  missedAppointments: MissedAppointmentInput[];
}

/** Default windows, exported so tests and the loader cannot drift apart. */
export const GLUCOSE_MISSED_WINDOW_HOURS = 48;
export const CONCERNING_WINDOW_DAYS = 14;

function fmtDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function personFromPlan(p: {
  _id: unknown;
  user?: { _id: string; name?: string } | null;
  forMember?: string;
}): AlertPerson {
  return {
    planId: String(p._id),
    patientId: p.user ? String(p.user._id) : undefined,
    patientName: p.forMember || p.user?.name || "Patient",
  };
}

/**
 * Derive the clinic's alert feed from already-loaded data.
 *
 * Pure: no queries, no clock reads, no formatting of the current date. Every
 * value it depends on arrives through `AlertInputs`, which is what makes the
 * rules testable and lets the same function back both the flat feed and the
 * daily worklist without two implementations drifting apart.
 *
 * `now` is threaded into the plan helpers rather than left to their own
 * `new Date()` default, so a test can pin a plan's last day and get a
 * deterministic answer instead of one that changes at midnight.
 */
export function computeTreatmentAlerts(inputs: AlertInputs): TreatmentAlert[] {
  const {
    now,
    plans,
    followUps,
    glucoseMissedPlanIds,
    overdueReminders,
    concerningReadings,
    missedAppointments,
  } = inputs;

  const alerts: TreatmentAlert[] = [];
  const followUpByPlan = new Map(followUps.map((f) => [f.planId, f]));

  for (const p of plans) {
    const phase = treatmentPlanPhase(p, now);
    const person = personFromPlan(p);
    const pid = person.planId;
    const name = person.patientName;
    const info = treatmentMonthInfo(p, now);

    // 1) Period ended, no final review yet -> prompt the clinician to close it.
    if (phase === "expired") {
      alerts.push({
        id: `final-review-${pid}`,
        severity: "high",
        category: "final-review",
        title: "Treatment period ended — final review required",
        detail: `${name} · "${p.title}" ended on ${fmtDate(p.endDate)}. Record the end-of-treatment review and close the plan.`,
        planId: pid,
        patientId: person.patientId,
        patientName: name,
      });
    }

    // 2) Approaching the end date -> schedule the final review.
    if (phase === "active" && info.daysLeft <= 14) {
      alerts.push({
        id: `ending-${pid}`,
        severity: "low",
        category: "ending-soon",
        title:
          info.daysLeft === 0
            ? "Final day of treatment"
            : `Treatment ends in ${info.daysLeft} day${info.daysLeft === 1 ? "" : "s"}`,
        detail: `${name} · "${p.title}" reaches its expected end date on ${fmtDate(p.endDate)}.`,
        planId: pid,
        patientId: person.patientId,
        patientName: name,
      });
    }

    // 3) Glucose monitoring plan with no recent reading.
    if (p.monitoring?.glucose && phase === "active" && glucoseMissedPlanIds.has(pid)) {
      alerts.push({
        id: `glucose-${pid}`,
        severity: "medium",
        category: "missed-glucose",
        title: `No glucose reading in the last ${GLUCOSE_MISSED_WINDOW_HOURS} hours`,
        detail: `${name} · "${p.title}" requires daily fasting and post-lunch readings (${p.monitoring.fastingStart}–${p.monitoring.fastingEnd} AM and post-lunch).`,
        planId: pid,
        patientId: person.patientId,
        patientName: name,
      });
    }

    // 4) Latest follow-up reports new symptoms or adverse reactions.
    const latest = followUpByPlan.get(pid);
    if (latest && (latest.newSymptoms.length > 0 || latest.adverseReactions.length > 0)) {
      const pieces: string[] = [];
      if (latest.newSymptoms.length > 0) pieces.push(`new symptoms: ${latest.newSymptoms.join(", ")}`);
      if (latest.adverseReactions.length > 0)
        pieces.push(`adverse reactions: ${latest.adverseReactions.join(", ")}`);
      alerts.push({
        id: `complication-${pid}-${latest.followUpId}`,
        severity: "medium",
        category: "new-complication",
        title: "Newly reported symptoms or adverse reaction",
        detail: `${name} · ${pieces.join(" · ")} (follow-up ${fmtDate(latest.date)}).`,
        planId: pid,
        patientId: person.patientId,
        patientName: name,
      });
    }
  }

  // 5) Overdue pending reminders (payments, refills, labs...).
  for (const r of overdueReminders) {
    alerts.push({
      id: `reminder-${r.reminderId}`,
      severity: r.kind === "payment" ? "high" : "medium",
      category: "overdue-reminder",
      title: `Overdue: ${r.title}${r.kind === "payment" && r.amountFcfa ? ` (${r.amountFcfa.toLocaleString()} FCFA)` : ""}`,
      detail: `Due ${fmtDate(`${r.dueDate}T12:00:00`)} · ${r.patientName} · "${r.planTitle || "Treatment plan"}".`,
      planId: r.planId,
      patientId: r.patientId,
      patientName: r.patientName,
    });
  }

  // 6) Concerning glucose readings inside the window.
  for (const r of concerningReadings) {
    alerts.push({
      id: `glucose-concern-${r.readingId}`,
      severity: "high",
      category: "concerning-reading",
      title: `Concerning glucose reading: ${r.reading} mg/dL (${r.kind === "fasting" ? "fasting" : "2h post-lunch"})`,
      detail: `${r.patientName} · "${r.planTitle || "Treatment plan"}" · submitted ${fmtDate(r.createdAt)}${r.mealInfo ? ` · meal: ${r.mealInfo}` : ""}.`,
      planId: r.planId,
      patientId: r.patientId,
      patientName: r.patientName,
    });
  }

  // 7) Follow-up appointments that passed without being completed.
  for (const a of missedAppointments) {
    alerts.push({
      id: `followup-${a.appointmentId}`,
      severity: "high",
      category: "missed-follow-up",
      title: "Follow-up appointment passed without completion",
      detail: `${a.patientName} · ${a.date} at ${a.time} (${a.mode === "clinic" ? "clinic" : "video"})${a.concern ? ` · ${a.concern}` : ""}.`,
      patientId: a.patientId,
      patientName: a.patientName,
    });
  }

  alerts.sort((a, b) => {
    const sev = severityRank[b.severity] - severityRank[a.severity];
    if (sev !== 0) return sev;
    return a.title.localeCompare(b.title);
  });

  return alerts;
}

export function countBySeverity(alerts: TreatmentAlert[]): Record<AlertSeverity, number> {
  const counts: Record<AlertSeverity, number> = { high: 0, medium: 0, low: 0 };
  for (const a of alerts) counts[a.severity] += 1;
  return counts;
}

// --- Mongo query shapes -----------------------------------------------------
//
// Filters and pipelines are built here as plain objects rather than inline in
// the loader. Three reasons: a typo in a `$match` is not a compile error and not
// a unit-test error, it is a runtime 500 in production; keeping the window
// constants beside the filters that consume them stops the two drifting apart;
// and a shape that is a pure function can be executed against the real database
// from a script, which is the only way to be sure the pipeline is valid at all.

export interface PlanIdRange {
  plan: { $in: string[] };
}

/**
 * Which of these plans have a glucose reading since `since`?
 *
 * `$group` without an accumulator is deliberate — we only need the set of plan
 * ids that appear, and this avoids shipping a count nobody reads.
 */
export function glucoseSeenSincePipeline(planIds: string[], since: Date): PipelineStage[] {
  return [
    { $match: { plan: { $in: planIds }, createdAt: { $gte: since } } },
    { $group: { _id: "$plan" } },
  ];
}

// Mongoose 9 dropped the exported `FilterQuery` helper in favour of
// `QueryFilter`, so each filter is typed by the document it will run against.
type ReminderFilter = QueryFilter<ITreatmentReminder>;
type GlucoseFilter = QueryFilter<IGlucoseReading>;
type AppointmentFilter = QueryFilter<IAppointment>;

/** Pending reminders on the given plans that are past their due date. */
export function overdueReminderFilter(planIds: string[], today: string): ReminderFilter {
  return { plan: { $in: planIds }, status: "pending", dueDate: { $lt: today } };
}

/** Recent readings, newest first, before the concerning-range filter is applied in memory. */
export function concerningReadingFilter(since: Date): GlucoseFilter {
  return { createdAt: { $gte: since } };
}

/** Appointments still marked confirmed whose date has passed. */
export function missedAppointmentFilter(today: string): AppointmentFilter {
  return { status: "confirmed", date: { $lt: today } };
}
