/**
 * Tests for the patient-history vocabulary.
 *
 * The dedupe key is the load-bearing part: it backs a unique index, and a
 * collision would silently drop a real clinical event. That is worse than
 * sending a patient a duplicate reminder, so these tests lean hard on the
 * cases where naive concatenation collides.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CRITICAL_EVENT_TYPES,
  EVENT_DEDUPE_KEY_MAX,
  EVENT_SUMMARY_MAX,
  defaultImportance,
  eventKey,
  integrationActor,
  normaliseEvent,
  patientActor,
  staffActor,
  systemActor,
} from "@/lib/events";

describe("eventKey", () => {
  test("is deterministic for the same inputs", () => {
    const a = eventKey("refill", "patient123", "2026-09-30");
    const b = eventKey("refill", "patient123", "2026-09-30");
    assert.equal(a, b);
  });

  test("separates different inputs", () => {
    assert.notEqual(eventKey("refill", "a", "2026-09-30"), eventKey("refill", "b", "2026-09-30"));
    assert.notEqual(eventKey("refill", "a", "2026-09-30"), eventKey("refill", "a", "2026-10-01"));
  });

  test("cannot be made to collide by moving the colon between parts", () => {
    // The naive version - parts.join(":") without stripping colons - makes
    // ("a:b", "c") and ("a", "b:c") both produce "a:b:c", and since these keys
    // back a unique index, one real event would be silently discarded.
    assert.equal(eventKey("a:b", "c"), "ab:c");
    assert.equal(eventKey("a", "b:c"), "a:bc");
    assert.notEqual(eventKey("a:b", "c"), eventKey("a", "b:c"));
  });

  test("strips colons from a date-like part so the day boundary is still visible", () => {
    // Times and dates are the usual sources of a colon, and the day is what
    // distinguishes "due today" from "due tomorrow".
    assert.equal(eventKey("reminder", "2026-09-30T09:00:00Z"), "reminder:2026-09-30T090000Z");
  });

  test("treats missing parts as empty rather than dropping the joiner", () => {
    assert.equal(eventKey("a", null, "c"), "a::c");
    assert.equal(eventKey("a", undefined, "c"), "a::c");
  });

  test("coerces numbers so ids and indices are interchangeable", () => {
    assert.equal(eventKey("task", 42), "task:42");
  });

  test("handles an empty part list", () => {
    assert.equal(eventKey(), "");
  });
});

describe("actors", () => {
  test("each actor kind carries its own identity", () => {
    assert.deepEqual(patientActor("p1", "Ada"), { kind: "patient", id: "p1", name: "Ada" });
    assert.deepEqual(staffActor("s1", "Dr Njoya"), { kind: "staff", id: "s1", name: "Dr Njoya" });
    assert.deepEqual(systemActor("refill rule"), { kind: "system", name: "refill rule" });
    assert.deepEqual(integrationActor("fapshi"), { kind: "integration", name: "fapshi" });
  });

  test("names are optional so attribution still works without them", () => {
    assert.deepEqual(patientActor("p1"), { kind: "patient", id: "p1" });
    assert.deepEqual(systemActor(), { kind: "system" });
  });
});

describe("defaultImportance", () => {
  test("clinical event types are always critical, whoever caused them", () => {
    // A lab result matters whether it was uploaded, typed in, or noticed late by
    // the engine - so the type promotes it, not the author.
    for (const type of CRITICAL_EVENT_TYPES) {
      assert.equal(defaultImportance(type, "system"), "critical");
      assert.equal(defaultImportance(type, "patient"), "critical");
    }
  });

  test("system housekeeping is routine, a human's action is notable", () => {
    assert.equal(defaultImportance("message", "system"), "routine");
    assert.equal(defaultImportance("message", "patient"), "notable");
    assert.equal(defaultImportance("message", "staff"), "notable");
    assert.equal(defaultImportance("payment", "integration"), "notable");
  });
});

describe("normaliseEvent", () => {
  const base = {
    patient: "p1",
    type: "task" as const,
    actor: { kind: "system" as const },
    summary: "  Refill reminder sent  ",
  };

  test("trims the summary and fills the defaults", () => {
    const event = normaliseEvent(base);
    assert.ok(event);
    assert.equal(event.summary, "Refill reminder sent");
    assert.equal(event.source, "admin");
    assert.equal(event.importance, "routine");
  });

  test("truncates an over-long summary rather than letting the schema reject it", () => {
    const event = normaliseEvent({ ...base, summary: "x".repeat(500) });
    assert.equal(event?.summary.length, EVENT_SUMMARY_MAX);
  });

  test("rejects an event with no usable summary", () => {
    assert.equal(normaliseEvent({ ...base, summary: "" }), null);
    assert.equal(normaliseEvent({ ...base, summary: "   " }), null);
  });

  test("rejects an unparseable date rather than storing an invalid one", () => {
    assert.equal(normaliseEvent({ ...base, at: "not-a-date" }), null);
  });

  test("parses a date-only string as a real instant", () => {
    const event = normaliseEvent({ ...base, at: "2026-09-30" });
    assert.ok(event?.at instanceof Date);
    assert.equal(Number.isNaN(event!.at.getTime()), false);
  });

  test("truncates a long dedupe key", () => {
    const event = normaliseEvent({ ...base, dedupeKey: "k".repeat(400) });
    assert.equal(event?.dedupeKey?.length, EVENT_DEDUPE_KEY_MAX);
  });

  test("keeps a caller-supplied importance instead of overriding it", () => {
    // A clinician marking something important must not have it downgraded by a
    // default, and the engine must be able to mark something critical.
    const event = normaliseEvent({ ...base, type: "message", importance: "critical" });
    assert.equal(event?.importance, "critical");
  });

  test("an absent dedupe key stays absent rather than becoming an empty string", () => {
    // A unique sparse index keys on the field's presence: an empty string would
    // collide across unrelated events and drop them.
    const event = normaliseEvent(base);
    assert.equal(event?.dedupeKey, null);
  });
});
