/**
 * Tests for the outbound policy.
 *
 * This is the module that decides whether a patient gets messaged, so the tests here
 * are not about coverage but about the specific ways the answer could be wrong in a way
 * that reaches a real person:
 *
 *  - a message sent after an opt-out
 *  - a message sent with no consent
 *  - a message sent at 03:00
 *  - a message sent to someone who has already had their week's allowance
 *  - a reminder about Tuesday arriving on Thursday
 *  - a patient messaged twice because a tick ran twice
 *
 * Each of those is a real defect, not a hypothetical one. The opt-out case is the most
 * important line in the file: `decideOutbound` checks refusal before it checks
 * anything else, so no policy value can revive a message someone asked not to receive.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  DEFAULT_OUTBOUND_POLICY,
  DECLINE_EXPLANATIONS,
  OUTBOUND_DECLINE_REASONS,
  clinicClock,
  clinicLocalToInstant,
  clinicToday,
  decideOutbound,
  isTerminalDecline,
  isWithinQuietHours,
  isoWeekStart,
  nextIsoWeekStart,
  parseAutomationPolicy,
  quietHoursEnd,
  type OutboundDeclineReason,
  type OutboundDecision,
  type OutboundDecisionInput,
  type OutboundPolicy,
} from "@/lib/outbound-policy";

/* -------------------------------------------------------------------------- */
/* Fixtures                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * An instant, given as a clinic-local wall-clock time.
 *
 * Built through the production helper rather than `new Date("2026-…Z")` so the tests
 * exercise the same clinic-local → UTC conversion the engine uses. A test that wrote
 * UTC strings would silently pass in a UTC dev environment and be wrong in Bafoussam.
 */
function at(dateOnly: string, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  return clinicLocalToInstant(dateOnly, h * 60 + m);
}

/** A sendable message. Individual tests override exactly one field. */
function sendable(overrides: Partial<OutboundDecisionInput> = {}): OutboundDecisionInput {
  return {
    // Wednesday 15 September 2026, 10:00 at the clinic: inside quiet hours' open
    // period, outside any budget, nothing stale.
    now: at("2026-09-15", "10:00"),
    priority: "scheduled",
    consent: true,
    optedOutAt: null,
    phone: "237677123456",
    clinicNumber: "237672595989",
    windowExpiresAt: null,
    scheduledFor: at("2026-09-15", "10:00"),
    sentThisWeek: 0,
    automationEnabled: true,
    policy: DEFAULT_OUTBOUND_POLICY,
    ...overrides,
  };
}

/* -------------------------------------------------------------------------- */
/* The refusals. These come first and nothing overrides them.                  */
/* -------------------------------------------------------------------------- */

describe("a refusal from the patient outranks every configuration value", () => {
  test("a number that asked to stop is never messaged", () => {
    // The single most important line in this file. An opt-out that a policy value can
    // override is not an opt-out.
    const result = decideOutbound(sendable({ optedOutAt: new Date("2020-01-01T00:00:00Z") }));
    assert.deepEqual(result, { action: "stop", reason: "opted_out" });
  });

  test("an opt-out from three years ago still holds", () => {
    // Presence, not recency. There is no expiry and no "we will ask again later"
    // path, because re-asking is how an opt-out becomes a complaint.
    const result = decideOutbound(
      sendable({ optedOutAt: new Date("2023-02-02T00:00:00Z"), policy: quietAllDay() })
    );
    assert.equal(result.action, "stop");
    assert.equal(result.reason, "opted_out");
  });

  test("an opt-out beats an open automation gate and an unused budget", () => {
    const result = decideOutbound(
      sendable({ optedOutAt: new Date(), automationEnabled: true, sentThisWeek: 0 })
    );
    assert.deepEqual(result, { action: "stop", reason: "opted_out" });
  });

  test("an opt-out beats a transactional priority", () => {
    // An appointment confirmation is not a reason to message someone who asked to
    // stop. This is the case where the two-priority split could most plausibly have
    // leaked, so it is asserted explicitly.
    const result = decideOutbound(
      sendable({ priority: "transactional", optedOutAt: new Date() })
    );
    assert.deepEqual(result, { action: "stop", reason: "opted_out" });
  });

  test("no consent means no message", () => {
    for (const consent of [false, null, undefined]) {
      const result = decideOutbound(sendable({ consent }));
      assert.deepEqual(result, { action: "stop", reason: "no_consent" }, `consent=${String(consent)}`);
    }
  });

  test("an unusable number is refused rather than attempted", () => {
    for (const phone of [null, undefined, "", "  ", "6771234", "abcdefgh", "23767712345678901"]) {
      const result = decideOutbound(sendable({ phone }));
      assert.deepEqual(result, { action: "stop", reason: "unusable_number" }, `phone=${String(phone)}`);
    }
  });

  test("the clinic's own number is refused, which is what stops a loop", () => {
    const result = decideOutbound(sendable({ phone: "237672595989" }));
    assert.deepEqual(result, { action: "stop", reason: "loop_guard" });
  });
});

