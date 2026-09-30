/**
 * Prints the schedule a plan would get, so a clinician can sanity-check the rules
 * without issuing a real plan. Read-only: connects to nothing, writes nothing.
 *
 * Usage:  npm.cmd run preview:plan
 *         npm.cmd run preview:plan -- 2026-04-01 2026-06-30
 */

import {
  derivePlanObligations,
  monitoringWindowsFor,
  reconcilePlanSchedule,
  type ExistingReminder,
} from "@/lib/plan-schedule";
import { DEFAULT_PLAN_RULES, mergePlanRules } from "@/lib/treatment-rules";
import { clinicToday } from "@/lib/clinic-time";

const startDate = process.argv[2] ?? clinicToday();
const endDate = process.argv[3] ?? "";

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
}

if (!endDate) {
  console.error("Provide both dates, e.g. 2026-04-01 2026-06-30");
  process.exit(1);
}

const today = clinicToday();

for (const [label, rules] of [
  ["clinic defaults", DEFAULT_PLAN_RULES],
  [
    "with a known total",
    mergePlanRules({ payment: { instalments: 3, totalFcfa: 450_000 } }),
  ],
] as const) {
  const { obligations, skipped } = derivePlanObligations({
    planId: "preview",
    startDate,
    endDate,
    rules,
    today,
  });

  console.log(`\n=== ${label} ===`);
  console.log(`plan ${startDate} -> ${endDate}   (today is ${today})`);
  console.log(`${obligations.length} obligation(s)\n`);

  for (const o of obligations) {
    const amount = o.amountFcfa === undefined ? "" : `  ${o.amountFcfa.toLocaleString()} FCFA`;
    console.log(
      `  remind ${o.dueDate}  event ${o.eventDate}  [${o.kind}] ${o.title}${amount}`
    );
  }

  for (const s of skipped) {
    console.log(`  -- skipped ${s.kind}: ${s.reason}`);
  }

  // What a second, identical run would do. This is the number that matters: it
  // must be zero, or the engine is not safe to re-run on every plan edit.
  // The synthetic rows mirror exactly what `writeReminders` would have stored -
  // omitting `amountFcfa` here would make the re-run correctly report drift, which
  // is useful for testing but useless for reassuring anyone.
  const stored: ExistingReminder[] = obligations.map((o, i) => ({
    _id: `r${i}`,
    kind: o.kind,
    title: o.title,
    dueDate: o.dueDate,
    status: "pending",
    origin: "derived",
    pinned: false,
    dedupeKey: o.dedupeKey,
    ...(o.amountFcfa === undefined ? {} : { amountFcfa: o.amountFcfa }),
  }));
  const again = reconcilePlanSchedule(obligations, stored);
  console.log(
    `\n  re-run: ${again.create.length} created, ${again.update.length} updated, ` +
      `${again.cancel.length} cancelled, ${again.unchanged} unchanged`
  );
}

console.log("\n=== monitoring windows for today ===");
for (const w of monitoringWindowsFor({ glucose: true }, today)) {
  console.log(`  ${w.id}: ${w.opensAt}-${w.closesAt} (closes ${w.closesOn})`);
}
console.log("");
