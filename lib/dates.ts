/**
 * Date-only helpers used across patient and admin surfaces.
 *
 * The clinic deals in calendar dates (YYYY-MM-DD). A bare date string like
 * "2026-09-20" must never be handed to `new Date()` directly: JavaScript
 * parses it as UTC midnight, which formats as the previous day in timezones
 * west of UTC (and from local-noon timestamps it would shift the other way).
 * These helpers keep every date on the calendar day the clinic means.
 *
 * "The calendar day the clinic means" is resolved in `lib/clinic-time.ts`, not
 * in the JavaScript runtime's local timezone. On Vercel that runtime is UTC,
 * which is an hour behind Bafoussam and was reporting the wrong day between
 * 23:00 and 00:00 UTC. This file now delegates to that module so every existing
 * caller - patient badges, treatment tabs, admin plan lists - is correct without
 * being rewritten.
 */

import {
  clinicToday,
  dateOnlyToInstant,
  isDateOnly,
} from "@/lib/clinic-time";

/**
 * YYYY-MM-DD for the clinic's current day, in Africa/Douala. Falls back to the
 * host's local date only if the clinic-time module cannot be read at all,
 * which it cannot while this module is the thing that cannot load.
 */
export function localDateString(d: Date = new Date()): string {
  return clinicToday(d);
}

/**
 * Parses a "YYYY-MM-DD" value as clinic noon so the timezone can never shift the
 * calendar day. Full ISO timestamps pass straight through.
 *
 * The noon anchor is a UTC noon instant, which is noon-to-1pm in Bafoussam and
 * therefore always the intended calendar day, and it renders as the same day for
 * any host offset from UTC-11 through UTC+12.
 */
export function parseDateOnly(value: string): Date {
  if (isDateOnly(value)) return dateOnlyToInstant(value);
  return new Date(value);
}