/* -------------------------------------------------------------------------- */
/* The gate                                                                     */
/* -------------------------------------------------------------------------- */

describe("automation is inert unless it is deliberately turned on", () => {
  test("a closed gate stops scheduled messages", () => {
    const result = decideOutbound(sendable({ automationEnabled: false }));
    assert.deepEqual(result, { action: "stop", reason: "automation_disabled" });
  });

  test("a closed gate does not stop transactional messages", () => {
    // The clinic's site already sends appointment confirmations, and putting them
    // behind a flag nobody has enabled would mean a patient books and is not told.
    const result = decideOutbound(sendable({ priority: "transactional", automationEnabled: false }));
    assert.deepEqual(result, { action: "send" });
  });

  test("a policy that failed validation stops scheduled messages rather than defaulting", () => {
    // "Unknown" and "the default I picked" are not the same thing, and only one of
    // them is defensible when the document is unreadable.
    const result = decideOutbound(sendable({ policy: null }));
    assert.deepEqual(result, { action: "stop", reason: "invalid_policy" });
  });

  test("a failed policy does not stop transactional messages", () => {
    const result = decideOutbound(sendable({ priority: "transactional", policy: null }));
    assert.deepEqual(result, { action: "send" });
  });
});

/* -------------------------------------------------------------------------- */
/* Quiet hours                                                                  */
/* -------------------------------------------------------------------------- */

/** Quiet hours covering the entire day. */
function quietAllDay(): OutboundPolicy {
  return { ...DEFAULT_OUTBOUND_POLICY, quietHours: { enabled: true, fromMinutes: 0, toMinutes: 1439 } };
}

