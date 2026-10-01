import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorklist,
  summariseWorklist,
  STALE_AFTER_DAYS,
  type WorklistState,
} from "@/lib/worklist";
import type { TreatmentAlert } from "@/lib/treatment-alerts";

/**
 * The worklist is the "manage by exception" surface: one line per patient,
 * worst-first, with ownership and age. These tests pin the two behaviours that
 * are easy to get subtly wrong — grouping, and a resolved item re-opening when
 * the underlying problem genuinely comes back.
 */

const NOW = new Date("2026-09-30T08:00:00.000Z").toISOString();
const NOW_MS = Date.parse(NOW);

function alert(overrides: Partial<TreatmentAlert> & { id: string }): TreatmentAlert {
  return {
    severity: "medium",
    category: "overdue-reminder",
    title: "Overdue task",
    detail: "detail",
    ...overrides,
  } as TreatmentAlert;
}

function state(overrides: Partial<WorklistState> & { alertId: string }): WorklistState {
  return {
    status: "open",
    firstSeenAt: NOW,
    lastSeenAt: NOW,
    seenCount: 1,
    ...overrides,
  };
}

test("a claimed row keeps the patient and the staff member distinct", () => {
  // The patient comes from the clinical alert; the owner is the clinician who
  // took it. Conflating the two once wrote a staff user id into a patient field
  // in the audit log, so the distinction is pinned here.
  const { rows } = buildWorklist(
    [alert({ id: "a1", patientId: "patient-ada", patientName: "Ada" })],
    [
      state({
        alertId: "a1",
        status: "claimed",
        patientId: "patient-ada",
        ownerId: "staff-dr-seme",
        ownerName: "Dr Seme",
      }),
    ],
    { now: NOW }
  );

  assert.equal(rows[0].patientId, "patient-ada");
  assert.equal(rows[0].owner?.id, "staff-dr-seme");
  assert.notEqual(rows[0].patientId, rows[0].owner?.id);
});

test("a stored state can name the patient without naming an owner", () => {
  const { rows } = buildWorklist(
    [alert({ id: "a1", patientId: "patient-ada", patientName: "Ada" })],
    [state({ alertId: "a1", patientId: "patient-ada" })],
    { now: NOW }
  );

  assert.equal(rows[0].patientId, "patient-ada");
  assert.equal(rows[0].owner, undefined);
});

function daysAgo(n: number): string {
  return new Date(NOW_MS - n * 86_400_000).toISOString();
}

test("one line per patient, not one per alert", () => {
  const alerts = [
    alert({ id: "a1", patientId: "u1", patientName: "Ada", category: "missed-glucose", severity: "medium" }),
    alert({ id: "a2", patientId: "u1", patientName: "Ada", category: "overdue-reminder", severity: "high" }),
    alert({ id: "b1", patientId: "u2", patientName: "Bayo", category: "concerning-reading", severity: "high" }),
  ];
  const { rows, summary } = buildWorklist(alerts, [], { now: NOW });

  assert.equal(rows.length, 2);
  assert.equal(summary.patients, 2);
  assert.equal(summary.outstanding, 3);

  const ada = rows.find((r) => r.patientId === "u1");
  assert.ok(ada);
  assert.equal(ada.itemCount, 2);
  assert.equal(ada.severity, "high");
});

test("reasons are summarised, most severe first", () => {
  const alerts = [
    alert({ id: "a1", patientId: "u1", patientName: "Ada", category: "missed-glucose", severity: "medium" }),
    alert({ id: "a2", patientId: "u1", patientName: "Ada", category: "concerning-reading", severity: "high" }),
    alert({ id: "a3", patientId: "u1", patientName: "Ada", category: "concerning-reading", severity: "high" }),
  ];
  const { rows } = buildWorklist(alerts, [], { now: NOW });

  assert.deepEqual(
    rows[0].reasons.map((r) => [r.category, r.count]),
    [
      ["concerning-reading", 2],
      ["missed-glucose", 1],
    ]
  );
});

test("the summary headline counts by reason", () => {
  const alerts = [
    alert({ id: "a1", patientId: "u1", patientName: "Ada", category: "missed-glucose" }),
    alert({ id: "a2", patientId: "u1", patientName: "Ada", category: "missed-glucose" }),
    alert({ id: "b1", patientId: "u2", patientName: "Bayo", category: "overdue-reminder" }),
  ];
  const worklist = buildWorklist(alerts, [], { now: NOW });
  const missed = worklist.summary.byCategory.find((c) => c.category === "missed-glucose");

  assert.equal(missed?.count, 2);
  assert.equal(worklist.summary.byCategory[0].count, 2);
  assert.equal(summariseWorklist(worklist), "2 patients require attention today.");
});

