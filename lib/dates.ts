/**
 * Date-only helpers used across patient and admin surfaces.
 *
 * The clinic deals in calendar dates (YYYY-MM-DD). A bare date string like
 * "2026-09-20" must never be handed to `new Date()` directly: JavaScript
 * parses it as UTC midnight, which formats as the previous day in timezones
 * west of UTC (and from local-noon timestamps it would shift the other way).
 * These helpers keep every date on the calendar day the clinic means.
 */

/** YYYY-MM-DD in the runtime's local timezone (for "today" comparisons). */
export function localDateString(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Parses a "YYYY-MM-DD" value as local noon so the timezone can never shift
 * the calendar day. Full ISO timestamps pass straight through.
 */
export function parseDateOnly(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T12:00:00`);
  return new Date(value);
}