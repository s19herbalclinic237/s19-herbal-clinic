import type { DoctorScheduleSlot } from "@/lib/models/Doctor";

/** "HH:mm" -> minutes since midnight. */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** minutes -> "HH:mm" (zero-padded). */
export function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** "YYYY-MM-DD" -> Date at noon local (avoids TZ off-by-one). */
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayDateOnly(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Computes the day-of-week for a date string. `dateOnly` is interpreted in the
 * server's local timezone, which is what the patient-facing calendar uses.
 */
export function weekdayOf(dateOnly: string): number {
  return parseDateOnly(dateOnly).getDay();
}

/**
 * Generates the available slot times for one doctor on a given date.
 *
 * @param schedule   schedule entries for that weekday
 * @param booked     start times ("HH:mm") already taken by non-cancelled appointments
 * @param isToday    whether `date` is today (precludes slots in the past)
 */
export function openSlotTimes(
  schedule: DoctorScheduleSlot[],
  booked: string[],
  isToday: boolean
): string[] {
  const bookedSet = new Set(booked);
  const nowMinutes = toMinutes(
    isToday
      ? toTimeString(
          new Date().getHours() * 60 + new Date().getMinutes()
        )
      : "00:00"
  );

  const slots: string[] = [];
  for (const entry of schedule) {
    const start = toMinutes(entry.start);
    const end = toMinutes(entry.end);
    const step = Math.max(15, entry.slotMinutes);
    for (let t = start; t < end; t += step) {
      const label = toTimeString(t);
      if (isToday && t <= nowMinutes) continue;
      if (bookedSet.has(label)) continue;
      slots.push(label);
    }
  }
  return slots;
}

/** True when a slot is still open for this doctor/date (not past, not booked). */
export function slotIsOpen(
  schedule: DoctorScheduleSlot[],
  booked: string[],
  dateOnly: string,
  time: string
): boolean {
  if (!DATE_RE.test(dateOnly) || !TIME_RE.test(time)) return false;
  const isToday = dateOnly === todayDateOnly();
  return openSlotTimes(schedule, booked, isToday).includes(time);
}