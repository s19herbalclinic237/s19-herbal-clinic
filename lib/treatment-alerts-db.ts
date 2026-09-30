import "server-only";
import type { Types } from "mongoose";
import { TreatmentPlan } from "@/lib/models/TreatmentPlan";
import type { ITreatmentPlan } from "@/lib/models/TreatmentPlan";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentFollowUp } from "@/lib/models/TreatmentFollowUp";
import { GlucoseReading, isGlucoseConcerning } from "@/lib/models/GlucoseReading";
import { Appointment } from "@/lib/models/Appointment";
import { clinicToday } from "@/lib/clinic-time";
import {
  GLUCOSE_MISSED_WINDOW_HOURS,
  CONCERNING_WINDOW_DAYS,
  personFromPlan,
  concerningReadingFilter,
  glucoseSeenSincePipeline,
  missedAppointmentFilter,
  overdueReminderFilter,
  type AlertInputs,
  type ConcerningReadingInput,
  type LatestFollowUpInput,
  type MissedAppointmentInput,
  type OverdueReminderInput,
} from "@/lib/treatment-alerts";

const DAY = 24 * 60 * 60 * 1000;

/** Caps so one pathological tenant cannot stall a request. */
const PLAN_LIMIT = 500;
const REMINDER_LIMIT = 100;
const READING_LIMIT = 50;
const APPOINTMENT_LIMIT = 100;

type PopulatedPlan = ITreatmentPlan & { user: { _id: string; name?: string; email?: string } | null };

/**
 * Load everything `computeTreatmentAlerts` needs, in a fixed number of queries.
 *
 * The feed previously issued two queries per active plan — a glucose count and a
 * latest-follow-up lookup — so a clinic with 300 active plans made 600 extra
 * round trips per dashboard load. Both are now aggregated once across all plans.
 * The populated reads were already one query each.
 *
 * `now` is injectable so tests and dry runs can pin the clock.
 */
export async function loadAlertInputs(now: Date = new Date()): Promise<AlertInputs> {
  const today = clinicToday(now);

  const allPlans = (await TreatmentPlan.find()
    .populate("user", "name email")
    .sort({ startDate: -1 })
    .limit(PLAN_LIMIT)
    .lean()) as unknown as PopulatedPlan[];

  const plans = allPlans.filter((p) => p.status !== "completed");
  const activeIds = plans.map((p) => String(p._id));

  const glucoseCutoff = new Date(now.getTime() - GLUCOSE_MISSED_WINDOW_HOURS * 60 * 60 * 1000);
  const concerningCutoff = new Date(now.getTime() - CONCERNING_WINDOW_DAYS * DAY);

  const glucoseMissedPlanIds = new Set<string>();
  let followUps: LatestFollowUpInput[] = [];
  let overdueReminders: OverdueReminderInput[] = [];

  if (activeIds.length > 0) {
    // Ids are passed as strings and cast by Mongoose, matching every other query
    // in the codebase. Casting to ObjectId here would only defeat the field's
    // declared type.
    const planFilter = { $in: activeIds };

    // One aggregate across all plans instead of one count per plan.
    const recentByPlan = await GlucoseReading.aggregate<{ _id: Types.ObjectId }>(
      glucoseSeenSincePipeline(activeIds, glucoseCutoff)
    );
    const seen = new Set(recentByPlan.map((r) => String(r._id)));
    for (const id of activeIds) if (!seen.has(id)) glucoseMissedPlanIds.add(id);

    // Latest follow-up per plan in one sorted pass, kept only for the first.
    const latestFollowUps = await TreatmentFollowUp.find({ plan: planFilter })
      .sort({ date: -1 })
      .lean();
    const firstByPlan = new Map<string, (typeof latestFollowUps)[number]>();
    for (const f of latestFollowUps) {
      const key = String(f.plan);
      if (!firstByPlan.has(key)) firstByPlan.set(key, f);
    }
    const byId = new Map(plans.map((p) => [String(p._id), p]));
    followUps = [...firstByPlan.entries()]
      .map(([planId, f]): LatestFollowUpInput | null => {
        const plan = byId.get(planId);
        if (!plan) return null;
        return {
          ...personFromPlan(plan),
          followUpId: String(f._id),
          newSymptoms: [...(f.newSymptoms ?? [])],
          adverseReactions: [...(f.adverseReactions ?? [])],
          date: f.date as Date,
        };
      })
      .filter((f): f is LatestFollowUpInput => f !== null)
      // Only follow-ups that actually raise an alert, so the map stays small.
      .filter((f) => f.newSymptoms.length > 0 || f.adverseReactions.length > 0);

    const overdue = await TreatmentReminder.find(overdueReminderFilter(activeIds, today))
      .populate("plan", "title forMember")
      .populate("user", "name email")
      .sort({ dueDate: 1 })
      .limit(REMINDER_LIMIT)
      .lean();

    overdueReminders = overdue.map((r): OverdueReminderInput => {
      const plan = r.plan as { _id: string; title: string; forMember?: string } | null;
      const user = r.user as { _id: string; name?: string } | null;
      return {
        reminderId: String(r._id),
        planTitle: plan?.title,
        kind: r.kind,
        title: r.title,
        amountFcfa: r.amountFcfa,
        dueDate: r.dueDate,
        planId: plan ? String(plan._id) : String(r.plan),
        patientId: user ? String(user._id) : undefined,
        patientName: plan?.forMember || user?.name || "Patient",
      };
    });
  }

  const concerning = await GlucoseReading.find(concerningReadingFilter(concerningCutoff))
    .populate("plan", "title forMember")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(READING_LIMIT)
    .lean();

  const concerningReadings: ConcerningReadingInput[] = concerning
    .filter((x) => isGlucoseConcerning(x))
    .map((r) => {
      const plan = r.plan as { _id: string; title: string; forMember?: string } | null;
      const user = r.user as { _id: string; name?: string } | null;
      return {
        readingId: String(r._id),
        planTitle: plan?.title,
        kind: r.kind,
        reading: r.reading,
        mealInfo: r.mealInfo,
        createdAt: r.createdAt as Date,
        planId: plan ? String(plan._id) : String(r.plan),
        patientId: user ? String(user._id) : undefined,
        patientName: plan?.forMember || user?.name || "Patient",
      };
    });

  const missed = await Appointment.find(missedAppointmentFilter(today))
    .populate("user", "name email")
    .sort({ date: 1 })
    .limit(APPOINTMENT_LIMIT)
    .lean();

  const missedAppointments: MissedAppointmentInput[] = missed.map((a) => {
    const user = a.user as { _id: string; name?: string } | null;
    const name = a.forMember || user?.name || "Patient";
    return {
      appointmentId: String(a._id),
      date: a.date,
      time: a.time,
      mode: a.mode,
      concern: a.concern,
      patientId: user ? String(user._id) : undefined,
      patientName: name,
    };
  });

  return {
    now,
    plans,
    followUps,
    glucoseMissedPlanIds,
    overdueReminders,
    concerningReadings,
    missedAppointments,
  };
}