/**
 * Read-only check that the alert feed's Mongo layer still works.
 *
 * Run with `npm run verify:alerts`. It executes the real pipeline and filters —
 * imported from `lib/treatment-alerts.ts`, not copied — against the live
 * database, then derives the alerts and prints the daily worklist shape.
 *
 * Writes nothing. It does not create `WorklistItem` rows, so running it is
 * safe on production.
 */
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import mongoose from "mongoose";
import {
  computeTreatmentAlerts,
  countBySeverity,
  glucoseSeenSincePipeline,
  concerningReadingFilter,
  missedAppointmentFilter,
  overdueReminderFilter,
  GLUCOSE_MISSED_WINDOW_HOURS,
  CONCERNING_WINDOW_DAYS,
  type AlertInputs,
} from "@/lib/treatment-alerts";
import { buildWorklist, summariseWorklist } from "@/lib/worklist";
import { TreatmentPlan } from "@/lib/models/TreatmentPlan";
// Registered for its side effect only: `.populate("user", ...)` resolves the
// "User" model by name at query time, and a script that does not import it has
// no way to know it exists. `lib/db` does the same in the app.
import "@/lib/models/User";
import { TreatmentReminder } from "@/lib/models/TreatmentReminder";
import { TreatmentFollowUp } from "@/lib/models/TreatmentFollowUp";
import { GlucoseReading, isGlucoseConcerning } from "@/lib/models/GlucoseReading";
import { Appointment } from "@/lib/models/Appointment";
import { WorklistItem } from "@/lib/models/WorklistItem";
import { clinicToday } from "@/lib/clinic-time";

const DAY = 24 * 60 * 60 * 1000;

function line(label: string, value: unknown) {
  console.log(`  ${String(label).padEnd(34)} ${value}`);
}

async function main() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set.");

  await mongoose.connect(url, { dbName: process.env.MONGO_DB || undefined });
  console.log("Connected.\n");

  const now = new Date();
  const today = clinicToday(now);
  line("Clinic date", `${today} (UTC now ${now.toISOString()})`);

  const allPlans = (await TreatmentPlan.find()
    .populate("user", "name email")
    .sort({ startDate: -1 })
    .limit(500)
    .lean()) as never;

  const plans = (allPlans as unknown as Array<Record<string, unknown>>).filter(
    (p) => p.status !== "completed"
  ) as unknown as AlertInputs["plans"];
  const activeIds = plans.map((p) => String(p._id));
  line("Plans (all / active)", `${(allPlans as unknown[]).length} / ${activeIds.length}`);

  // 1. The aggregate pipeline.
  const glucoseCutoff = new Date(now.getTime() - GLUCOSE_MISSED_WINDOW_HOURS * 3600 * 1000);
  const seen = await GlucoseReading.aggregate<{ _id: unknown }>(
    glucoseSeenSincePipeline(activeIds, glucoseCutoff)
  );
  line("Aggregate ran", `glucosereadings, ${seen.length} plan(s) seen in ${GLUCOSE_MISSED_WINDOW_HOURS}h`);

  // 2. The populated reminder query.
  const overdue = await TreatmentReminder.find(overdueReminderFilter(activeIds, today))
    .populate("plan", "title forMember")
    .populate("user", "name email")
    .sort({ dueDate: 1 })
    .limit(100)
    .lean();
  line("Overdue reminders query ran", `${overdue.length} row(s)`);

  // 3. The follow-up query.
  const followUpsRaw = activeIds.length
    ? await TreatmentFollowUp.find({ plan: { $in: activeIds } }).sort({ date: -1 }).lean()
    : [];
  line("Follow-up query ran", `${followUpsRaw.length} row(s)`);

  // 4. The concerning-reading query.
  const concerningCutoff = new Date(now.getTime() - CONCERNING_WINDOW_DAYS * DAY);
  const concerning = await GlucoseReading.find(concerningReadingFilter(concerningCutoff))
    .populate("plan", "title forMember")
    .populate("user", "name email")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  line("Concerning-reading query ran", `${concerning.filter(isGlucoseConcerning).length} concerning`);

  // 5. The appointment query.
  const missed = await Appointment.find(missedAppointmentFilter(today))
    .populate("user", "name email")
    .sort({ date: 1 })
    .limit(100)
    .lean();
  line("Missed-appointment query ran", `${missed.length} row(s)`);

  // 6. The worklist store.
  const stored = await WorklistItem.countDocuments();
  line("WorklistItem rows", stored);

  // Now build the inputs exactly as the loader does, and derive.
  const glucoseMissedPlanIds = new Set(activeIds.filter((id) => !seen.some((s) => String(s._id) === id)));

  const byId = new Map(plans.map((p) => [String(p._id), p]));
  const firstByPlan = new Map<string, (typeof followUpsRaw)[number]>();
  for (const f of followUpsRaw) {
    const key = String(f.plan);
    if (!firstByPlan.has(key)) firstByPlan.set(key, f);
  }
  const followUps = [...firstByPlan.entries()]
    .map(([planId, f]) => {
      const plan = byId.get(planId);
      if (!plan) return null;
      const user = plan.user as { _id: string; name?: string } | null;
      return {
        planId,
        patientId: user ? String(user._id) : undefined,
        patientName: (plan.forMember as string) || user?.name || "Patient",
        followUpId: String(f._id),
        newSymptoms: [...((f.newSymptoms as string[]) ?? [])],
        adverseReactions: [...((f.adverseReactions as string[]) ?? [])],
        date: f.date as Date,
      };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null)
    .filter((f) => f.newSymptoms.length > 0 || f.adverseReactions.length > 0);

  const alerts = computeTreatmentAlerts({
    now,
    plans,
    followUps,
    glucoseMissedPlanIds,
    overdueReminders: overdue.map((r) => {
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
    }),
    concerningReadings: concerning
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
      }),
    missedAppointments: missed.map((a) => {
      const user = a.user as { _id: string; name?: string } | null;
      return {
        appointmentId: String(a._id),
        date: a.date,
        time: a.time,
        mode: a.mode,
        concern: a.concern,
        patientId: user ? String(user._id) : undefined,
        patientName: (a.forMember as string) || user?.name || "Patient",
      };
    }),
  });

  const worklist = buildWorklist(alerts, [], { now: now.toISOString() });

  console.log("\nAlert feed");
  line("Alerts", alerts.length);
  line("By severity", JSON.stringify(countBySeverity(alerts)));
  const byCategory: Record<string, number> = {};
  for (const a of alerts) byCategory[a.category] = (byCategory[a.category] ?? 0) + 1;
  line("By category", JSON.stringify(byCategory));

  console.log("\nWorklist");
  line("Headline", summariseWorklist(worklist));
  line("Patients", worklist.summary.patients);
  for (const row of worklist.rows.slice(0, 15)) {
    console.log(
      `    [${row.severity.padEnd(6)}] ${row.patientName} — ${row.reasons
        .map((r) => `${r.label}${r.count > 1 ? ` x${r.count}` : ""}`)
        .join("; ")}`
    );
  }
  if (worklist.rows.length > 15) line("...", `${worklist.rows.length - 15} more row(s)`);

  console.log("\nNo writes were performed.");
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});