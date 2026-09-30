import test from "node:test";
import assert from "node:assert/strict";
import { computeTreatmentAlerts, countBySeverity, type AlertInputs } from "@/lib/treatment-alerts";

/**
 * The alert rules, tested without a database.
 *
 * Every fixture pins `now`, so a plan sitting on its last day produces the same
 * answer at 08:00 and at 23:00. That was the point of threading `now` through:
 * these tests would otherwise be able to pass at 09:00 and fail at 00:01.
 */

const NOW = new Date("2026-09-30T12:00:00.000Z");

type PlanOverrides = Partial<{
  _id: string;
  title: string;
  status: "active" | "completed";
  forMember?: string;
  userName?: string | null;
  glucose: boolean | undefined;
  startOffsetDays: number;
  endOffsetDays: number;
}>;

function plan(overrides: PlanOverrides = {}) {
  const {
    _id = "plan1",
    title = "Diabetes Reset",
    status = "active",
    forMember,
    userName = "Ada Nwosu",
    glucose = true,
    startOffsetDays = -30,
    endOffsetDays = 30,
  } = overrides;

  const start = new Date(NOW);
  start.setDate(start.getDate() + startOffsetDays);
  const end = new Date(NOW);
  end.setDate(end.getDate() + endOffsetDays);

  return {
    _id,
    title,
    status,
    forMember,
    user: userName === null ? null : { _id: "user1", name: userName, email: "a@example.com" },
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    monitoring: glucose
      ? { glucose: true, fastingStart: "06:00", fastingEnd: "10:00", postLunchStart: "14:00", postLunchEnd: "16:00" }
      : { glucose: false, fastingStart: "06:00", fastingEnd: "10:00", postLunchStart: "14:00", postLunchEnd: "16:00" },
  } as unknown as AlertInputs["plans"][number];
}

function inputs(overrides: Partial<AlertInputs> = {}): AlertInputs {
  return {
    now: NOW,
    plans: [],
    followUps: [],
    glucoseMissedPlanIds: new Set(),
    overdueReminders: [],
    concerningReadings: [],
    missedAppointments: [],
    ...overrides,
  };
}

function ids(alerts: ReturnType<typeof computeTreatmentAlerts>): string[] {
  return alerts.map((a) => a.id);
}

test("a healthy plan raises nothing", () => {
  const alerts = computeTreatmentAlerts(
    inputs({ plans: [plan()], glucoseMissedPlanIds: new Set() })
  );
  assert.deepEqual(alerts, []);
});

test("an expired plan demands a final review at high severity", () => {
  const alerts = computeTreatmentAlerts(
    inputs({ plans: [plan({ endOffsetDays: -1 })], glucoseMissedPlanIds: new Set() })
  );
  assert.deepEqual(ids(alerts), ["final-review-plan1"]);
  assert.equal(alerts[0].severity, "high");
  assert.equal(alerts[0].patientName, "Ada Nwosu");
});

test("a plan ending today is active, not expired", () => {
  const alerts = computeTreatmentAlerts(
    inputs({ plans: [plan({ endOffsetDays: 0 })], glucoseMissedPlanIds: new Set() })
  );
  // Ending today means it has not ended yet; "final day" is information, not an
  // exception.
  assert.deepEqual(ids(alerts), ["ending-plan1"]);
  assert.equal(alerts[0].title, "Final day of treatment");
});

test("ending-soon appears inside the 14-day window only", () => {
  const inside = computeTreatmentAlerts(
    inputs({ plans: [plan({ endOffsetDays: 10 })], glucoseMissedPlanIds: new Set() })
  );
  assert.deepEqual(ids(inside), ["ending-plan1"]);

  const outside = computeTreatmentAlerts(
    inputs({ plans: [plan({ endOffsetDays: 15 })], glucoseMissedPlanIds: new Set() })
  );
  assert.deepEqual(outside, []);
});

test("missed glucose is only raised when the loader says the plan is silent", () => {
  const silent = computeTreatmentAlerts(
    inputs({ plans: [plan()], glucoseMissedPlanIds: new Set(["plan1"]) })
  );
  assert.deepEqual(ids(silent), ["glucose-plan1"]);
  assert.equal(silent[0].severity, "medium");
  assert.match(silent[0].detail, /06:00/);

  const reporting = computeTreatmentAlerts(
    inputs({ plans: [plan()], glucoseMissedPlanIds: new Set() })
  );
  assert.deepEqual(reporting, []);
});

test("a plan without glucose monitoring is never nagged about glucose", () => {
  const alerts = computeTreatmentAlerts(
    inputs({ plans: [plan({ glucose: false })], glucoseMissedPlanIds: new Set(["plan1"]) })
  );
  assert.deepEqual(alerts, []);
});

test("a scheduled plan is not nagged while it has not started", () => {
  const alerts = computeTreatmentAlerts(
    inputs({ plans: [plan({ startOffsetDays: 10, endOffsetDays: 90 })], glucoseMissedPlanIds: new Set(["plan1"]) })
  );
  assert.deepEqual(alerts, []);
});

