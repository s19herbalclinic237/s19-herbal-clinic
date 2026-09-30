/**
 * Clinic-local time. This module is the single source of truth for "what time
 * is it at the clinic", and it exists because the previous behaviour was wrong
 * in a way that only shows up in production.
 *
 * `lib/dates.ts` used to derive "today" from the JavaScript runtime's local
 * timezone. That is correct on a developer laptop in Bafoussam and wrong
 * everywhere else: Vercel serverless functions run in UTC. The clinic is
 * Africa/Douala, which is UTC+1 (WAT, no daylight saving). So for one hour
 * every day - 23:00 to 00:00 UTC - the system believed it was still yesterday.
 *
 * That is survivable while a human reads the date. It is not survivable once an
 * engine starts *acting* on the date: a medication refill reminder or a
 * "your glucose reading is missing" prompt would fire a day early or a day late,
 * and every downstream calculation - run-out dates, escalation deadlines,
 * overdue buckets - would inherit the error. Worse, the bug is invisible in
 * local development, so it would ship.
 *
 * Everything the automation engine does with a date therefore goes through this
 * module, which pins the timezone explicitly and never consults the host.
 * Africa/Douala is also chosen as the default rather than hard-coded into
 * callers so a future second clinic is a data change, not a code change.
 */

/** IANA zone for the clinic. Bafoussam, Cameroon - WAT (UTC+1), no DST. */
export const CLINIC_TIME_ZONE =
  process.env.CLINIC_TIME_ZONE?.trim() || "Africa/Douala";

/** Weekday index used throughout: 0 = Sunday ... 6 = Saturday. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ClinicParts {
  year: number;
  /** 1-12, not 0-indexed. */
  month: number;
  /** 1-31. */
  day: number;
  /** 0-23. Never 24: the formatter is pinned to the h23 hour cycle. */
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday ... 6 = Saturday. */
  weekday: Weekday;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a well-formed `YYYY-MM-DD` that names a real calendar day. */
export function isDateOnly(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_ONLY_RE.test(value)) return false;
  // Rejects 2026-02-30 and friends, which `Date` would silently roll over.
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y &&
    probe.getUTCMonth() === m - 1 &&
    probe.getUTCDate() === d
  );
}

/**
 * `Intl.DateTimeFormat` is expensive to construct and this runs per message per
 * patient. Caching by zone keeps the hot path cheap.
 */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) return cached;
  const created = new Intl.DateTimeFormat("en-US", {
    timeZone,
    // h23, not h12: some ICU versions render midnight as hour 24 under
    // `hour12: false`, which would make a 00:30 message look like a 24:30 one.
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
  });
  formatterCache.set(timeZone, created);
  return created;
}

const WEEKDAY_INDEX: Record<string, Weekday> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function toDate(input: Date | number | string): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);
  // A bare YYYY-MM-DD is a calendar day, not an instant: read it as clinic noon
  // so it can never be interpreted as UTC midnight and shift a day west of UTC.
  if (isDateOnly(input)) return dateOnlyToInstant(input);
  return new Date(input);
}

/**
 * An instant that is unambiguously the middle of the given clinic day. Used as
 * the canonical in-memory form of a clinic date, so that formatting it in any
 * timezone the caller happens to be in still lands on the intended day for
 * every offset from UTC-12 to UTC+12.
 */
export function dateOnlyToInstant(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** Maps a short weekday name to its index, defaulting to Sunday. */
function toWeekday(name: string): Weekday {
  return WEEKDAY_INDEX[name] ?? (0 as Weekday);
}

/** Decomposes an instant into its clinic-local calendar and clock components. */
export function clinicParts(input: Date | number | string = Date.now()): ClinicParts {
  const date = toDate(input);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("clinicParts received an unparseable date");
  }
  const parts = formatterFor(CLINIC_TIME_ZONE).formatToParts(date);
  // Numeric fields and the weekday name have to be collected separately: the
  // weekday arrives as "Wed", and running it through Number() yields NaN, which
  // would silently turn every weekday into Sunday.
  const lookup: Record<string, number> = {};
  let weekdayName = "";
  for (const part of parts) {
    if (part.type === "weekday") weekdayName = part.value;
    else if (part.type !== "literal") lookup[part.type] = Number(part.value);
  }
  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour: lookup.hour,
    minute: lookup.minute,
    second: lookup.second,
    weekday: toWeekday(weekdayName),
  };
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * The clinic's current calendar day as `YYYY-MM-DD`.
 *
 * This replaces the runtime-local `localDateString()` that produced yesterday's
 * date for one hour a night. Every "is this due today" question in the
 * automation engine resolves through here.
 */
