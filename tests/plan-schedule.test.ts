/**
 * Tests for the treatment-plan schedule derivation and reconciliation.
 *
 * These are the tests that make M3 safe to run unattended. The derivation is pure
 * and takes an explicit `today`, so every case below is a specific calendar
 * situation rather than a race against the clock - which is the only reason
 * "a 90-day plan started mid-flight must not emit a burst of backdated
 * reminders" is something we can assert at all.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  derivePlanObligations,
  monitoringWindowsFor,
  obligationKey,
  reconcilePlanSchedule,
  type DerivedObligation,
  type ExistingReminder,
} from "@/lib/plan-schedule";
import {
  DEFAULT_PLAN_RULES,
  mergePlanRules,
  parseRuleOverrides,
  splitEvenly,
  type PlanRules,
} from "@/lib/treatment-rules";
import { daysBetween, isDateOnly } from "@/lib/clinic-time";

const PLAN = "plan-abc";
const START = "2026-01-01";

function derive(
  rules: PlanRules,
  opts: { start?: string; end?: string; today?: string; planId?: string } = {}
) {
  return derivePlanObligations({
    planId: opts.planId ?? PLAN,
    startDate: opts.start ?? START,
    endDate: opts.end ?? "2026-03-31",
    rules,
    today: opts.today ?? START,
  });
}

describe("a rule set is complete enough to derive a schedule from", () => {
  test("the defaults derive consultations and labs", () => {
    const { obligations } = derive(DEFAULT_PLAN_RULES);
    assert.ok(obligations.length > 0, "expected the default rules to produce something");
    assert.ok(obligations.some((o) => o.kind === "appointment"));
    assert.ok(obligations.some((o) => o.kind === "lab"));
  });

  test("refill and payment derive nothing, and say why", () => {
    // This is the important one. A missing rule must be reported, not silently
    // dropped: otherwise nobody can answer "why has this patient had no
    // payment reminders for two months".
    const { obligations, skipped } = derive(DEFAULT_PLAN_RULES);
    assert.equal(obligations.filter((o) => o.kind === "refill").length, 0);
    assert.equal(obligations.filter((o) => o.kind === "payment").length, 0);

    const kinds = skipped.map((s) => s.kind);
    assert.ok(kinds.includes("refill"), "the missing refill rule was not reported");
    assert.ok(kinds.includes("payment"), "the missing payment rule was not reported");
    for (const s of skipped) {
      assert.ok(s.reason.length > 10, `a skip with no usable reason: ${JSON.stringify(s)}`);
    }
  });

  test("the refill skip names days-of-supply, so the gap is actionable", () => {
    const { skipped } = derive(DEFAULT_PLAN_RULES);
    const refill = skipped.find((s) => s.kind === "refill");
    assert.match(refill?.reason ?? "", /supply/i);
  });
});

describe("obligations carry two dates, not one", () => {
  test("a reminder reaches the patient before the thing happens", () => {
    const { obligations } = derive(DEFAULT_PLAN_RULES);
    for (const o of obligations) {
      assert.ok(
        o.dueDate <= o.eventDate,
        `${o.kind}#${o.sequence} is due ${o.dueDate} but the event is ${o.eventDate}`
      );
    }
  });

  test("the consultation reminder lands exactly one lead time early", () => {
    const consultation = derive(DEFAULT_PLAN_RULES).obligations.find((o) => o.kind === "appointment");
    assert.ok(consultation);
    assert.equal(
      daysBetween(consultation.dueDate, consultation.eventDate),
      DEFAULT_PLAN_RULES.consultation.leadDays
    );
  });

  test("a zero lead time still produces a due date equal to the event date", () => {
    const rules = mergePlanRules({ consultation: { leadDays: 0 } });
    const consultation = derive(rules).obligations.find((o) => o.kind === "appointment");
    assert.ok(consultation);
    assert.equal(consultation.dueDate, consultation.eventDate);
  });
});

describe("nothing is generated outside the plan period", () => {
  test("no obligation falls before the start date", () => {
    const { obligations } = derive(DEFAULT_PLAN_RULES);
    for (const o of obligations) {
      assert.ok(o.eventDate >= START, `${o.kind}#${o.sequence} starts ${o.eventDate} before ${START}`);
    }
  });

  test("no obligation falls after the end date", () => {
    // The one that matters most: a 90-day course must not acquire a month-4
    // review just because 30 divides evenly into 90.
    const { obligations } = derive(DEFAULT_PLAN_RULES);
    for (const o of obligations) {
      assert.ok(o.eventDate <= "2026-03-31", `${o.kind}#${o.sequence} runs on to ${o.eventDate}`);
    }
  });

  test("a 30-day plan gets exactly one consultation, not four", () => {
    const { obligations } = derive(DEFAULT_PLAN_RULES, { end: "2026-01-30" });
    const consultations = obligations.filter((o) => o.kind === "appointment");
    assert.equal(consultations.length, 1);
  });

  test("the first offset delays the first occurrence past day zero", () => {
    // A consultation on the day the plan is issued is not a consultation.
    const consultation = derive(DEFAULT_PLAN_RULES).obligations.find((o) => o.kind === "appointment");
    assert.ok(consultation);
    assert.equal(consultation.eventDate, "2026-01-15");
  });
});

describe("a plan issued mid-flight does not spam the patient", () => {
  test("occurrences that already happened are never announced", () => {
    // Derived on 1 March for a plan that started 1 January. Everything in
    // February is already behind us.
    const { obligations } = derive(DEFAULT_PLAN_RULES, { today: "2026-03-01" });
    for (const o of obligations) {
      assert.ok(o.eventDate >= "2026-03-01", `announced a past event on ${o.eventDate}`);
    }
    assert.ok(obligations.length > 0, "should still produce the remaining obligations");
  });

  test("no reminder is backdated before today", () => {
    const today = "2026-03-01";
    const { obligations } = derive(DEFAULT_PLAN_RULES, { today });
    for (const o of obligations) {
      assert.ok(o.dueDate >= today, `reminder backdated to ${o.dueDate}, today is ${today}`);
    }
  });

  test("an open lead window clamps the reminder to today instead of backdating it", () => {
    // The last consultation of the quarter falls on 16 March with 7 days' notice,
    // so its ideal reminder date is the 9th. Deriving on the 10th means the window
    // has already opened: the reminder is due today, not the 9th.
    //
    // The alternative - writing the 9th - would make the task show as overdue the
    // moment it is created, which reads to a patient as "you have already failed
    // this" for something they were never told about.
    const { obligations } = derive(DEFAULT_PLAN_RULES, { today: "2026-03-10" });

    const imminent = obligations.find((o) => o.eventDate === "2026-03-16");
    assert.ok(imminent, `expected the 16 March review, got ${JSON.stringify(obligations.map((o) => o.eventDate))}`);
    assert.equal(imminent.dueDate, "2026-03-10");

    // Every occurrence whose lead window has already closed is not backdated.
    for (const o of obligations) {
      assert.ok(o.dueDate >= "2026-03-10", `backdated to ${o.dueDate}`);
    }
  });

  test("a reminder due exactly today is not clamped, because it is already correct", () => {
    // One day earlier than the case above: the ideal date *is* today, so the
    // clamp must be a no-op rather than shifting the date by a day.
    const { obligations } = derive(DEFAULT_PLAN_RULES, { today: "2026-03-09" });
    const imminent = obligations.find((o) => o.eventDate === "2026-03-16");
    assert.ok(imminent);
    assert.equal(imminent.dueDate, "2026-03-09");
  });

  test("a fully elapsed plan derives nothing at all", () => {
    const { obligations, skipped } = derive(DEFAULT_PLAN_RULES, {
      start: "2026-01-01",
      end: "2026-02-01",
      today: "2026-06-01",
    });
    assert.equal(obligations.length, 0);
    assert.ok(skipped.length >= 0);
  });
});

describe("obligations carry a stable identity", () => {
  test("the same inputs derive the same keys", () => {
    const a = derive(DEFAULT_PLAN_RULES).obligations.map((o) => o.dedupeKey);
    const b = derive(DEFAULT_PLAN_RULES).obligations.map((o) => o.dedupeKey);
    assert.deepEqual(a, b);
  });

  test("keys do not contain a timestamp or a random component", () => {
    // A key built from "now" would defeat the entire reconciliation, so the
    // shape is asserted rather than trusted.
    for (const o of derive(DEFAULT_PLAN_RULES).obligations) {
      assert.equal(o.dedupeKey, obligationKey(PLAN, o.kind, o.sequence));
      assert.match(o.dedupeKey, /^plan:plan-abc:[a-z]+:\d+$/);
    }
  });

  test("the same cadence in two different plans has different keys", () => {
    const mine = derive(DEFAULT_PLAN_RULES, { planId: "plan-a" }).obligations;
    const theirs = derive(DEFAULT_PLAN_RULES, { planId: "plan-b" }).obligations;
    const mineKeys = new Set(mine.map((o) => o.dedupeKey));
    assert.ok(theirs.every((o) => !mineKeys.has(o.dedupeKey)));
  });

  test("keys never contain a colon in the plan id position twice", () => {
    // Colons are the separator; an id containing one could make two different
    // obligations collide and silently drop one of them.
    const odd = derive(DEFAULT_PLAN_RULES, { planId: "a:b" }).obligations;
    for (const o of odd) {
      assert.equal(o.dedupeKey, obligationKey("a:b", o.kind, o.sequence));
    }
  });
});

describe("malformed inputs are refused, not guessed at", () => {
  test("a reversed plan period yields nothing and reports why", () => {
    const { obligations, skipped } = derivePlanObligations({
      planId: PLAN,
      startDate: "2026-03-31",
      endDate: "2026-01-01",
      rules: DEFAULT_PLAN_RULES,
      today: "2026-01-01",
    });
    assert.equal(obligations.length, 0);
    assert.match(skipped[0]?.reason ?? "", /unusable plan period/);
  });

  test("an unparseable date yields nothing and reports why", () => {
    const { obligations, skipped } = derivePlanObligations({
      planId: PLAN,
      startDate: "not-a-date",
      endDate: "2026-03-31",
      rules: DEFAULT_PLAN_RULES,
      today: "2026-01-01",
    });
    assert.equal(obligations.length, 0);
    assert.match(skipped[0]?.reason ?? "", /unusable plan period/);
  });

  test("a zero cadence is refused with the offending value named", () => {
    const { obligations, skipped } = derive(
      mergePlanRules({ consultation: { everyDays: 0 } })
    );
    assert.equal(obligations.filter((o) => o.kind === "appointment").length, 0);
    assert.match(skipped.find((s) => s.kind === "appointment")?.reason ?? "", /everyDays/);
  });

  test("a negative lead time is refused rather than reminding after the event", () => {
    const { obligations, skipped } = derive(
      mergePlanRules({ consultation: { leadDays: -5 } })
    );
    assert.equal(obligations.filter((o) => o.kind === "appointment").length, 0);
    assert.match(skipped.find((s) => s.kind === "appointment")?.reason ?? "", /leadDays/);
  });

  test("a pathological cadence is capped instead of filling the collection", () => {
    // everyDays: 1 over a 20-year plan would otherwise be ~7,000 reminders for a
    // single patient.
    const { obligations } = derivePlanObligations({
      planId: PLAN,
      startDate: "2026-01-01",
      endDate: "2046-01-01",
      rules: mergePlanRules({ consultation: { everyDays: 1, firstOffsetDays: 0, leadDays: 0 } }),
      today: "2026-01-01",
      maxPerKind: 25,
    });
    assert.equal(obligations.filter((o) => o.kind === "appointment").length, 25);
  });

  test("refill and payment omissions are reported per kind, once each", () => {
    const { skipped } = derive(DEFAULT_PLAN_RULES);
    assert.equal(skipped.filter((s) => s.kind === "refill").length, 1);
    assert.equal(skipped.filter((s) => s.kind === "payment").length, 1);
  });
});

describe("occurrence numbers do not move when the clock does", () => {
  // The bug this guards against: numbering the occurrences that *survive* today's
  // filter rather than their position in the cadence. It looks harmless and is
  // not - reconciliation matches on this number, so renumbering makes the engine
  // believe a future obligation has disappeared and cancel it.
  test("a plan re-derived later keeps the same keys for the same events", () => {
    const onDayOne = derive(DEFAULT_PLAN_RULES, { today: START }).obligations;
    const sixWeeksIn = derive(DEFAULT_PLAN_RULES, { today: "2026-02-12" }).obligations;

    for (const later of sixWeeksIn) {
      const original = onDayOne.find((o) => o.eventDate === later.eventDate);
      assert.ok(original, `${later.eventDate} was not in the original derivation`);
      assert.equal(
        later.dedupeKey,
        original.dedupeKey,
        `${later.eventDate} changed identity when re-derived`
      );
      assert.equal(later.title, original.title, `${later.eventDate} changed title`);
    }
  });

  test("re-deriving a plan in month two never cancels a future reminder", () => {
    // The exact scenario: a plan issued on 1 January, re-derived on 12 February,
    // with the January review already marked done by the patient.
    const original = derive(DEFAULT_PLAN_RULES, { today: START }).obligations;
    const stored: ExistingReminder[] = original.map((o, i) => ({
      _id: `r${i}`,
      kind: o.kind,
      title: o.title,
      dueDate: o.dueDate,
      status: "pending",
      origin: "derived",
      pinned: false,
      dedupeKey: o.dedupeKey,
    }));
    // r0 = review 1 (15 Jan, now done by the patient), r1 = lab (31 Jan),
    // r2 = review 2 (14 Feb), r3 = review 3 (16 Mar).
    stored[0] = { ...stored[0], status: "done" };

    const later = derive(DEFAULT_PLAN_RULES, { today: "2026-02-12" });
    const r = reconcilePlanSchedule(later.obligations, stored);

    // The lab's event date has passed, so withdrawing it is correct - that is the
    // whole point of re-deriving.
    assert.deepEqual(r.cancel, ["r1"]);

    // Nothing future is withdrawn, and nothing is duplicated.
    assert.deepEqual(r.create, [], "a future reminder was duplicated");
    // Review 2 keeps its identity: its due date moves forward to today because its
    // 7-day lead window opened on the 7th, which is the clamp, not a cancellation.
    assert.deepEqual(
      r.update.map((u) => u._id),
      ["r2"]
    );
    assert.equal(r.update[0].set.dueDate, "2026-02-12");

    // Review 3 is untouched: same key, same date, same title.
    assert.ok(!r.cancel.includes("r3"), "a still-future review was cancelled");
  });

  test("the sequence is the position in the cadence, so it is never reused", () => {
    const numbers = derive(DEFAULT_PLAN_RULES).obligations
      .filter((o) => o.kind === "appointment")
      .map((o) => o.sequence);
    assert.deepEqual(numbers, [1, 2, 3]);
  });

  test("deriving a long-started plan still yields its remaining obligations", () => {
    // A cap on the emitted count must not be a cap on the numbering, or a plan
    // first derived years in would produce nothing at all.
    const { obligations } = derivePlanObligations({
      planId: PLAN,
      startDate: "2020-01-01",
      endDate: "2030-01-01",
      rules: mergePlanRules({ consultation: { everyDays: 30, firstOffsetDays: 14, leadDays: 7 } }),
      today: "2029-12-01",
      maxPerKind: 5,
    });
    const consultations = obligations.filter((o) => o.kind === "appointment");
    assert.ok(consultations.length > 0, "a long-running plan derived nothing");
    assert.ok(
      consultations.every((o) => o.sequence > 100),
      "the numbering restarted instead of continuing"
    );
  });
});

describe("payments are only derived when an amount is known", () => {
  test("no total derives nothing and says why", () => {
    const rules = mergePlanRules({ payment: { instalments: 3, totalFcfa: null } });
    const { obligations, skipped } = derive(rules);
    assert.equal(obligations.filter((o) => o.kind === "payment").length, 0);
    assert.match(skipped.find((s) => s.kind === "payment")?.reason ?? "", /no total/i);
  });

  test("a known total produces that many instalments that sum to it", () => {
    const total = 150_000;
    const rules = mergePlanRules({ payment: { instalments: 3, firstOffsetDays: 0, totalFcfa: total } });
    const payments = derive(rules).obligations.filter((o) => o.kind === "payment");
    assert.equal(payments.length, 3);
    const sum = payments.reduce((acc, p) => acc + (p.amountFcfa ?? 0), 0);
    assert.equal(sum, total, "instalments must add up to the quoted total");
  });

  test("no instalment falls after the plan ends", () => {
    const rules = mergePlanRules({ payment: { instalments: 12, firstOffsetDays: 0, totalFcfa: 1_200_000 } });
    const payments = derive(rules).obligations.filter((o) => o.kind === "payment");
    for (const p of payments) {
      assert.ok(p.eventDate <= "2026-03-31", `instalment due ${p.eventDate}, after the plan ends`);
    }
  });

  test("a zero total derives nothing", () => {
    const rules = mergePlanRules({ payment: { instalments: 3, totalFcfa: 0 } });
    const { obligations, skipped } = derive(rules);
    assert.equal(obligations.filter((o) => o.kind === "payment").length, 0);
    assert.match(skipped.find((s) => s.kind === "payment")?.reason ?? "", /zero or negative/);
  });

  test("a negative total derives nothing rather than billing the patient", () => {
    const rules = mergePlanRules({ payment: { instalments: 2, totalFcfa: -5000 } });
    assert.equal(derive(rules).obligations.filter((o) => o.kind === "payment").length, 0);
  });
});

describe("installments always sum to the total", () => {
  test("an uneven split puts the remainder on the last payment", () => {
    assert.deepEqual(splitEvenly(1000, 3), [333, 333, 334]);
  });

  test("an even split is unchanged", () => {
    assert.deepEqual(splitEvenly(9000, 3), [3000, 3000, 3000]);
  });

  test("a single instalment is the whole amount", () => {
    assert.deepEqual(splitEvenly(12345, 1), [12345]);
  });

  test("a nonsensical split yields nothing", () => {
    assert.deepEqual(splitEvenly(1000, 0), []);
    assert.deepEqual(splitEvenly(1000, -2), []);
    assert.deepEqual(splitEvenly(-5, 2), []);
    assert.deepEqual(splitEvenly(Number.NaN, 2), []);
  });
});

describe("reconciling never destroys a clinician's work", () => {
  const obligations = derive(DEFAULT_PLAN_RULES).obligations;

  function existing(over: Partial<ExistingReminder> & { _id: string }): ExistingReminder {
    return {
      kind: "lab",
      title: "x",
      dueDate: "2026-01-01",
      status: "pending",
      origin: "derived",
      pinned: false,
      dedupeKey: null,
      ...over,
    };
  }

  test("a stored manual reminder is never created over, updated or cancelled", () => {
    // The single most important test in this file. A clinician's own reminder
    // must survive a re-run no matter what the rules say.
    const manual = existing({ _id: "manual-1", origin: "manual", title: "Bring your scanner" });
    const r = reconcilePlanSchedule(obligations, [manual]);
    assert.equal(r.create.length, obligations.length);
    assert.equal(r.update.length, 0);
    assert.equal(r.cancel.length, 0);
  });

  test("an obligation with no stored counterpart is created", () => {
    const r = reconcilePlanSchedule(obligations, []);
    assert.equal(r.create.length, obligations.length);
    assert.equal(r.update.length, 0);
    assert.equal(r.cancel.length, 0);
    assert.equal(r.unchanged, 0);
  });

  test("reconciling identical state twice changes nothing the second time", () => {
    // This is what makes re-running on every plan edit safe.
    const first = reconcilePlanSchedule(obligations, []);
    const stored = obligations.map(
      (o, i): ExistingReminder => ({
        _id: `r${i}`,
        kind: o.kind,
        title: o.title,
        dueDate: o.dueDate,
        status: "pending",
        origin: "derived",
        pinned: false,
        dedupeKey: o.dedupeKey,
      })
    );
    const second = reconcilePlanSchedule(obligations, stored);
    assert.equal(first.create.length, obligations.length);
    assert.equal(second.create.length, 0, "the second run created duplicates");
    assert.equal(second.update.length, 0);
    assert.equal(second.cancel.length, 0);
    assert.equal(second.unchanged, stored.length);
  });

  test("a pinned reminder keeps a moved date", () => {
    const target = obligations[0];
    const moved = existing({
      _id: "pinned-1",
      kind: target.kind,
      dedupeKey: target.dedupeKey,
      dueDate: "2026-02-20",
      title: target.title,
      pinned: true,
    });
    const r = reconcilePlanSchedule(obligations, [moved]);
    assert.equal(r.update.length, 0, "a pinned reminder was overwritten");
    assert.ok(r.skipped.some((s) => /pinned/i.test(s.reason)));
  });

  test("a completed reminder is never reopened", () => {
    const target = obligations[0];
    const done = existing({
      _id: "done-1",
      kind: target.kind,
      dedupeKey: target.dedupeKey,
      dueDate: "2026-02-20",
      status: "done",
    });
    const r = reconcilePlanSchedule(obligations, [done]);
    assert.equal(r.update.length, 0);
    assert.equal(r.create.length, obligations.length - 1);
    assert.ok(r.skipped.some((s) => /completed/i.test(s.reason)));
  });

  test("an obligation that disappeared is cancelled, never deleted", () => {
    // Shortening the plan must not leave a reminder for a lab test after the
    // treatment ended, and must not erase the record that it was once scheduled.
    const stored: ExistingReminder[] = [
      existing({ _id: "gone-1", dedupeKey: obligationKey(PLAN, "lab", 9), kind: "lab" }),
    ];
    const r = reconcilePlanSchedule(obligations, stored);
    assert.deepEqual(r.cancel, ["gone-1"]);
    assert.equal(r.create.length, obligations.length);
  });

  test("a withdrawn obligation returns when the plan is extended again", () => {
    // Cancelling had been transient: the plan grew, the obligation is back, and
    // duplicating it would double-charge a patient.
    const target = obligations[0];
    const cancelled = existing({
      _id: "back-1",
      dedupeKey: target.dedupeKey,
      kind: target.kind,
      status: "cancelled",
    });
    const r = reconcilePlanSchedule(obligations, [cancelled]);
    assert.equal(r.create.length, obligations.length - 1, "it created a duplicate instead of restoring");
    assert.ok(r.update.some((u) => u._id === "back-1"));
  });

  test("a stored row with no dedupe key is ignored entirely", () => {
    // Pre-engine reminders have no key. Guessing a match for one would be a
    // guess, and a wrong guess rewrites a clinician's item.
    const r = reconcilePlanSchedule(obligations, [existing({ _id: "legacy-1", dedupeKey: null })]);
    assert.equal(r.create.length, obligations.length);
    assert.equal(r.cancel.length, 0);
  });

  test("a drifted title is corrected when it is not pinned", () => {
    const target = obligations[0];
    const drifted = existing({
      _id: "drift-1",
      kind: target.kind,
      dedupeKey: target.dedupeKey,
      dueDate: target.dueDate,
      title: "Laboratory test",
    });
    const r = reconcilePlanSchedule(obligations, [drifted]);
    assert.equal(r.update.length, 1);
    assert.equal(r.update[0].set.title, target.title);
  });

  test("a moved date is corrected back when it is not pinned", () => {
    const target = obligations[0];
    const moved = existing({
      _id: "move-1",
      kind: target.kind,
      dedupeKey: target.dedupeKey,
      title: target.title,
      dueDate: "2026-02-20",
    });
    const r = reconcilePlanSchedule(obligations, [moved]);
    assert.equal(r.update.length, 1);
    assert.equal(r.update[0].set.dueDate, target.dueDate);
  });

  test("reconciliation is idempotent in both directions", () => {
    const stored = obligations.map(
      (o, i): ExistingReminder => ({
        _id: `r${i}`,
        kind: o.kind,
        title: o.title,
        dueDate: o.dueDate,
        status: "pending",
        origin: "derived",
        pinned: false,
        dedupeKey: o.dedupeKey,
      })
    );
    const first = reconcilePlanSchedule(obligations, stored);
    assert.equal(first.create.length + first.update.length + first.cancel.length, 0);
  });
});

describe("monitoring is a projection, not a pile of rows", () => {
  test("a plan with no monitoring requirement has no windows", () => {
    assert.deepEqual(monitoringWindowsFor({ glucose: false }, "2026-01-01"), []);
    assert.deepEqual(monitoringWindowsFor(null, "2026-01-01"), []);
    assert.deepEqual(monitoringWindowsFor(undefined, "2026-01-01"), []);
  });

  test("a glucose plan has a fasting and a post-lunch window", () => {
    const windows = monitoringWindowsFor({ glucose: true }, "2026-01-01");
    assert.equal(windows.length, 2);
    assert.deepEqual(windows.map((w) => w.id), ["fasting", "postLunch"]);
  });

  test("custom windows are respected", () => {
    const windows = monitoringWindowsFor(
      { glucose: true, fastingStart: "05:30", fastingEnd: "07:30" },
      "2026-01-01"
    );
    const fasting = windows.find((w) => w.id === "fasting");
    assert.equal(fasting?.opensAt, "05:30");
    assert.equal(fasting?.closesAt, "07:30");
    assert.equal(fasting?.closesOn, "2026-01-01T07:30");
  });

  test("a malformed time falls back to the documented default", () => {
    // Better a slightly wrong window the patient can see than a silently
    // dropped obligation to test their blood sugar.
    const windows = monitoringWindowsFor(
      { glucose: true, fastingStart: "25:99", fastingEnd: "not-a-time" },
      "2026-01-01"
    );
    const fasting = windows.find((w) => w.id === "fasting");
    assert.equal(fasting?.opensAt, "06:00");
    assert.equal(fasting?.closesAt, "10:00");
  });

  test("a window that closes before it opens is dropped", () => {
    const windows = monitoringWindowsFor(
      { glucose: true, fastingStart: "10:00", fastingEnd: "06:00" },
      "2026-01-01"
    );
    assert.equal(windows.find((w) => w.id === "fasting"), undefined);
  });

  test("an invalid date yields no windows", () => {
    assert.deepEqual(monitoringWindowsFor({ glucose: true }, "2026-02-30"), []);
    assert.deepEqual(monitoringWindowsFor({ glucose: true }, "nonsense"), []);
  });
});

describe("overrides parsed from a request body are trusted only after checking", () => {
  // This is the boundary where a form post becomes numbers the engine acts on, so
  // it is tested as carefully as the arithmetic that consumes it.
  test("a body with nothing usable yields no overrides rather than empty ones", () => {
    assert.equal(parseRuleOverrides(null), null);
    assert.equal(parseRuleOverrides(undefined), null);
    assert.equal(parseRuleOverrides("rules"), null);
    assert.equal(parseRuleOverrides([]), null);
    assert.equal(parseRuleOverrides({}), null);
    assert.equal(parseRuleOverrides({ rules: null }), null);
    assert.equal(parseRuleOverrides({ rules: [] }), null);
  });

  test("a usable cadence comes through and the rest of the rule is inherited", () => {
    const parsed = parseRuleOverrides({ rules: { consultation: { everyDays: 14 } } });
    assert.ok(parsed);
    const rules = mergePlanRules(parsed);
    assert.equal(rules.consultation.everyDays, 14);
    assert.equal(rules.consultation.leadDays, DEFAULT_PLAN_RULES.consultation.leadDays);
  });

  test("numeric strings from a form are accepted", () => {
    // An admin form posts strings. Rejecting them would mean the override feature
    // only works for a JSON client, which nobody uses.
    const parsed = parseRuleOverrides({ rules: { lab: { everyDays: "60", leadDays: "10" } } });
    assert.ok(parsed);
    const rules = mergePlanRules(parsed);
    assert.equal(rules.lab?.everyDays, 60);
    assert.equal(rules.lab?.leadDays, 10);
  });

  test("an unusable number is dropped and the default stands", () => {
    for (const bad of ["", "abc", -5, 0, 1.5, null, {}, []]) {
      const parsed = parseRuleOverrides({ rules: { consultation: { everyDays: bad } } });
      if (parsed === null) continue; // nothing survived, so defaults stand entirely
      const rules = mergePlanRules(parsed);
      assert.equal(
        rules.consultation.everyDays,
        DEFAULT_PLAN_RULES.consultation.everyDays,
        `a bad everyDays (${JSON.stringify(bad)}) changed the cadence`
      );
    }
  });

  test("reviews cannot be switched off, but labs and refills can", () => {
    const parsed = parseRuleOverrides({ rules: { consultation: null, lab: null, refill: null } });
    assert.ok(parsed);
    // The consultation attempt is ignored, and a schedule with no reviews would be
    // a silent failure rather than a policy decision.
    assert.equal(parsed.consultation, undefined);
    assert.equal(parsed.lab, null);
    assert.equal(parsed.refill, null);

    const rules = mergePlanRules(parsed);
    assert.ok(rules.consultation, "a plan must always have reviews");
    assert.equal(rules.lab, null);
    assert.equal(rules.refill, null);
  });

  test("a payment total is accepted and turns the rule on", () => {
    const parsed = parseRuleOverrides({ rules: { payment: { instalments: 3, totalFcfa: 150000 } } });
    assert.ok(parsed);
    const rules = mergePlanRules(parsed);
    assert.equal(rules.payment?.totalFcfa, 150000);
    assert.equal(rules.payment?.instalments, 3);
    // The title and lead time must come from the documented defaults, not be
    // undefined - which is the bug that produced an untitled reminder.
    assert.equal(rules.payment?.titleTemplate.length > 0, true);
    assert.equal(rules.payment?.leadDays > 0, true);
  });

  test("an unusable amount is treated as no amount, never as a negative bill", () => {
    for (const bad of ["abc", -5000, 0, NaN, Infinity, {}]) {
      const parsed = parseRuleOverrides({ rules: { payment: { instalments: 2, totalFcfa: bad } } });
      const rules = mergePlanRules(parsed);
      assert.equal(
        rules.payment?.totalFcfa ?? null,
        null,
        `an unusable total (${String(bad)}) produced a payable amount`
      );
      const derived = derive(rules);
      assert.equal(derived.obligations.filter((o) => o.kind === "payment").length, 0);
    }
  });

  test("a blank amount means no amount", () => {
    const parsed = parseRuleOverrides({ rules: { payment: { instalments: 2, totalFcfa: "" } } });
    assert.equal(mergePlanRules(parsed).payment?.totalFcfa ?? null, null);
  });

  test("a payment override that is not an object is ignored", () => {
    assert.equal(parseRuleOverrides({ rules: { payment: "150000" } }), null);
    assert.equal(parseRuleOverrides({ rules: { payment: [] } }), null);
  });

  test("a monitoring grace period is read", () => {
    const parsed = parseRuleOverrides({ rules: { monitoring: { graceHours: 4 } } });
    assert.ok(parsed);
    assert.equal(mergePlanRules(parsed).monitoring.graceHours, 4);
  });

  test("a cadence that is not an object is ignored rather than throwing", () => {
    assert.equal(parseRuleOverrides({ rules: { consultation: "every 30 days" } }), null);
    assert.equal(parseRuleOverrides({ rules: { lab: 14 } }), null);
  });

  test("both rule keys are accepted", () => {
    // `rules` is the documented name; `scheduleRules` exists so an older admin
    // payload does not silently do nothing.
    const a = parseRuleOverrides({ rules: { consultation: { everyDays: 21 } } });
    const b = parseRuleOverrides({ scheduleRules: { consultation: { everyDays: 21 } } });
    assert.deepEqual(a, b);
  });
});

describe("rule merging does not silently combine unrelated defaults", () => {
  test("an override keeps the rest of the rule", () => {
    const rules = mergePlanRules({ consultation: { everyDays: 14 } });
    assert.equal(rules.consultation.everyDays, 14);
    assert.equal(rules.consultation.leadDays, DEFAULT_PLAN_RULES.consultation.leadDays);
    assert.equal(rules.consultation.titleTemplate, DEFAULT_PLAN_RULES.consultation.titleTemplate);
  });

  test("an explicit null switches a rule off", () => {
    const rules = mergePlanRules({ lab: null });
    assert.equal(rules.lab, null);
  });

  test("no overrides returns the defaults", () => {
    assert.deepEqual(mergePlanRules(), DEFAULT_PLAN_RULES);
    assert.deepEqual(mergePlanRules(null), DEFAULT_PLAN_RULES);
  });

  test("monitoring overrides merge rather than replace", () => {
    const rules = mergePlanRules({ monitoring: { graceHours: 4 } });
    assert.equal(rules.monitoring.graceHours, 4);
  });
});

describe("derived titles carry the treatment month", () => {
  test("templates are filled in and never left with a placeholder", () => {
    for (const o of derive(DEFAULT_PLAN_RULES).obligations as readonly DerivedObligation[]) {
      assert.doesNotMatch(o.title, /\{month\}|\{n\}/, `unfilled template: ${o.title}`);
      assert.ok(o.title.length > 3);
    }
  });

  test("the month of an occurrence matches the plan model's own convention", () => {
    // The reminder says "month 2" and the patient dashboard says "Month 2 of 3".
    // If these ever disagree, the clinic stops trusting the portal.
    const { obligations } = derive(DEFAULT_PLAN_RULES);
    const second = obligations.find((o) => o.kind === "appointment" && o.sequence === 2);
    assert.ok(second, "expected a second consultation");
    const offset = daysBetween(START, second.eventDate);
    assert.ok(offset >= 30, `second consultation should be at least a month in, got day ${offset}`);
    assert.equal(second.month, 2);
  });
});

describe("the derivation never mutates its input", () => {
  test("rules are returned unchanged", () => {
    const before = JSON.stringify(DEFAULT_PLAN_RULES);
    derive(DEFAULT_PLAN_RULES, { today: "2026-02-15" });
    assert.equal(JSON.stringify(DEFAULT_PLAN_RULES), before);
  });

  test("the result is ordered by due date", () => {
    const { obligations } = derive(DEFAULT_PLAN_RULES);
    const dates = obligations.map((o) => o.dueDate);
    assert.deepEqual(dates, [...dates].sort());
  });

  test("every obligation's due date is a real calendar day", () => {
    for (const o of derive(DEFAULT_PLAN_RULES).obligations) {
      assert.ok(isDateOnly(o.eventDate), `${o.eventDate} is not a real date`);
      assert.ok(isDateOnly(o.dueDate), `${o.dueDate} is not a real date`);
    }
  });
});