test("the latest follow-up raising a symptom produces one complication alert", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      plans: [plan()],
      glucoseMissedPlanIds: new Set(),
      followUps: [
        {
          planId: "plan1",
          patientId: "user1",
          patientName: "Ada Nwosu",
          followUpId: "fu2",
          newSymptoms: ["dizziness"],
          adverseReactions: [],
          date: new Date("2026-09-28T00:00:00Z"),
        },
      ],
    })
  );
  assert.deepEqual(ids(alerts), ["complication-plan1-fu2"]);
  assert.match(alerts[0].detail, /new symptoms: dizziness/);
});

test("an overdue payment outranks other overdue reminders", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      overdueReminders: [
        {
          reminderId: "r1",
          planId: "plan1",
          patientId: "user1",
          patientName: "Ada Nwosu",
          planTitle: "Diabetes Reset",
          kind: "lab",
          title: "HbA1c test",
          dueDate: "2026-09-20",
        },
        {
          reminderId: "r2",
          planId: "plan1",
          patientId: "user1",
          patientName: "Ada Nwosu",
          planTitle: "Diabetes Reset",
          kind: "payment",
          title: "Instalment 2",
          amountFcfa: 50000,
          dueDate: "2026-09-20",
        },
      ],
    })
  );
  assert.deepEqual(ids(alerts), ["reminder-r2", "reminder-r1"]);
  assert.equal(alerts[0].severity, "high");
  assert.equal(alerts[1].severity, "medium");
  assert.match(alerts[0].title, /50,000 FCFA/);
  // The plan title is what staff read to know which plan the money is for.
  assert.match(alerts[0].detail, /"Diabetes Reset"/);
});

test("a concerning reading is high severity and names the plan", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      concerningReadings: [
        {
          readingId: "g1",
          planId: "plan1",
          patientId: "user1",
          patientName: "Ada Nwosu",
          planTitle: "Diabetes Reset",
          kind: "fasting",
          reading: 180,
          createdAt: new Date("2026-09-29T06:00:00Z"),
        },
      ],
    })
  );
  assert.deepEqual(ids(alerts), ["glucose-concern-g1"]);
  assert.equal(alerts[0].severity, "high");
  assert.match(alerts[0].title, /180 mg\/dL \(fasting\)/);
});

test("a missed appointment carries no plan id", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      missedAppointments: [
        {
          appointmentId: "a1",
          patientId: "user1",
          patientName: "Ada Nwosu",
          date: "2026-09-25",
          time: "09:30",
          mode: "clinic",
          concern: "Review blood sugar",
        },
      ],
    })
  );
  assert.deepEqual(ids(alerts), ["followup-a1"]);
  assert.equal(alerts[0].planId, undefined);
  assert.match(alerts[0].detail, /clinic/);
});

test("a family member is named in preference to the account holder", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      plans: [plan({ forMember: "Chidi Nwosu" })],
      glucoseMissedPlanIds: new Set(["plan1"]),
    })
  );
  assert.equal(alerts[0].patientName, "Chidi Nwosu");
});

test("a plan with no linked account falls back to a generic name", () => {
  const alerts = computeTreatmentAlerts(
    inputs({ plans: [plan({ userName: null })], glucoseMissedPlanIds: new Set(["plan1"]) })
  );
  assert.equal(alerts[0].patientName, "Patient");
  assert.equal(alerts[0].patientId, undefined);
});

test("alerts come back worst severity first", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      plans: [plan({ _id: "low", endOffsetDays: 5 }), plan({ _id: "high", endOffsetDays: -3 })],
      overdueReminders: [
        { reminderId: "r1", planId: "low", patientName: "P", kind: "lab", title: "t", dueDate: "2026-09-01" },
      ],
    })
  );
  const severities = alerts.map((a) => a.severity);
  const ranks = severities.map((s) => ({ high: 3, medium: 2, low: 1 })[s]);
  assert.deepEqual(ranks, [...ranks].sort((a, b) => b - a));
});

test("countBySeverity tallies each bucket", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      plans: [plan({ _id: "a", endOffsetDays: -1 }), plan({ _id: "b", endOffsetDays: -2 })],
      missedAppointments: [
        { appointmentId: "x", patientId: "u", patientName: "P", date: "2026-09-01", time: "10:00", mode: "clinic" },
      ],
      glucoseMissedPlanIds: new Set(),
    })
  );
  assert.deepEqual(countBySeverity(alerts), { high: 3, medium: 0, low: 0 });
});

test("two plans for one person both report the same patient id", () => {
  const alerts = computeTreatmentAlerts(
    inputs({
      plans: [plan({ _id: "p1", endOffsetDays: -1 }), plan({ _id: "p2", endOffsetDays: 3 })],
      glucoseMissedPlanIds: new Set(),
    })
  );
  assert.deepEqual(ids(alerts), ["final-review-p1", "ending-p2"]);
  assert.equal(alerts[0].patientId, "user1");
  assert.equal(alerts[1].patientId, "user1");
});