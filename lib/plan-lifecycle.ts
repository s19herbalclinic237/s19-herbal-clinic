/**
 * Applying a plan schedule: the only place that writes derived reminders.
 *
 * `lib/plan-schedule.ts` decides *what* should exist. This module decides *how* it
 * is persisted, appends the `PatientEvent` entries the rest of the automation
 * reads, and keeps the failure modes honest.
 *
 * ## Why the writes are not a transaction
 *
 * MongoDB transactions need a replica set. The clinic's database may be a single
 * node, and failing to write reminders would then mean failing to issue a plan.
 *
 * So the writes are ordered by how much they matter, and each is individually
 * recoverable by simply running the function again:
 *
 *   1. reminders are reconciled first, because a patient with no reminders is a
 *      patient nobody is chasing;
 *   2. events are appended last, because an event with no reminder is a record
 *      of a thing that has not happened yet, while a reminder with no event is
 *      merely unrecorded.
 *
 * `dedupeKey` is what makes step 1 safe to retry: the unique index means a
 * partial previous run cannot produce duplicates on the second attempt.
 */

import "server-only";

import { connectDb } from "@/lib/db";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";
import {
  derivePlanObligations,
  reconcilePlanSchedule,
  type DerivationResult,
  type DerivedObligation,
  type ExistingReminder,
  type Reconciliation,
} from "@/lib/plan-schedule";
import { mergePlanRules, type PlanRulesOverrides } from "@/lib/treatment-rules";
import { recordEvent } from "@/lib/event-log";
import { scheduleGate } from "@/lib/schedule-gate";
import { eventKey, systemActor } from "@/lib/events";
import { clinicToday } from "@/lib/clinic-time";

/** The plan fields this module needs. */
export interface PlanScheduleSubject {
  _id: string;
  user: string;
  forMember?: string;
  startDate: Date | string;
  endDate: Date | string;
}

export interface ApplyScheduleInput {
  plan: PlanScheduleSubject;
  overrides?: PlanRulesOverrides | null;
  /**
   * Why this is running. Recorded on the events so a clinician reading the
   * timeline can tell an issue from a reschedule.
   */
  reason: "plan_issued" | "plan_changed";
}

export interface ApplyScheduleResult {
  /** `false` when the database was unreachable; nothing was written. */
  readonly applied: boolean;
  readonly derivation: DerivationResult;
  readonly reconciliation: Reconciliation;
  /** Short human-readable account, safe to log and to show in the admin UI. */
  readonly summary: string;
}

/** Clinic date of a plan boundary, which the model stores as a Date. */
function planDate(value: Date | string): string {
  if (typeof value === "string") return value.slice(0, 10);
  const iso = value.toISOString();
  return iso.slice(0, 10);
}

/**
 * The shape returned whenever nothing was written.
 *
 * `applied: false` is the load-bearing field: the admin routes pass it through, so
 * a clinician who issues a plan while the engine is inert sees "no schedule
 * generated, and here is why" rather than an empty task list they have to guess
 * the cause of.
 */
function inertResult(reason: string): ApplyScheduleResult {
  return {
    applied: false,
    derivation: { obligations: [], skipped: [] },
    reconciliation: { create: [], update: [], cancel: [], unchanged: 0, skipped: [] },
    summary: reason,
  };
}

/**
 * Derives the schedule for a plan and reconciles it into the database.
 *
 * Safe to call repeatedly: the second call with unchanged inputs reports
 * `create: 0, update: 0, cancel: 0` and writes nothing.
 */
export async function applyPlanSchedule(input: ApplyScheduleInput): Promise<ApplyScheduleResult> {
  const { plan } = input;

  // Checked before anything else, including the database connection. The engine
  // ships inert because its intervals are placeholders rather than the clinic's,
  // so the correct default is to do nothing at all - and doing nothing must not
  // cost a connection. See `lib/schedule-gate.ts`.
  const gate = scheduleGate();
  if (!gate.enabled) {
    console.warn(`[plan-schedule] ${String(plan._id)}: inert. ${gate.error}`);
    return inertResult(gate.error);
  }

  const conn = await connectDb();
  if (!conn) {
    return inertResult("Database unavailable; the plan was created without its schedule.");
  }

  const rules = mergePlanRules(input.overrides);
  const derivation = derivePlanObligations({
    planId: String(plan._id),
    startDate: planDate(plan.startDate),
    endDate: planDate(plan.endDate),
    rules,
    today: clinicToday(),
  });

  const existing = (await TreatmentReminder.find({ plan: plan._id }).lean()) as unknown as ExistingReminder[];
  const reconciliation = reconcilePlanSchedule(derivation.obligations, existing);

  await writeReminders(String(plan._id), plan.user, plan.forMember, reconciliation);

  const written = reconciliation.create.length + reconciliation.update.length + reconciliation.cancel.length;
  await recordScheduleEvents({
    plan,
    reason: input.reason,
    derivation,
    reconciliation,
  });

  const summary = describe(derivation, reconciliation, written);
  console.log(`[plan-schedule] ${String(plan._id)}: ${summary}`);

  return { applied: true, derivation, reconciliation, summary };
}