export function clinicToday(input: Date | number | string = Date.now()): string {
  const p = clinicParts(input);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

/** The clinic's current 24-hour clock as `HH:MM`. */
export function clinicClock(input: Date | number | string = Date.now()): string {
  const p = clinicParts(input);
  return `${pad2(p.hour)}:${pad2(p.minute)}`;
}

/** Minutes elapsed today at the clinic, 0-1439. For quiet-hours checks. */
export function clinicMinutesOfDay(input: Date | number | string = Date.now()): number {
  const p = clinicParts(input);
  return p.hour * 60 + p.minute;
}

/** True when the clinic is inside the given local time window, end exclusive. */
export function isClinicTimeWithin(
  input: Date | number | string,
  fromMinutes: number,
  toMinutes: number
): boolean {
  const now = clinicMinutesOfDay(input);
  // A window that crosses midnight (22:00-06:00) is handled rather than
  // returning false for its entire span, which is the usual bug here.
  return fromMinutes <= toMinutes
    ? now >= fromMinutes && now < toMinutes
    : now >= fromMinutes || now < toMinutes;
}

/** Weekday at the clinic, 0 = Sunday. */
export function clinicWeekday(input: Date | number | string = Date.now()): Weekday {
  return clinicParts(input).weekday;
}

/** True for Saturday or Sunday at the clinic. */
export function isClinicWeekend(input: Date | number | string = Date.now()): boolean {
  const day = clinicWeekday(input);
  return day === 0 || day === 6;
}

/**
 * An ISO-8601 string with the clinic's UTC offset, for storing a moment that was
 * decided on clinic-local reasoning. A bare `toISOString()` would lose that
 * reasoning; a bare local string would be ambiguous.
 */
export function clinicTimestamp(input: Date | number | string = Date.now()): string {
  const date = toDate(input);
  const p = clinicParts(date);
  // Derive the real offset rather than assuming one, so the module stays correct
  // if CLINIC_TIME_ZONE is ever pointed at a zone that observes DST.
  const offsetMinutes = -Math.round(
    (date.getTime() - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)) / 60_000
  );
  const sign = offsetMinutes < 0 ? "-" : "+";
  const abs = Math.abs(offsetMinutes);
  const offset =
    `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
  return (
    `${p.year}-${pad2(p.month)}-${pad2(p.day)}T` +
    `${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}` +
    offset
  );
}

/**
 * Adds whole days to a `YYYY-MM-DD` clinic date. Day arithmetic is done in UTC
 * on the noon instant, so it is immune to DST transitions in any zone.
 */
export function addDays(dateOnly: string, days: number): string {
  if (!isDateOnly(dateOnly)) throw new RangeError(`addDays received "${dateOnly}"`);
  if (!Number.isInteger(days)) throw new RangeError("addDays requires whole days");
  const base = dateOnlyToInstant(dateOnly);
  base.setUTCDate(base.getUTCDate() + days);
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(base.getUTCDate())}`;
}

/**
 * Whole days from `from` to `to`; positive when `to` is later. Computed on noon
 * instants, so a 23-hour DST day still counts as one day.
 */
export function daysBetween(from: string, to: string): number {
  if (!isDateOnly(from) || !isDateOnly(to)) {
    throw new RangeError("daysBetween requires two YYYY-MM-DD values");
  }
  return Math.round(
    (dateOnlyToInstant(to).getTime() - dateOnlyToInstant(from).getTime()) / 86_400_000
  );
}

/** `YYYY-MM` for the clinic, for month-bucketed reporting. */
export function clinicMonth(input: Date | number | string = Date.now()): string {
  const p = clinicParts(input);
  return `${p.year}-${pad2(p.month)}`;
}
