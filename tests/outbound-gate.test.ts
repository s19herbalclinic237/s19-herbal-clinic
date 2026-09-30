/**
 * Tests for the outbound automation gate.
 *
 * The gate decides whether the engine may message a patient by itself. It is the third
 * instance in this codebase of a control whose unset value used to mean the dangerous
 * direction — `CRON_SECRET` unset meant "open to the world" and served health records,
 * `TREATMENT_SCHEDULE_ENABLED` unset meant "act on intervals nobody approved" — so
 * these tests exist to stop "inert by default" from becoming "on by default" later.
 */

import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { evaluateOutboundGate } from "@/lib/outbound-gate";

describe("outbound automation is inert unless it is deliberately turned on", () => {
  test("an unset flag does not enable it", () => {
    // If this ever passes with `enabled: true`, an unapproved quiet-hours window and
    // message budget start reaching real patients.
    assert.equal(evaluateOutboundGate(undefined).enabled, false);
  });

  test("a null flag does not enable it", () => {
    assert.equal(evaluateOutboundGate(null).enabled, false);
  });

  test("an empty or whitespace-only flag does not enable it", () => {
    // A stray space in a Vercel env field must not read as consent.
    for (const raw of ["", "   ", "\t", "\n", "  \r\n  "]) {
      assert.equal(
        evaluateOutboundGate(raw).enabled,
        false,
        `${JSON.stringify(raw)} opened the gate`
      );
    }
  });

  test("only the exact string \"true\" enables it", () => {
    assert.equal(evaluateOutboundGate("true").enabled, true);
  });

  test("case and surrounding whitespace are tolerated", () => {
    // Being fussy about "True" would only produce a support question about a value that
    // is obviously intended.
    for (const raw of ["TRUE", "True", "  true  ", "\ttrue\n"]) {
      assert.equal(evaluateOutboundGate(raw).enabled, true, `${JSON.stringify(raw)} was rejected`);
    }
  });

  test("values that merely look enabled are refused", () => {
    // A flag that means three different things is a flag that will eventually mean the
    // wrong one — and here the wrong one is messaging patients.
    for (const raw of ["1", "yes", "on", "enabled", "y", "0", "false", "no", "off", "null", "undefined"]) {
      const result = evaluateOutboundGate(raw);
      assert.equal(result.enabled, false, `${JSON.stringify(raw)} opened the gate`);
    }
  });

  test("a near-miss is refused rather than guessed at", () => {
    // Not "true ", not "truthy", not " true!". Each of these is a typo, and each is
    // refused for the same reason: guessing is how a control becomes permissive.
    for (const raw of ["true1", "tru", "trues", "TRUEISH", "t-r-u-e", "true;true"]) {
      assert.equal(evaluateOutboundGate(raw).enabled, false, `${JSON.stringify(raw)} opened the gate`);
    }
  });

  test("development is not exempt, unlike the cron guard", () => {
    // `evaluateCronAuth` exempts development so a local run needs no secret. This gate
    // deliberately does not: a rule that behaves differently on a laptop is how a
    // fail-closed default quietly stops being fail-closed where it matters.
    // The function takes only the raw value, so there is no environment to consult and
    // therefore no way to accidentally open it in a test or a dev build.
    assert.equal(evaluateOutboundGate("true").enabled, true);
    assert.equal(evaluateOutboundGate("false").enabled, false);
  });
});

describe("a refusal says what to do", () => {
  test("the unconfigured refusal names the variable and both settings", () => {
    const result = evaluateOutboundGate(undefined);
    assert.equal(result.enabled, false);
    if (result.enabled) return;
    assert.match(result.error, /OUTBOUND_AUTOMATION_ENABLED/);
    assert.match(result.error, /"true"/);
  });

  test("the unconfigured refusal says transactional messages still work", () => {
    // Otherwise an operator who is waiting on appointment confirmations has no way to
    // tell "switched off" from "broken".
    const result = evaluateOutboundGate(undefined);
    if (result.enabled) return;
    assert.match(result.error, /[Tt]ransactional/);
  });

  test("the reason distinguishes not-configured from wrongly-configured", () => {
    // Different problems with different fixes: one needs the variable added, the other
    // needs it corrected.
    assert.equal(evaluateOutboundGate(undefined).enabled === false && !evaluateOutboundGate(undefined).enabled, true);
    const unconfigured = evaluateOutboundGate(undefined);
    const notEnabled = evaluateOutboundGate("yes");
    if (unconfigured.enabled || notEnabled.enabled) return;
    assert.equal(unconfigured.reason, "unconfigured");
    assert.equal(notEnabled.reason, "not_enabled");
  });

  test("the wrong value is quoted back so the operator can see the typo", () => {
    const result = evaluateOutboundGate("ture");
    if (result.enabled) return;
    assert.match(result.error, /ture/);
  });

  test("a long value is truncated rather than echoed whole", () => {
    // This string reaches a log line and an API response. Someone who has accidentally
    // pasted a secret into the variable should not have that secret written to the
    // application log and shown in a browser.
    const pasted = `true${"x".repeat(500)}`;
    const result = evaluateOutboundGate(pasted);
    if (result.enabled) return;
    assert.ok(result.error.length < 400, `the refusal was ${result.error.length} characters long`);
    assert.match(result.error, /characters/);
  });

  test("a long pasted value is quoted back only in part", () => {
    // Deliberate, and matched to `lib/schedule-gate.ts` so the two refusals behave
    // identically. Truncation rather than suppression, because the operator has to be
    // able to see the typo — "ture" is the whole point of quoting it back — and 32
    // characters of a pasted secret is a bounded disclosure, not the secret itself.
    const pasted = `ture${"y".repeat(2000)}`;
    const result = evaluateOutboundGate(pasted);
    if (result.enabled) return;
    assert.ok(result.error.includes("ture"), "the refusal should still show the typo");

    // Assert the absence of the *whole* value, not of a short substring of it. A 32
    // character cap on `ture` + 2000 y's necessarily leaves 28 y's behind, so any check
    // for a short run of y's would fail against correct code — which is what happened
    // when this test was written. The invariant is that 2004 characters do not reach
    // the log, not that the tail is spotless.
    assert.ok(!result.error.includes(pasted), "the refusal echoed the pasted value verbatim");
    assert.match(result.error, /2004 characters/, "the refusal should report the true length");
    assert.ok(result.error.length < 400, `the refusal was ${result.error.length} characters long`);
  });
});
