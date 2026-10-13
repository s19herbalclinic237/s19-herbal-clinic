import test from "node:test";
import assert from "node:assert/strict";
import { dayFirstToIso, isoToDayFirst } from "@/lib/day-first-date";

/**
 * Day-first dashboard dates.
 *
 * The clinic writes dates as day/month/year and expects to type them that way,
 * while the API and the database keep `YYYY-MM-DD`. These two helpers are the
 * whole translation layer, so they are pinned down here.
 */

test("an ISO day is shown day first", () => {
  assert.equal(isoToDayFirst("2026-10-13"), "13/10/2026");
  assert.equal(isoToDayFirst("1990-03-05"), "05/03/1990");
});

test("anything that is not a stored calendar day shows as empty text", () => {
  assert.equal(isoToDayFirst(""), "");
  assert.equal(isoToDayFirst("2026-10-13T09:00:00Z"), "");
  assert.equal(isoToDayFirst("13/10/2026"), "");
  assert.equal(isoToDayFirst("not a date"), "");
});

test("a slash, dash or dot separated date is read day first", () => {
  assert.equal(dayFirstToIso("13/10/2026"), "2026-10-13");
  assert.equal(dayFirstToIso("13-10-2026"), "2026-10-13");
  assert.equal(dayFirstToIso("13.10.2026"), "2026-10-13");
});

test("a two-digit year is read as this century", () => {
  assert.equal(dayFirstToIso("13/10/26"), "2026-10-13");
  assert.equal(dayFirstToIso("01/01/07"), "2007-01-01");
});

test("a single-digit day or month is accepted", () => {
  assert.equal(dayFirstToIso("1/2/2026"), "2026-02-01");
  assert.equal(dayFirstToIso("5/3/1990"), "1990-03-05");
});

test("an unseparated date is read as ddmmyyyy, and ddmmyy", () => {
  assert.equal(dayFirstToIso("13102026"), "2026-10-13");
  assert.equal(dayFirstToIso("05031990"), "1990-03-05");
  assert.equal(dayFirstToIso("131026"), "2026-10-13");
});

test("surrounding whitespace is ignored", () => {
  assert.equal(dayFirstToIso("  13/10/2026  "), "2026-10-13");
});

test("an impossible calendar day is refused, not rolled over", () => {
  assert.equal(dayFirstToIso("31/02/2026"), null);
  assert.equal(dayFirstToIso("31/04/2026"), null);
  assert.equal(dayFirstToIso("00/10/2026"), null);
  assert.equal(dayFirstToIso("13/13/2026"), null);
});

test("a leap day is accepted only in a leap year", () => {
  assert.equal(dayFirstToIso("29/02/2024"), "2024-02-29");
  assert.equal(dayFirstToIso("29/02/2026"), null);
});

test("nonsense text is refused", () => {
  assert.equal(dayFirstToIso(""), null);
  assert.equal(dayFirstToIso("today"), null);
  assert.equal(dayFirstToIso("13/10"), null);
  assert.equal(dayFirstToIso("12345"), null);
  assert.equal(dayFirstToIso("2026-10-13"), null);
});

test("showing and reading a date is a round trip", () => {
  assert.equal(dayFirstToIso(isoToDayFirst("2026-10-13")), "2026-10-13");
});
