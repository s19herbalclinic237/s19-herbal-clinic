/**
 * Day-first date helpers for the dashboard.
 *
 * The clinic reads and writes dates as day/month/year. Native
 * `<input type="date">` renders in the *browser's* locale - which the page
 * cannot override - so `components/ui/date-field.tsx` keeps the value as an
 * ordinary day-first string and normalises it here. The stored value is always
 * `YYYY-MM-DD`, the same shape the API and the database use.
 */

/** `2026-10-13` -> `13/10/2026`. Anything else -> "". */
export function isoToDayFirst(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

/**
 * Reads a day-first date the way the clinic writes it: `13/10/2026`,
 * `13-10-2026`, `13.10.2026`, `13/10/26`, `13102026`, or `131026`.
 * Returns `YYYY-MM-DD`, or null when the text is not a real calendar day.
 */
export function dayFirstToIso(raw: string): string | null {
  const text = raw.trim();
  let day: number;
  let month: number;
  let year: number;

  const separated = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2}|\d{4})$/.exec(text);
  if (separated) {
    day = Number(separated[1]);
    month = Number(separated[2]);
    year = separated[3].length === 2 ? 2000 + Number(separated[3]) : Number(separated[3]);
  } else if (/^\d{8}$/.test(text)) {
    day = Number(text.slice(0, 2));
    month = Number(text.slice(2, 4));
    year = Number(text.slice(4, 8));
  } else if (/^\d{6}$/.test(text)) {
    day = Number(text.slice(0, 2));
    month = Number(text.slice(2, 4));
    year = 2000 + Number(text.slice(4, 6));
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  // Reject impossible days such as 31/02 or 31/04.
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