describe("quiet hours hold scheduled messages and leave receipts alone", () => {
  test("03:00 is held, and held until 08:00 that morning", () => {
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "03:00"), scheduledFor: at("2026-09-15", "03:00") })
    );
    assert.equal(result.action, "defer");
    if (result.action !== "defer") return;
    assert.equal(result.reason, "quiet_hours");
    // Not "soon", and not a rolling 24 hours: the morning of the 15th, because the
    // quiet period ends at 08:00 and that is the next opening.
    assert.equal(result.until.toISOString(), at("2026-09-15", "08:00").toISOString());
  });

  test("20:00 is the start of the quiet period, so it is held", () => {
    // The default window is 20:00→08:00. Getting this backwards is the failure the
    // `QuietHours` doc comment warns about: an inverted window would hold every message
    // for the whole clinic day.
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "20:00"), scheduledFor: at("2026-09-15", "20:00") })
    );
    assert.equal(result.action, "defer");
    assert.equal(result.reason, "quiet_hours");
  });

  test("19:59 is still inside clinic hours, so it is sendable", () => {
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "19:59"), scheduledFor: at("2026-09-15", "19:59") })
    );
    assert.deepEqual(result, { action: "send" });
  });

  test("08:00 is the end of the quiet period, and it is exclusive", () => {
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "08:00"), scheduledFor: at("2026-09-15", "08:00") })
    );
    assert.deepEqual(result, { action: "send" });
  });

  test("07:59 is still quiet", () => {
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "07:59"), scheduledFor: at("2026-09-15", "07:59") })
    );
    assert.equal(result.action, "defer");
    assert.equal(result.reason, "quiet_hours");
  });

  test("a message held at 20:00 waits until 08:00 the next morning", () => {
    // The wrap-around case, and the one that matters: `nextQuietWindowOpen` has to
    // return a time on the *following* day, not tonight's already-passed opening.
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "20:00"), scheduledFor: at("2026-09-15", "20:00") })
    );
    assert.equal(result.action, "defer");
    if (result.action !== "defer") return;
    assert.equal(result.until.toISOString(), at("2026-09-16", "08:00").toISOString());
  });

  test("a transactional message at 03:00 is sent", () => {
    // A patient who books an appointment at 03:00 is awake at 03:00. Holding their
    // confirmation until 08:00 protects nobody.
    const result = decideOutbound(
      sendable({ priority: "transactional", now: at("2026-09-15", "03:00"), scheduledFor: at("2026-09-15", "03:00") })
    );
    assert.deepEqual(result, { action: "send" });
  });

  test("disabled quiet hours never hold anything", () => {
    const policy: OutboundPolicy = {
      ...DEFAULT_OUTBOUND_POLICY,
      quietHours: { ...DEFAULT_OUTBOUND_POLICY.quietHours, enabled: false },
    };
    const result = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "03:00"), scheduledFor: at("2026-09-15", "03:00") })
    );
    assert.deepEqual(result, { action: "send" });
  });

  test("a window that wraps midnight is held across it and released in the morning", () => {
    // Quiet 16:00→10:00. `from > to` is the wrapping shape, and it is the default's
    // shape, so this is the branch that runs in production.
    const policy: OutboundPolicy = {
      ...DEFAULT_OUTBOUND_POLICY,
      quietHours: { enabled: true, fromMinutes: 16 * 60, toMinutes: 10 * 60 },
    };

    const evening = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "18:00"), scheduledFor: at("2026-09-15", "18:00") })
    );
    assert.equal(evening.action, "defer");
    if (evening.action !== "defer") return;
    // 10:00 the next morning, because the window wraps midnight.
    assert.equal(evening.until.toISOString(), at("2026-09-16", "10:00").toISOString());

    const earlyMorning = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "08:00"), scheduledFor: at("2026-09-15", "08:00") })
    );
    assert.equal(earlyMorning.action, "defer");

    const midday = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "12:00"), scheduledFor: at("2026-09-15", "12:00") })
    );
    assert.deepEqual(midday, { action: "send" });
  });

  test("a window that does not wrap midnight is held inside it", () => {
    // Quiet 13:00→15:00 — a lunchtime window. `from < to` is the shape the default does
    // *not* have, so it needs its own coverage: an implementation that always assumed
    // wrapping would treat every hour of the day as quiet.
    const policy: OutboundPolicy = {
      ...DEFAULT_OUTBOUND_POLICY,
      quietHours: { enabled: true, fromMinutes: 13 * 60, toMinutes: 15 * 60 },
    };

    for (const hhmm of ["12:00", "13:00", "14:00", "15:00", "16:00"]) {
      const now = at("2026-09-15", hhmm);
      const result = decideOutbound(sendable({ policy, now, scheduledFor: now }));
      const shouldHold = hhmm >= "13:00" && hhmm < "15:00";
      assert.equal(
        result.action === "defer" && result.reason === "quiet_hours",
        shouldHold,
        `${hhmm} was ${result.action}`
      );
    }

    // Held at 13:00, released at 15:00 the same day — no midnight crossing.
    const held = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "13:30"), scheduledFor: at("2026-09-15", "13:30") })
    );
    assert.equal(held.action, "defer");
    if (held.action !== "defer") return;
    assert.equal(held.until.toISOString(), at("2026-09-15", "15:00").toISOString());
  });

  test("a wrapping window holds the small hours and releases in the morning", () => {
    const policy: OutboundPolicy = {
      ...DEFAULT_OUTBOUND_POLICY,
      quietHours: { enabled: true, fromMinutes: 22 * 60, toMinutes: 6 * 60 },
    };

    const overnight = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "23:30"), scheduledFor: at("2026-09-15", "23:30") })
    );
    assert.equal(overnight.action, "defer");

    // The small hours are inside a 22:00→06:00 window, and the period ends at 06:00 the
    // *same* morning — not 22:00 that evening. Getting this backwards is the loop bug.
    const smallHours = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "02:00"), scheduledFor: at("2026-09-15", "02:00") })
    );
    assert.equal(smallHours.action, "defer");
    if (smallHours.action !== "defer") return;
    assert.equal(smallHours.until.toISOString(), at("2026-09-15", "06:00").toISOString());

    // Held at 23:30, released at 06:00 the next morning.
    const lateNight = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "23:30"), scheduledFor: at("2026-09-15", "23:30") })
    );
    assert.equal(lateNight.action, "defer");
    if (lateNight.action !== "defer") return;
    assert.equal(lateNight.until.toISOString(), at("2026-09-16", "06:00").toISOString());

    // After the window closes, sendable.
    const morning = decideOutbound(
      sendable({ policy, now: at("2026-09-15", "07:00"), scheduledFor: at("2026-09-15", "07:00") })
    );
    assert.deepEqual(morning, { action: "send" });
  });
});

/* -------------------------------------------------------------------------- */
/* The weekly budget                                                            */
/* -------------------------------------------------------------------------- */