/** Inserts, patches and cancels. Each step is independently retryable. */
async function writeReminders(
  planId: string,
  userId: string,
  forMember: string | undefined,
  reconciliation: Reconciliation
): Promise<void> {
  if (reconciliation.create.length > 0) {
    const docs = reconciliation.create.map((o: DerivedObligation) => ({
      user: userId,
      plan: planId,
      ...(forMember ? { forMember } : {}),
      kind: o.kind,
      title: o.title,
      dueDate: o.dueDate,
      eventDate: o.eventDate,
      ...(o.note ? { notes: o.note } : {}),
      ...(o.amountFcfa !== undefined ? { amountFcfa: o.amountFcfa } : {}),
      status: "pending",
      origin: "derived",
      pinned: false,
      dedupeKey: o.dedupeKey,
    }));

    // A concurrent run may have inserted some of these between the read and the
    // write. The unique index rejects the duplicates; `ordered: false` lets the
    // genuinely new ones through instead of aborting the whole batch.
    try {
      await TreatmentReminder.insertMany(docs, { ordered: false });
    } catch (error) {
      // A duplicate key here means the schedule is already correct, which is the
      // outcome we wanted. Anything else is real and must surface.
      const writeErrors = (error as { writeErrors?: unknown[] }).writeErrors;
      if (!Array.isArray(writeErrors) || writeErrors.some((e) => (e as { code?: number }).code !== 11000)) {
        throw error;
      }
      console.warn("[plan-schedule] duplicates skipped; schedule already present.");
    }
  }

  for (const update of reconciliation.update) {
    await TreatmentReminder.updateOne({ _id: update._id }, { $set: { ...update.set, status: "pending" } });
  }

  // Never deleted. `cancelled` keeps the row out of every task list, because they
  // all filter on `pending`, while leaving the record that it existed.
  for (const id of reconciliation.cancel) {
    await TreatmentReminder.updateOne({ _id: id }, { $set: { status: "cancelled" } });
  }
}

/**
 * Records that a schedule was derived, in the patient's history.
 * One event, not one per reminder: a 90-day plan derives around six reminders,
 * and six events of administrative bookkeeping would bury the one clinical
 * event that actually matters in the timeline.
 */
async function recordScheduleEvents(params: {
  plan: PlanScheduleSubject;
  reason: "plan_issued" | "plan_changed";
  derivation: DerivationResult;
  reconciliation: Reconciliation;
}): Promise<void> {
  const { plan, reason, derivation, reconciliation } = params;
  const planId = String(plan._id);
  const written = reconciliation.create.length + reconciliation.update.length + reconciliation.cancel.length;
  if (written === 0) return;

  const kinds = [...new Set(reconciliation.create.map((o) => o.kind))];
  const nextDue = derivation.obligations[0]?.dueDate ?? null;

  await recordEvent({
    patient: plan.user,
    plan: planId,
    type: reason,
    source: "automation",
    actor: systemActor("treatment plan scheduler"),
    summary:
      written === 1
        ? "Treatment schedule generated: 1 item"
        : `Treatment schedule generated: ${written} items`,
    data: {
      created: reconciliation.create.length,
      rescheduled: reconciliation.update.length,
      withdrawn: reconciliation.cancel.length,
      kinds,
      nextDue,
      // Surfaced rather than swallowed: "why is there no payment reminder"
      // is otherwise unanswerable from the timeline.
      skippedRules: derivation.skipped.map((s) => `${s.kind}: ${s.reason}`),
    },
    dedupeKey: eventKey(planId, "schedule", reason, nextDue ?? "none", String(written)),
  });
}

