/**
 * Tests for the treatment-schedule gate.
 *
 * The gate is the difference between the schedule engine shipping inert and
 * shipping live on unapproved clinical intervals. These tests exist so that "inert
 * by default" cannot quietly become "on by default" later - the same regression
 * `tests/cron-auth.test.ts` guards against for the backup endpoint, which was
 * genuinely reachable over unauthenticated public GET because an unset secret
 * meant "skip the check" rather than "refuse".
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { evaluateScheduleGate } from "@/lib/schedule-gate";

describe("the schedule engine is inert unless it is deliberately turned on", () => {
  test("an unset flag does not enable it", () => {
    // The single most important line in this file. If this ever passes with
    // `enabled: true`, a clinician's unapproved review interval reaches patients.
    const result = evaluateScheduleGate(undefined);
    assert.equal(result.enabled, false);
  });

  test("a null flag does not enable it", () => {
    assert.equal(evaluateScheduleGate(null).enabled, false);
  });

  test("an empty or whitespace-only flag does not enable it", () => {
    // A stray space in a Vercel env field must not read as a misconfiguration, and
    // must certainly not read as consent.
    for (const raw of ["", "   ", "\t", "\n"]) {
      const result = evaluateScheduleGate(raw);
      assert.equal(result.enabled, false, `${JSON.stringify(raw)} opened the gate`);
    }
  });

  test("only the exact string \"true\" enables it", () => {
    assert.equal(evaluateScheduleGate("true").enabled, true);
  });

  test("case and surrounding whitespace are tolerated", () => {
    // Being fussy about "True" would only produce a support question.
    for (const raw of ["TRUE", "True", "  true  ", "\ttrue\n"]) {
      assert.equal(evaluateScheduleGate(raw).enabled, true, `${JSON.stringify(raw)} was rejected`);
    }
  });

  test("other truthy-looking values do not enable it", () => {
    // A flag that means three different things is a flag that will eventually mean
    // the wrong one, so "1" and "yes" are rejected rather than guessed at.
    for (const raw of ["1", "yes", "on", "enabled", "ok", "truthy"]) {
      const result = evaluateScheduleGate(raw);
      assert.equal(result.enabled, false, `${JSON.stringify(raw)} opened the gate`);
    }
  });
});

describe("a refusal explains itself", () => {
  test("an unconfigured gate names the variable and the document", () => {
    const result = evaluateScheduleGate(undefined);
    assert.equal(result.enabled, false);
    if (result.enabled) throw new Error("unreachable");
    assert.equal(result.reason, "unconfigured");
    assert.match(result.error, /TREATMENT_SCHEDULE_ENABLED/);
    // A refusal that does not say what to do is just a refusal.
    assert.match(result.error, /TREATMENT_PLAN_SCHEDULE\.md/);
  });

  test("a wrong value quotes the value back", () => {
    // The operator needs to see what is actually set, or they will set it again
    // the same way.
    const result = evaluateScheduleGate("yes");
    assert.equal(result.enabled, false);
    if (result.enabled) throw new Error("unreachable");
    assert.equal(result.reason, "not_enabled");
    assert.match(result.error, /"yes"/);
    assert.match(result.error, /"true"/);
  });

  test("the two reasons are distinguishable", () => {
    // They need different fixes: one is "you have not configured it", the other is
    // "you have configured it wrongly".
    const unconfigured = evaluateScheduleGate(undefined);
    const wrongValue = evaluateScheduleGate("no");
    if (unconfigured.enabled || wrongValue.enabled) throw new Error("unreachable");
    assert.notEqual(unconfigured.reason, wrongValue.reason);
  });

  test("a refusal does not echo an unbounded value into a log or a response", () => {
    // Guards against a future refactor interpolating an environment variable into
    // something that ends up in the application log. Someone who has pasted a
    // secret into the wrong field should not have it written out.
    const result = evaluateScheduleGate("x".repeat(5000));
    assert.equal(result.enabled, false);
    if (result.enabled) throw new Error("unreachable");
    assert.ok(result.error.length < 600, `refusal grew to ${result.error.length} characters`);
    assert.ok(result.error.includes("5000 characters"), "the length should be reported, not the value");
  });
});

describe("the gate is a pure function of its input", () => {
  test("the same input always gives the same answer", () => {
    for (const raw of [undefined, "", "true", "no"]) {
      assert.deepEqual(evaluateScheduleGate(raw), evaluateScheduleGate(raw));
    }
  });

  test("it does not read the environment itself", () => {
    // The value is always passed in. If this function consulted
    // `process.env` directly it could not be tested for the unset case at all,
    // which is the case that matters most.
    const previous = process.env.TREATMENT_SCHEDULE_ENABLED;
    try {
      process.env.TREATMENT_SCHEDULE_ENABLED = "true";
      assert.equal(evaluateScheduleGate(undefined).enabled, false);

      delete process.env.TREATMENT_SCHEDULE_ENABLED;
      assert.equal(evaluateScheduleGate("true").enabled, true);
    } finally {
      if (previous === undefined) delete process.env.TREATMENT_SCHEDULE_ENABLED;
      else process.env.TREATMENT_SCHEDULE_ENABLED = previous;
    }
  });
});