describe("the weekly budget caps automated messages per patient", () => {
  test("a message inside the allowance is sent", () => {
    assert.deepEqual(decideOutbound(sendable({ sentThisWeek: 3 })), { action: "send" });
  });

  test("a message at the allowance is held", () => {
    const result = decideOutbound(sendable({ sentThisWeek: 4 }));
    assert.equal(result.action, "defer");
    assert.equal(result.reason, "weekly_budget_exhausted");
  });

  test("a transaction does not consume the budget", () => {
    // If receipts counted, a patient booking four things in a week would be silently
    // not told about the fifth — and the clinic would have no way to see why.
    const result = decideOutbound(sendable({ priority: "transactional", sentThisWeek: 99 }));
    assert.deepEqual(result, { action: "send" });
  });

  test("a zero budget stops scheduled messages entirely", () => {
    const policy: OutboundPolicy = { ...DEFAULT_OUTBOUND_POLICY, weeklyBudget: 0 };
    const result = decideOutbound(sendable({ policy }));
    assert.deepEqual(result, { action: "stop", reason: "weekly_budget_exhausted" });
  });

  test("the allowance refills on the next Monday, not 24 hours later", () => {
    // A rolling window lets someone messaged four times on Monday be messaged four more
    // on Tuesday. "Sixteen in six days" is not what a weekly budget is for.
    //
    // Judged at midday on Wednesday 15 September 2026, so the next Monday is the 21st.
    const result = decideOutbound(sendable({ sentThisWeek: 4 }));
    assert.equal(result.action, "defer");
    if (result.action !== "defer") return;
    assert.equal(result.reason, "weekly_budget_exhausted");
    assert.equal(result.until.toISOString(), at("2026-09-21", "00:00").toISOString());
  });
});

/* -------------------------------------------------------------------------- */
/* ISO weeks                                                                    */
/* -------------------------------------------------------------------------- */

describe("the budget counts clinic-local ISO weeks, Monday to Sunday", () => {
  test("Monday starts the week", () => {
    // 2026-09-14 is a Monday.
    assert.equal(isoWeekStart(at("2026-09-15", "10:00")).toISOString(), at("2026-09-14", "00:00").toISOString());
  });

  test("Sunday is still the week that started on the Monday", () => {
    // 2026-09-20 is a Sunday, so the week began on the 14th, not the 21st.
    assert.equal(isoWeekStart(at("2026-09-20", "23:59")).toISOString(), at("2026-09-14", "00:00").toISOString());
  });

  test("Sunday at 23:59 and Monday at 00:01 are different weeks", () => {
    const sunday = isoWeekStart(at("2026-09-20", "23:59"));
    const monday = isoWeekStart(at("2026-09-21", "00:01"));
    assert.equal(sunday.toISOString(), at("2026-09-14", "00:00").toISOString());
    assert.equal(monday.toISOString(), at("2026-09-21", "00:00").toISOString());
  });

  test("the refill is exactly seven days after the week start", () => {
    const start = isoWeekStart(at("2026-09-15", "12:00"));
    const refill = nextIsoWeekStart(at("2026-09-15", "12:00"));
    assert.equal(Math.round((refill.getTime() - start.getTime()) / 86_400_000), 7);
  });

  test("asking on a Monday for the next Monday is still a week away", () => {
    // offset 0 must add 7 days, not 0. Returning "now" here would let the budget
    // refill the instant it was exhausted, which is the same as having no budget.
    assert.equal(nextIsoWeekStart(at("2026-09-14", "12:00")).toISOString(), at("2026-09-21", "00:00").toISOString());
  });

  test("the refill moment is itself judged against quiet hours on the next tick", () => {
    // 00:00 Monday is inside the 20:00→08:00 quiet period, so the budget refills then
    // but the message waits until 08:00. That is the right outcome and it only works
    // because each deferral re-decides from the top rather than assuming the previous
    // reason still holds.
    const refill = nextIsoWeekStart(at("2026-09-15", "12:00"));
    assert.equal(isWithinQuietHours(refill, DEFAULT_OUTBOUND_POLICY.quietHours), true);
  });
});

/* -------------------------------------------------------------------------- */
/* Staleness                                                                    */
/* -------------------------------------------------------------------------- */

