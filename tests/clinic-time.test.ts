/**
 * Tests for clinic-local time.
 *
 * The first test is a regression test for a bug that could only appear in
 * production: `lib/dates.ts` used to derive "today" from the JavaScript runtime's
 * local timezone, which is UTC on Vercel. Between 23:00 and 00:00 UTC the
 * clinic is already on the next day, so the system believed it was still
 * yesterday for one hour every night. Locally, on a Cameroon machine, the bug
 * was invisible - which is exactly why it would have shipped.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CLINIC_TIME_ZONE,
  addDays,
  clinicClock,
  clinicMinutesOfDay,
  clinicMonth,
  clinicParts,
  clinicToday,
  clinicTimestamp,
  clinicWeekday,
  dateOnlyToInstant,
  daysBetween,
  isClinicTimeWithin,
  isClinicWeekend,
  isDateOnly,
} from "@/lib/clinic-time";

describe("clinic timezone is pinned, not inherited from the host", () => {
  test("defaults to Africa/Douala regardless of the host timezone", () => {
    assert.equal(CLINIC_TIME_ZONE, "Africa/Douala");
  });

  test("regression: 23:30 UTC is already the next day in Bafoussam", () => {
    // This is the exact scenario that was broken. A UTC host would answer
    // "2026-09-30" here; the clinic is on 01 October.
    const instant = new Date("2026-09-30T23:30:00Z");
    assert.equal(instant.toISOString().slice(0, 10), "2026-09-30");
    assert.equal(clinicToday(instant), "2026-10-01");
  });

  test("the same instant is the same day before and after the boundary", () => {
    // 22:59 UTC is still 30 September in Bafoussam (23:59 local).
    assert.equal(clinicToday(new Date("2026-09-30T22:59:00Z")), "2026-09-30");
    // 23:00 UTC tips over to 01 October (00:00 local).
    assert.equal(clinicToday(new Date("2026-09-30T23:00:00Z")), "2026-10-01");
  });

  test("midnight is hour 0, never hour 24", () => {
    // `hour12: false` renders midnight as "24" on some ICU versions, which
    // would turn a 00:30 message into a 24:30 one.
    const p = clinicParts(new Date("2026-09-30T23:30:00Z")); // 00:30 local
    assert.equal(p.hour, 0);
    assert.equal(p.minute, 30);
    assert.equal(clinicClock(new Date("2026-09-30T23:30:00Z")), "00:30");
  });
});

describe("clinicToday", () => {
  test("returns a zero-padded YYYY-MM-DD", () => {
    assert.equal(clinicToday(new Date("2026-01-05T12:00:00Z")), "2026-01-05");
  });

  test("rolls the month and year correctly", () => {
    assert.equal(clinicToday(new Date("2026-12-31T23:30:00Z")), "2027-01-01");
    assert.equal(clinicToday(new Date("2026-02-28T23:30:00Z")), "2026-03-01");
  });

  test("accepts epoch milliseconds and numbers", () => {
    const asDate = new Date("2026-06-15T10:00:00Z");
    const asNumber = asDate.getTime();
    assert.equal(clinicToday(asNumber), clinicToday(asDate));
  });

  test("reads a bare date as clinic noon rather than UTC midnight", () => {
    // "2026-06-15" parsed naively is UTC midnight, which is still 15 June in
    // Bafoussam - but the reverse mistake is the dangerous one, so assert both.
    assert.equal(clinicToday("2026-06-15"), "2026-06-15");
    assert.equal(clinicToday("2026-01-01"), "2026-01-01");
  });
});

describe("isDateOnly", () => {
  test("accepts real calendar days", () => {
    assert.equal(isDateOnly("2026-09-30"), true);
    assert.equal(isDateOnly("2024-02-29"), true); // leap year
  });

  test("rejects malformed and impossible dates", () => {
    assert.equal(isDateOnly("2026-13-01"), false);
    assert.equal(isDateOnly("2026-02-30"), false);
    assert.equal(isDateOnly("2023-02-29"), false); // not a leap year
    assert.equal(isDateOnly("2026-9-1"), false);
    assert.equal(isDateOnly(""), false);
    assert.equal(isDateOnly(20260930), false);
    assert.equal(isDateOnly(null), false);
    assert.equal(isDateOnly(undefined), false);
  });
});

describe("clinic clock helpers", () => {
  test("minutes of day drives quiet-hours checks", () => {
    assert.equal(clinicMinutesOfDay(new Date("2026-09-30T09:00:00Z")), 600); // 10:00
    assert.equal(clinicMinutesOfDay(new Date("2026-09-30T00:00:00Z")), 60); // 01:00
    assert.equal(clinicMinutesOfDay(new Date("2026-09-30T23:00:00Z")), 0); // 00:00
  });

  test("a daytime window includes its bounds and excludes the end", () => {
    // The clinic is UTC+1, so each UTC instant below is one hour later locally.
    const before = new Date("2026-09-30T06:59:00Z"); // 07:59 local
    const atStart = new Date("2026-09-30T07:00:00Z"); // 08:00 local
    const inside = new Date("2026-09-30T09:00:00Z"); // 10:00 local
    const atEnd = new Date("2026-09-30T19:00:00Z"); // 20:00 local
    const after = new Date("2026-09-30T19:01:00Z"); // 20:01 local

    assert.equal(isClinicTimeWithin(before, 8 * 60, 20 * 60), false);
    assert.equal(isClinicTimeWithin(atStart, 8 * 60, 20 * 60), true, "start is inclusive");
    assert.equal(isClinicTimeWithin(inside, 8 * 60, 20 * 60), true);
    assert.equal(isClinicTimeWithin(atEnd, 8 * 60, 20 * 60), false, "end is exclusive");
    assert.equal(isClinicTimeWithin(after, 8 * 60, 20 * 60), false);
  });

  test("a window crossing midnight works on both sides", () => {
    // 22:00-06:00. The common bug here is returning false for the whole span.
    const lateEvening = new Date("2026-09-30T21:30:00Z"); // 22:30 local
    const smallHours = new Date("2026-09-30T23:30:00Z"); // 00:30 local
    const morning = new Date("2026-09-30T04:30:00Z"); // 05:30 local
    const midday = new Date("2026-09-30T12:00:00Z"); // 13:00 local
    assert.equal(isClinicTimeWithin(lateEvening, 22 * 60, 6 * 60), true);
    assert.equal(isClinicTimeWithin(smallHours, 22 * 60, 6 * 60), true);
    assert.equal(isClinicTimeWithin(morning, 22 * 60, 6 * 60), true);
    assert.equal(isClinicTimeWithin(midday, 22 * 60, 6 * 60), false);
  });

  test("weekday and weekend are correct for the clinic", () => {
    // 2026-09-30 is a Wednesday, 2026-10-03 a Saturday, 2026-10-04 a Sunday.
    assert.equal(clinicWeekday(new Date("2026-09-30T09:00:00Z")), 3);
    assert.equal(isClinicWeekend(new Date("2026-09-30T09:00:00Z")), false);
    assert.equal(isClinicWeekend(new Date("2026-10-03T09:00:00Z")), true);
    assert.equal(isClinicWeekend(new Date("2026-10-04T09:00:00Z")), true);
  });

  test("month bucketing is used for reporting", () => {
    assert.equal(clinicMonth(new Date("2026-09-30T23:30:00Z")), "2026-10");
  });
});

describe("clinicTimestamp", () => {
  test("emits a real offset, not an assumed one", () => {
    // Africa/Douala is UTC+1 year-round, so the offset is stable and the
    // derivation is still checked rather than hard-coded.
    assert.equal(clinicTimestamp(new Date("2026-09-30T09:00:00Z")), "2026-09-30T10:00:00+01:00");
    assert.equal(clinicTimestamp(new Date("2026-09-30T23:30:00Z")), "2026-10-01T00:30:00+01:00");
  });

  test("round-trips back to the same clinic day", () => {
    const instant = new Date("2026-07-04T15:20:00Z");
    assert.equal(clinicToday(new Date(clinicTimestamp(instant))), clinicToday(instant));
  });
});

describe("date arithmetic", () => {
  test("addDays crosses month and year boundaries", () => {
    assert.equal(addDays("2026-09-30", 1), "2026-10-01");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
    assert.equal(addDays("2026-01-01", -1), "2025-12-31");
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
    assert.equal(addDays("2024-03-01", -1), "2024-02-29");
  });

  test("addDays handles leap years forward too", () => {
    assert.equal(addDays("2024-02-28", 1), "2024-02-29");
    assert.equal(addDays("2023-02-28", 1), "2023-03-01");
  });

  test("addDays rejects input that would silently produce nonsense", () => {
    assert.throws(() => addDays("30-09-2026", 1), RangeError);
    assert.throws(() => addDays("2026-02-30", 1), RangeError);
    assert.throws(() => addDays("2026-09-30", 1.5), RangeError);
  });

  test("daysBetween counts whole days in both directions", () => {
    assert.equal(daysBetween("2026-09-30", "2026-10-01"), 1);
    assert.equal(daysBetween("2026-10-01", "2026-09-30"), -1);
    assert.equal(daysBetween("2026-09-30", "2026-09-30"), 0);
    assert.equal(daysBetween("2026-01-01", "2027-01-01"), 365);
    assert.equal(daysBetween("2024-01-01", "2025-01-01"), 366); // leap year
  });

  test("daysBetween is the basis of every overdue calculation", () => {
    // A refill due 7 days ago, checked today: negative means overdue by 7.
    const overdueBy = daysBetween("2026-10-07", "2026-09-30");
    assert.equal(overdueBy, -7);
  });
});

describe("dateOnlyToInstant anchors on clinic noon", () => {
  test("the instant renders as the same day across extreme host offsets", () => {
    // Noon UTC is noon-to-1pm in Bafoussam, so no host offset between UTC-11
    // and UTC+12 can shift the calendar day out from under us.
    const instant = dateOnlyToInstant("2026-06-15");
    assert.equal(instant.toISOString(), "2026-06-15T12:00:00.000Z");
  });

  test("a date-only string never becomes the previous day", () => {
    assert.equal(clinicToday(dateOnlyToInstant("2026-01-01")), "2026-01-01");
    assert.equal(clinicToday(dateOnlyToInstant("2026-12-31")), "2026-12-31");
  });
});