/**
 * Withdraws every outstanding derived reminder for a plan.
 *
 * Called when a treatment is closed. Without it, finishing a course leaves the
 * patient being prompted for a third monthly review that will never happen, and
 * leaves the clinic's alert feed showing an overdue task against a plan that no
 * longer exists.
 *
 * Only `pending` derived rows are withdrawn, and only the ones the engine owns:
 *
 * - a clinician's own reminder is left in place, because closing a plan is a
 *   clinical decision, not a reason to delete someone's note;
 * - a completed row stays completed, since "done" is history and rewriting it to
 *   "cancelled" would misreport what happened;
 * - a pinned row is left alone, for the same reason reconciliation respects it.
 *
 * Cancelled rather than deleted, as everywhere else, so reopening the plan finds
 * the same rows and restores them.
 *
 * ## Deliberately not behind the schedule gate
 *
 * `applyPlanSchedule` refuses to run while `TREATMENT_SCHEDULE_ENABLED` is unset,
 * because generating reminders acts on intervals the clinic has not approved.
 * This function is exempt, and the asymmetry is the point: withdrawal only ever
 * *removes* obligations from a patient's task list.
 *
 * That matters for the state where the engine was on and is later turned off -
 * plans that were issued while it was running still have derived reminders, and
 * closing one of those plans must still clear them. Gating withdrawal would leave
 * a patient being prompted for reviews on a treatment that has ended, which is
 * the exact harm the gate exists to prevent.
 */
export async function withdrawPlanSchedule(plan: PlanScheduleSubject): Promise<{
  withdrawn: number;
  kept: number;
}> {
  const conn = await connectDb();
  if (!conn) return { withdrawn: 0, kept: 0 };

  const result = await TreatmentReminder.updateMany(
    {
      plan: plan._id,
      origin: "derived",
      status: "pending",
      pinned: { $ne: true },
    },
    { $set: { status: "cancelled" } }
  );

  const withdrawn = result.modifiedCount ?? 0;
  if (withdrawn > 0) {
    console.log(`[plan-schedule] ${plan._id}: withdrew ${withdrawn} reminder(s) on close.`);
    await recordEvent({
      patient: plan.user,
      plan: String(plan._id),
      type: "plan_changed",
      source: "automation",
      actor: systemActor("treatment plan scheduler"),
      summary: `Treatment closed: ${withdrawn} remaining reminder${withdrawn === 1 ? "" : "s"} withdrawn`,
      data: { withdrawn },
    });
  }

  return { withdrawn, kept: 0 };
}

/** One-line account of a reconciliation, for logs and the admin response. */
function describe(derivation: DerivationResult, reconciliation: Reconciliation, written: number): string {
  const parts = [
    `${derivation.obligations.length} obligation(s)`,
    `${reconciliation.create.length} created`,
    `${reconciliation.update.length} rescheduled`,
    `${reconciliation.cancel.length} withdrawn`,
    `${reconciliation.unchanged} unchanged`,
  ];
  if (derivation.skipped.length > 0) {
    parts.push(`${derivation.skipped.length} rule(s) produced nothing`);
  }
  return `${parts.join(", ")}${written === 0 ? " (no writes)" : ""}`;
}

/**
 * The JSON-safe account of a schedule run, returned by the admin routes.
 *
 * Exists so both plan endpoints report the same shape, and so the admin panel can
 * show a clinician what was scheduled *and* which rules produced nothing. A plan
 * with no payment reminders should say so on screen, not only in a server log
 * nobody reads.
 */
export interface ScheduleReport {
  applied: boolean;
  summary: string;
  created: number;
  updated: number;
  cancelled: number;
  unchanged: number;
  skipped: { kind: string; reason: string }[];
  next: {
    kind: string;
    title: string;
    dueDate: string;
    eventDate: string;
    amountFcfa: number | null;
  }[];
}

/** Flattens a run into the shape the admin routes return. */
export function toScheduleReport(result: ApplyScheduleResult): ScheduleReport {
  return {
    applied: result.applied,
    summary: result.summary,
    created: result.reconciliation.create.length,
    updated: result.reconciliation.update.length,
    cancelled: result.reconciliation.cancel.length,
    unchanged: result.reconciliation.unchanged,
    skipped: result.derivation.skipped.map((s) => ({ kind: s.kind, reason: s.reason })),
    next: result.derivation.obligations.slice(0, 5).map((o) => ({
      kind: o.kind,
      title: o.title,
      dueDate: o.dueDate,
      eventDate: o.eventDate,
      amountFcfa: o.amountFcfa ?? null,
    })),
  };
}

/** Narrows a stored plan document to what the scheduler needs. */
export function subjectOf(plan: {
  _id: unknown;
  user: unknown;
  forMember?: unknown;
  startDate: Date | string;
  endDate: Date | string;
}): PlanScheduleSubject {
  return {
    _id: String(plan._id),
    user: String(plan.user),
    ...(typeof plan.forMember === "string" && plan.forMember.trim()
      ? { forMember: plan.forMember.trim() }
      : {}),
    startDate: plan.startDate,
    endDate: plan.endDate,
  };
}