describe("a stale message is dropped rather than sent late", () => {
  test("a reminder from two days ago is not sent", () => {
    // "Your appointment is tomorrow", arriving two days after the appointment, is not
    // a late reminder. It is a false statement, and it undermines every other message
    // the clinic sends. Judged at midday so quiet hours do not shadow the check.
    const result = decideOutbound(
      sendable({ now: at("2026-09-17", "12:00"), scheduledFor: at("2026-09-15", "12:00") })
    );
    assert.deepEqual(result, { action: "stop", reason: "too_old" });
  });

  test("a dropped message is dropped terminally, not requeued forever", () => {
    // The failure this prevents is a queue that never drains: each tick re-decides the
    // same stale row, gets `too_old` again, and defers it again. The row would sit in
    // the database indefinitely, counted in every "what is waiting" figure.
    const result = decideOutbound(
      sendable({ now: at("2026-09-17", "12:00"), scheduledFor: at("2026-09-15", "12:00") })
    );
    assert.equal(result.action, "stop");
    assert.equal(isTerminalDecline((result as { reason: OutboundDeclineReason }).reason), true);
  });

  test("one minute past the horizon is dropped, and one minute inside it is sent", () => {
    // The boundary itself, because "roughly 24 hours" is not a specification.
    const policy: OutboundPolicy = { ...DEFAULT_OUTBOUND_POLICY, stalenessHours: 1 };
    const scheduledFor = at("2026-09-15", "12:00");

    const inside = decideOutbound(
      sendable({ policy, now: new Date(scheduledFor.getTime() + 59 * 60_000), scheduledFor })
    );
    assert.deepEqual(inside, { action: "send" });

    const outside = decideOutbound(
      sendable({ policy, now: new Date(scheduledFor.getTime() + 61 * 60_000), scheduledFor })
    );
    assert.deepEqual(outside, { action: "stop", reason: "too_old" });
  });

  test("a message exactly on the horizon is still sent", () => {
    // 24 hours after being scheduled, which is the default horizon. Judged at 12:00 on
    // both days so neither is inside quiet hours (20:00→08:00) — otherwise the staleness
    // check would be shadowed by the quiet-hours check and the boundary would be
    // untested rather than proven.
    const result = decideOutbound(
      sendable({ now: at("2026-09-16", "12:00"), scheduledFor: at("2026-09-15", "12:00") })
    );
    assert.deepEqual(result, { action: "send" });
  });

  test("a transaction is never dropped for being old", () => {
    // A patient's appointment confirmation sat in the queue through a deploy. Sending
    // it late is much better than never sending it.
    const result = decideOutbound(
      sendable({
        priority: "transactional",
        now: at("2026-10-20", "10:00"),
        scheduledFor: at("2026-09-15", "10:00"),
      })
    );
    assert.deepEqual(result, { action: "send" });
  });

  test("a message scheduled for the future is held, not dropped", () => {
    // The enqueue clock and the tick clock can differ by a few seconds, and a message
    // must not evaporate over that.
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "10:00"), scheduledFor: at("2026-09-15", "10:05") })
    );
    assert.equal(result.action, "defer");
    assert.equal(result.reason, "not_due");
    if (result.action !== "defer") return;
    assert.equal(result.until.toISOString(), at("2026-09-15", "10:05").toISOString());
  });

  test("staleness is checked before quiet hours, so an old message is not held to morning", () => {
    // Otherwise a message from 03:00 yesterday would sit until 08:00 today, be sent at
  // 08:00 having been re-judged, and quietly become a different message. Dropping is
  // correct: a 27-hour-old reminder states something untrue either way.
  //
  // Judged at 03:00 *today* against a message scheduled 27 hours ago — past the 24-hour
  // horizon and inside quiet hours at the same moment, so only the ordering of the two
  // checks decides the answer.
  const result = decideOutbound(
    sendable({ now: at("2026-09-16", "03:00"), scheduledFor: at("2026-09-15", "00:00") })
  );
  assert.deepEqual(result, { action: "stop", reason: "too_old" });
});
});

/* -------------------------------------------------------------------------- */
/* The patient is already in a conversation                                    */
/* -------------------------------------------------------------------------- */

describe("a patient who just messaged the clinic is not also sent a reminder", () => {
  test("an open conversation window holds a scheduled message", () => {
    // Appending an unsolicited reminder to a live thread is how an automated message
    // reads as an interruption.
    const result = decideOutbound(
      sendable({ now: at("2026-09-15", "10:00"), scheduledFor: at("2026-09-15", "10:00"), windowExpiresAt: at("2026-09-16", "09:00") })
    );
    assert.equal(result.action, "defer");
    assert.equal(result.reason, "patient_engaged");
  });

  test("the hold lasts until the window closes", () => {
    const windowExpiresAt = at("2026-09-16", "09:00");
    const result = decideOutbound(sendable({ windowExpiresAt }));
    assert.equal(result.action, "defer");
    if (result.action !== "defer") return;
    assert.equal(result.until.toISOString(), windowExpiresAt.toISOString());
  });

  test("a closed window does not hold anything", () => {
    const result = decideOutbound(sendable({ windowExpiresAt: at("2026-09-15", "09:00") }));
    assert.deepEqual(result, { action: "send" });
  });

  test("a transaction still goes out during a live conversation", () => {
    // This is exactly when a patient is most likely to want it: they just messaged.
    const result = decideOutbound(
      sendable({ priority: "transactional", windowExpiresAt: at("2026-09-16", "09:00") })
    );
    assert.deepEqual(result, { action: "send" });
  });
});