test("an empty clinic says so plainly", () => {
  const worklist = buildWorklist([], [], { now: NOW });
  assert.equal(summariseWorklist(worklist), "Nothing needs attention today.");
  assert.equal(worklist.summary.oldestDays, 0);
});

test("unowned work outranks work already in hand", () => {
  const alerts = [
    alert({ id: "claimed", patientId: "u1", patientName: "Ada", severity: "high" }),
    alert({ id: "fresh", patientId: "u2", patientName: "Bayo", severity: "medium" }),
  ];
  const states = [
    state({ alertId: "claimed", status: "claimed", ownerId: "s1", ownerName: "Dr Seme" }),
  ];
  const { rows } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows[0].patientName, "Bayo");
  assert.equal(rows[1].status, "claimed");
  assert.deepEqual(rows[1].owner, { id: "s1", name: "Dr Seme" });
});

test("age comes from firstSeenAt, not from today", () => {
  const alerts = [alert({ id: "a1", patientId: "u1", patientName: "Ada" })];
  const states = [state({ alertId: "a1", firstSeenAt: daysAgo(9), lastSeenAt: daysAgo(1), seenCount: 9 })];

  const { rows } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows[0].waitingDays, 9);
  assert.equal(rows[0].items[0].ageDays, 9);
  assert.equal(rows[0].items[0].stale, true);
  assert.equal(rows[0].items[0].seenCount, 9);
});

test("an item first seen today is not stale", () => {
  const { rows } = buildWorklist([alert({ id: "a1", patientId: "u1", patientName: "Ada" })], [], { now: NOW });
  assert.equal(rows[0].waitingDays, 0);
  assert.equal(rows[0].items[0].stale, false);
  assert.equal(rows[0].items[0].seenCount, 1);
});

test(`stale starts at ${STALE_AFTER_DAYS} days, not before`, () => {
  const justUnder = buildWorklist(
    [alert({ id: "a1", patientId: "u1", patientName: "Ada" })],
    [state({ alertId: "a1", firstSeenAt: daysAgo(STALE_AFTER_DAYS - 1) })],
    { now: NOW }
  );
  assert.equal(justUnder.rows[0].items[0].stale, false);

  const atThreshold = buildWorklist(
    [alert({ id: "a1", patientId: "u1", patientName: "Ada" })],
    [state({ alertId: "a1", firstSeenAt: daysAgo(STALE_AFTER_DAYS) })],
    { now: NOW }
  );
  assert.equal(atThreshold.rows[0].items[0].stale, true);
});

test("a resolved alert still appearing stays hidden", () => {
  const alerts = [alert({ id: "a1", patientId: "u1", patientName: "Ada" })];
  const states = [
    state({
      alertId: "a1",
      status: "resolved",
      ownerId: "s1",
      ownerName: "Dr Seme",
      resolvedAt: daysAgo(2),
      lastSeenAt: daysAgo(1),
    }),
  ];
  const { rows, summary } = buildWorklist(alerts, states, { now: NOW });

  assert.deepEqual(rows, []);
  assert.equal(summary.patients, 0);
  assert.equal(summary.resolved, 1);
});

test("a resolved alert that genuinely comes back re-opens as unowned work", () => {
  const alerts = [alert({ id: "a1", patientId: "u1", patientName: "Ada" })];
  // Resolved four days ago, but the alert was last seen six days ago — meaning
  // it cleared in between and has now returned.
  const states = [
    state({
      alertId: "a1",
      status: "resolved",
      ownerId: "s1",
      ownerName: "Dr Seme",
      resolvedAt: daysAgo(4),
      lastSeenAt: daysAgo(6),
    }),
  ];
  const { rows } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows.length, 1);
  // Nobody's job again: it is a fresh occurrence, not a leftover.
  assert.equal(rows[0].status, "open");
  assert.equal(rows[0].owner, undefined);
  // Aged from when it was last seen before it went away, not from the original
  // first sighting six-plus days ago.
  assert.equal(rows[0].waitingDays, 6);
  // How many times it has happened is preserved for escalation.
  assert.equal(rows[0].items[0].seenCount, 1);
});