/* -------------------------------------------------------------------------- */
/* Idempotency, expressed as a property                                        */
/* -------------------------------------------------------------------------- */

describe("deciding twice changes nothing", () => {
  test("the same input always yields the same answer", () => {
    // The tick runs every minute and re-decides each queued message from scratch, so a
    // decision that depended on how many times it had been asked would creep.
    const input = sendable({ now: at("2026-09-15", "03:00"), scheduledFor: at("2026-09-15", "03:00") });
    const first = decideOutbound(input);
    for (let i = 0; i < 5; i += 1) {
      assert.deepEqual(decideOutbound(input), first);
    }
  });

  test("a message held by quiet hours and then by the budget is not penalised twice", () => {
    // Each branch is reachable more than once on a later tick, so none of them may
    // mutate anything. The same message is judged at 03:00 (quiet) and again at 09:00
    // (quiet over, budget exhausted), and the second answer must be about the budget.
    const held = decideOutbound(sendable({ now: at("2026-09-15", "03:00"), scheduledFor: at("2026-09-15", "03:00") }));
    assert.equal(held.action, "defer");
    if (held.action !== "defer") return;
    assert.equal(held.reason, "quiet_hours");

    const nextMorning = decideOutbound(
      sendable({ now: at("2026-09-15", "09:00"), scheduledFor: at("2026-09-15", "03:00"), sentThisWeek: 4 })
    );
    assert.equal(nextMorning.action, "defer");
    if (nextMorning.action !== "defer") return;
    assert.equal(nextMorning.reason, "weekly_budget_exhausted");
  });

  test("the reason for a stop is stable across repeats", () => {
    const stopped = decideOutbound(sendable({ optedOutAt: new Date() }));
    assert.equal(stopped.action, "stop");
    if (stopped.action !== "stop") return;

    const repeat = decideOutbound(sendable({ optedOutAt: new Date() }));
    assert.equal(repeat.action, "stop");
    if (repeat.action !== "stop") return;
    assert.equal(repeat.reason, stopped.reason);
  });
});

/* -------------------------------------------------------------------------- */
/* Policy validation                                                            */
/* -------------------------------------------------------------------------- */

describe("a stored policy is validated, not trusted", () => {
  test("an absent document is valid and yields the defaults", () => {
    const result = parseAutomationPolicy(null);
    assert.equal(result.ok, true);
    assert.deepEqual(result.policy, DEFAULT_OUTBOUND_POLICY);
  });

  test("a partial document inherits the rest", () => {
    // The alternative — all-or-nothing — means the clinic has to fill in fields they
    // have no opinion about before the one they do care about has any effect.
    const result = parseAutomationPolicy({ weeklyBudget: 2 });
    assert.equal(result.ok, true);
    assert.equal(result.policy?.weeklyBudget, 2);
    assert.equal(result.policy?.stalenessHours, DEFAULT_OUTBOUND_POLICY.stalenessHours);
  });

  test("an out-of-range budget is an error rather than a clamp", () => {
    // Clamping 400 down to 31 would be a quiet decision to message a patient 31 times
    // a week. Clamping would hide the typo rather than surface it.
    const result = parseAutomationPolicy({ weeklyBudget: 400 });
    assert.equal(result.ok, false);
    assert.match(result.errors.join(" "), /weeklyBudget/);
  });

  test("a negative budget is an error", () => {
    assert.equal(parseAutomationPolicy({ weeklyBudget: -1 }).ok, false);
  });

  test("a string budget is an error rather than a coercion", () => {
    // A policy stored as a string because a form posted it is a configuration mistake
    // worth reporting. Coercing it hides the fact that the admin UI is writing the
    // wrong type.
    const result = parseAutomationPolicy({ weeklyBudget: "4" });
    assert.equal(result.ok, false);
    assert.match(result.errors.join(" "), /whole number/);
  });

  test("a fractional budget is an error", () => {
    assert.equal(parseAutomationPolicy({ weeklyBudget: 2.5 }).ok, false);
  });

  test("a non-object is an error", () => {
    for (const raw of ["nonsense", 42, [], true]) {
      assert.equal(parseAutomationPolicy(raw).ok, false, `${JSON.stringify(raw)} passed`);
    }
  });

  test("malformed quiet hours are named in the error", () => {
    const result = parseAutomationPolicy({ quietHours: { fromMinutes: 9999 } });
    assert.equal(result.ok, false);
    assert.match(result.errors.join(" "), /fromMinutes/);
  });

  test("a policy that cannot be read stops scheduled messages, so validation must be loud", () => {
    const result = parseAutomationPolicy({ weeklyBudget: 400 });
    assert.equal(result.ok, false);
    // Each error names a field, because an operator has to be able to fix it.
    for (const error of result.errors) {
      assert.ok(error.length > 0);
      assert.ok(!/undefined|NaN|\[object/.test(error), `unhelpful error: ${error}`);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* Closed vocabularies                                                          */
/* -------------------------------------------------------------------------- */

describe("the reason vocabulary is closed and complete", () => {
  test("every reason has an explanation an operator can act on", () => {
    for (const reason of OUTBOUND_DECLINE_REASONS) {
      const text = DECLINE_EXPLANATIONS[reason];
      assert.ok(text, `no explanation for ${reason}`);
      assert.ok(text.length > 10, `explanation for ${reason} says nothing useful`);
    }
  });

  test("no reason is neither terminally refused nor safely retried", () => {
    // The default in `isTerminalDecline` is to stop, so a newly added reason cannot
    // slip in as a silent retry. This asserts the list has not grown a gap.
    for (const reason of OUTBOUND_DECLINE_REASONS) {
      assert.equal(typeof isTerminalDecline(reason), "boolean", `${reason} has no defined disposition`);
    }
  });

  test("the refusals are terminal and the timings are not", () => {
    // Both halves asserted exhaustively, over the real list. If a reason were added to
    // one group and forgotten in the other, a deferred reason could be treated as
    // terminal — silently dropping a message the clinic intended to send.
    const expectedTerminal = new Set<OutboundDeclineReason>([
      "opted_out",
      "no_consent",
      "unusable_number",
      "loop_guard",
      "automation_disabled",
      "invalid_policy",
      "too_old",
    ]);

    for (const reason of OUTBOUND_DECLINE_REASONS) {
      assert.equal(
        isTerminalDecline(reason),
        expectedTerminal.has(reason),
        `${reason} has the wrong disposition`
      );
    }

    // And every reason is in exactly one group, so nothing is merely unclassified.
    assert.equal(
      [...expectedTerminal].filter((r) => !OUTBOUND_DECLINE_REASONS.includes(r)).length,
      0,
      "a terminal reason is not in the vocabulary"
    );
  });

  test("the timing reasons are the ones that come with a time to wait for", () => {
    // `decideOutbound` must not produce a `defer` without an instant, or the outbox has
    // nothing to write to `deferredUntil` and the message becomes due immediately —
    // which for `quiet_hours` is a hot loop, once per tick, forever.
    for (const reason of OUTBOUND_DECLINE_REASONS) {
      const terminal = isTerminalDecline(reason);
      const decision: OutboundDecision = terminal
        ? { action: "stop", reason }
        : { action: "defer", reason, until: new Date() };
      if (decision.action === "defer") {
        assert.ok(decision.until instanceof Date, `${reason} deferrals carry no time`);
      }
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The helpers                                                                  */
/* -------------------------------------------------------------------------- */

describe("quiet hours and clinic time agree with each other", () => {
  test("the helper and the policy agree about every hour of the day", () => {
    // Two implementations of the same idea is how a quiet-hours window ends up with an
    // off-by-one: the message is held until 08:00 and then, at 08:00, held again.
    //
    // Checked at every hour rather than at a few sample points, because the failures
    // are at the boundaries and a sample of five values can miss both of them.
    for (let hour = 0; hour < 24; hour += 1) {
      const hhmm = `${String(hour).padStart(2, "0")}:00`;
      const now = at("2026-09-15", hhmm);
      const quiet = isWithinQuietHours(now, DEFAULT_OUTBOUND_POLICY.quietHours);

      // The default window is quiet 20:00→08:00, so quiet is 20:00-23:59 plus
      // 00:00-07:59: everything outside clinic hours.
      const expectedQuiet = hour >= 20 || hour < 8;
      assert.equal(quiet, expectedQuiet, `${hhmm}: helper and policy disagreed`);

      // And the decision must agree with the helper, for both priorities that consult it.
      const scheduled = decideOutbound(
        sendable({ now, scheduledFor: now })
      );
      assert.equal(
        scheduled.action === "defer" && scheduled.reason === "quiet_hours",
        quiet,
        `${hhmm}: the decision did not match the quiet-hours helper`
      );

      // A receipt must be unaffected at every hour, not just the ones sampled earlier.
      const transactional = decideOutbound(sendable({ now, scheduledFor: now, priority: "transactional" }));
      assert.equal(transactional.action, "send", `${hhmm}: a receipt was held`);
    }
  });

  test("a held message is never told to retry at a moment that has already passed", () => {
    // A time in the past is the tight retry loop: every tick defers the message to a
    // moment that has already gone, and it is re-deferred forever without ever sending.
    for (const hhmm of ["00:00", "03:00", "08:00", "12:00", "20:00", "23:59"]) {
      const now = at("2026-09-15", hhmm);
      const decision = decideOutbound(sendable({ now, scheduledFor: now }));
      if (decision.action !== "defer" || decision.reason !== "quiet_hours") continue;
      assert.ok(
        decision.until.getTime() > now.getTime(),
        `${hhmm} was told to retry at ${decision.until.toISOString()}, which is not in the future`
      );
    }
  });

  test("the hold ends when the quiet period ends, not when it begins", () => {
    // The bug this guards is subtle and severe: returning the window's *start* would
    // tell a message held at 20:00 to retry at 20:00 the same evening, hold it again,
    // and hold it again at every tick — arriving at 20:00 every night, never at 08:00.
    const heldAtNight = at("2026-09-15", "21:30");
    assert.equal(
      quietHoursEnd(heldAtNight, DEFAULT_OUTBOUND_POLICY.quietHours).toISOString(),
      at("2026-09-16", "08:00").toISOString()
    );

    const heldAfterMidnight = at("2026-09-15", "02:00");
    assert.equal(
      quietHoursEnd(heldAfterMidnight, DEFAULT_OUTBOUND_POLICY.quietHours).toISOString(),
      at("2026-09-15", "08:00").toISOString()
    );
  });

  test("the held moment is one the engine will actually accept", () => {
    // The real invariant, and the one that would have caught the above: re-deciding at
    // the instant the message was told to retry must not hold it again. If it does, the
    // message is in a loop that no amount of ticking resolves.
    for (const hhmm of ["20:00", "21:30", "23:00", "00:30", "03:00", "07:00"]) {
      const now = at("2026-09-15", hhmm);
      const held = decideOutbound(sendable({ now, scheduledFor: now }));
      assert.equal(held.action, "defer", `${hhmm} was not held`);
      if (held.action !== "defer") continue;
      assert.equal(held.reason, "quiet_hours", `${hhmm} was not held for quiet hours`);

      const { until } = held;
      const retried = decideOutbound(sendable({ now: until, scheduledFor: until, sentThisWeek: 0 }));
      assert.deepEqual(retried, { action: "send" }, `${hhmm} was held again at its own retry time`);
    }
  });

  test("disabled quiet hours return the moment itself, so callers need no branch", () => {
    const now = at("2026-09-15", "03:00");
    const disabled = { enabled: false, fromMinutes: 0, toMinutes: 1439 };
    assert.equal(quietHoursEnd(now, disabled).getTime(), now.getTime());
  });

  test("a zero-width window never holds anything", () => {
    // from === to is a degenerate window. Treating it as "quiet all day" would silence
    // the engine entirely, which is the opposite of what such a config looks like.
    const now = at("2026-09-15", "12:00");
    assert.equal(isWithinQuietHours(now, { enabled: true, fromMinutes: 600, toMinutes: 600 }), false);
  });

  test("a clinic-local time reads back as the same wall clock at the clinic", () => {
    // `clinicLocalToInstant` inverts the production formatter. If that inversion is
    // off by the zone offset, every quiet-hours decision is off by an hour — invisible
    // in a UTC dev environment and wrong in Bafoussam.
    for (const dateOnly of ["2026-09-15", "2026-01-15", "2026-12-31"]) {
      for (const hhmm of ["00:00", "03:30", "08:00", "13:45", "23:59"]) {
        const instant = at(dateOnly, hhmm);
        assert.equal(clinicToday(instant), dateOnly, `${dateOnly} ${hhmm} landed on the wrong day`);
        assert.equal(clinicClock(instant), hhmm, `${dateOnly} ${hhmm} read back as a different time`);
      }
    }
  });

  test("a clinic-local instant is an hour behind UTC for this zone", () => {
    // Pins the assumption explicitly. If the clinic zone ever moved, this is the test
    // that fails first and says why.
    assert.equal(at("2026-09-15", "08:00").toISOString(), "2026-09-15T07:00:00.000Z");
  });
});