test("resolved rows stay out unless explicitly requested", () => {
  const alerts = [alert({ id: "a1", patientId: "u1", patientName: "Ada" })];
  const states = [
    state({ alertId: "a1", status: "resolved", resolvedAt: daysAgo(1), lastSeenAt: daysAgo(1) }),
  ];

  assert.deepEqual(buildWorklist(alerts, states, { now: NOW }).rows, []);
  assert.equal(buildWorklist(alerts, states, { now: NOW }).summary.resolved, 1);

  const shown = buildWorklist(alerts, states, { now: NOW, includeResolved: true });
  assert.equal(shown.rows.length, 1);
  assert.equal(shown.rows[0].status, "resolved");
  // Asking for settled work must not make it count as outstanding again.
  assert.equal(shown.summary.outstanding, 0);
});

test("a claimed item is outstanding but not open", () => {
  const alerts = [
    alert({ id: "a1", patientId: "u1", patientName: "Ada" }),
    alert({ id: "b1", patientId: "u2", patientName: "Bayo" }),
  ];
  const states = [state({ alertId: "b1", status: "claimed", ownerId: "s1", ownerName: "Dr Seme" })];
  const { summary } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(summary.patients, 2);
  assert.equal(summary.outstanding, 1);
  assert.equal(summary.claimed, 1);
});

test("a partly-claimed patient row reads as open", () => {
  const alerts = [
    alert({ id: "a1", patientId: "u1", patientName: "Ada" }),
    alert({ id: "a2", patientId: "u1", patientName: "Ada" }),
  ];
  const states = [state({ alertId: "a2", status: "claimed", ownerId: "s1", ownerName: "Dr Seme" })];
  const { rows } = buildWorklist(alerts, states, { now: NOW });

  // One of her two items is still nobody's job, so the patient is still open.
  assert.equal(rows[0].status, "open");
  // Owners disagree, so no single owner is claimed for the row.
  assert.equal(rows[0].owner, undefined);
});

test("alerts without a patient account group by name", () => {
  const alerts = [
    alert({ id: "a1", patientName: "Chidi", category: "missed-follow-up" }),
    alert({ id: "a2", patientName: "Chidi", category: "missed-glucose" }),
  ];
  const { rows } = buildWorklist(alerts, [], { now: NOW });

  assert.equal(rows.length, 1);
  assert.equal(rows[0].key, "name:Chidi");
  assert.equal(rows[0].patientId, undefined);
});

test("two different accounts with the same name stay separate", () => {
  const alerts = [
    alert({ id: "a1", patientId: "u1", patientName: "Ada" }),
    alert({ id: "b1", patientId: "u2", patientName: "Ada" }),
  ];
  const { rows } = buildWorklist(alerts, [], { now: NOW });
  assert.equal(rows.length, 2);
});

test("a note is carried onto the item without changing its status", () => {
  const alerts = [alert({ id: "a1", patientId: "u1", patientName: "Ada" })];
  const states = [state({ alertId: "a1", note: "Called her; restarting dose." })];
  const { rows } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows[0].status, "open");
  assert.equal(rows[0].items[0].note, "Called her; restarting dose.");
});

test("rows sort by severity once nothing is unowned", () => {
  const alerts = [
    alert({ id: "a", patientId: "u1", patientName: "Ada", severity: "low" }),
    alert({ id: "b", patientId: "u2", patientName: "Bayo", severity: "high" }),
  ];
  const states = [
    state({ alertId: "a", status: "claimed", ownerId: "s1", ownerName: "Dr Seme" }),
    state({ alertId: "b", status: "claimed", ownerId: "s1", ownerName: "Dr Seme" }),
  ];
  const { rows } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows[0].patientName, "Bayo");
});

test("the longest-waiting patient leads within a severity band", () => {
  const alerts = [
    alert({ id: "a", patientId: "u1", patientName: "Ada", severity: "high" }),
    alert({ id: "b", patientId: "u2", patientName: "Bayo", severity: "high" }),
  ];
  const states = [
    state({ alertId: "a", status: "claimed", ownerId: "s1", ownerName: "Dr Seme" }),
    state({ alertId: "b", firstSeenAt: daysAgo(5), status: "claimed", ownerId: "s1", ownerName: "Dr Seme" }),
  ];
  const { rows } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows[0].patientName, "Bayo");
  assert.equal(rows[0].waitingDays, 5);
});

test("today is reported in the clinic's date", () => {
  const { today } = buildWorklist([], [], { now: NOW });
  assert.equal(today, "2026-09-30");
});

test("a corrupt firstSeenAt degrades to age zero rather than NaN", () => {
  const alerts = [alert({ id: "a1", patientId: "u1", patientName: "Ada" })];
  const states = [state({ alertId: "a1", firstSeenAt: "not-a-date" })];
  const { rows, summary } = buildWorklist(alerts, states, { now: NOW });

  assert.equal(rows[0].waitingDays, 0);
  assert.equal(summary.oldestDays, 0);
});