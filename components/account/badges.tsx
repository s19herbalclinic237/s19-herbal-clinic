"use client";

import { parseDateOnly } from "@/lib/dates";
import { useLocale } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n";

export function formatDate(iso: string | Date): string {
  const d = typeof iso === "string" ? parseDateOnly(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** Formats a full ISO date/time (e.g. record dates) as "12 Mar 2026". */
export function formatDayDate(iso: string | Date): string {
  const d = typeof iso === "string" ? parseDateOnly(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const orderStatusClasses: Record<string, string> = {
  Pending: "border-amber-300 bg-amber-50 text-amber-800",
  Processing: "border-sky-300 bg-sky-50 text-sky-800",
  "Ready for Pickup": "border-teal-300 bg-teal-50 text-teal-800",
  "Out for Delivery": "border-indigo-300 bg-indigo-50 text-indigo-800",
  Delivered: "border-forest-300 bg-forest-50 text-forest-800",
  Cancelled: "border-red-300 bg-red-50 text-red-700",
};

const orderStatusKeys: Record<string, TranslationKey> = {
  Pending: "dash.badges.order.pending",
  Processing: "dash.badges.order.processing",
  "Ready for Pickup": "dash.badges.order.readyPickup",
  "Out for Delivery": "dash.badges.order.outDelivery",
  Delivered: "dash.badges.order.delivered",
  Cancelled: "dash.badges.order.cancelled",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const key = orderStatusKeys[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wide ${
        orderStatusClasses[status] || "border-line-strong bg-cream text-muted"
      }`}
    >
      {key ? t(key) : status}
    </span>
  );
}

const testimonialStatusClasses: Record<string, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  approved: "border-forest-300 bg-forest-50 text-forest-800",
  rejected: "border-red-300 bg-red-50 text-red-700",
};

const testimonialStatusKeys: Record<string, TranslationKey> = {
  pending: "dash.badges.testimonial.pending",
  approved: "dash.badges.testimonial.approved",
  rejected: "dash.badges.testimonial.rejected",
};

export function TestimonialStatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const key = testimonialStatusKeys[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wide ${
        testimonialStatusClasses[status] || "border-line-strong bg-cream text-muted"
      }`}
    >
      {key ? t(key) : status}
    </span>
  );
}

const appointmentStatusClasses: Record<string, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  confirmed: "border-forest-300 bg-forest-50 text-forest-800",
  completed: "border-indigo-300 bg-indigo-50 text-indigo-800",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

const appointmentStatusKeys: Record<string, TranslationKey> = {
  pending: "dash.badges.appointment.pending",
  confirmed: "dash.badges.appointment.confirmed",
  completed: "dash.badges.appointment.completed",
  cancelled: "dash.badges.appointment.cancelled",
};

export function AppointmentStatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const key = appointmentStatusKeys[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wide ${
        appointmentStatusClasses[status] || "border-line-strong bg-cream text-muted"
      }`}
    >
      {key ? t(key) : status}
    </span>
  );
}

export const RecordTypeKeys: Record<string, TranslationKey> = {
  visit: "dash.badges.recordType.visit",
  diagnosis: "dash.badges.recordType.diagnosis",
  lab: "dash.badges.recordType.lab",
  scan: "dash.badges.recordType.scan",
  note: "dash.badges.recordType.note",
};

export const RecordTypeClass: Record<string, string> = {
  visit: "border-forest-300 bg-forest-50 text-forest-800",
  diagnosis: "border-sky-300 bg-sky-50 text-sky-800",
  lab: "border-amber-300 bg-amber-50 text-amber-800",
  scan: "border-indigo-300 bg-indigo-50 text-indigo-800",
  note: "border-zinc-300 bg-zinc-50 text-zinc-700",
};

export function PrescriptionStatusBadge({ status }: { status: string }) {
  const { t } = useLocale();
  const active = status === "active";
  return (
    <span
      className={
        active
          ? "inline-flex items-center rounded-full border border-forest-300 bg-forest-50 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wide text-forest-800"
          : "inline-flex items-center rounded-full border border-zinc-300 bg-zinc-50 px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wide text-zinc-600"
      }
    >
      {active ? t("dash.badges.prescription.active") : t("dash.badges.prescription.past")}
    </span>
  );
}

const treatmentPhaseClasses: Record<string, string> = {
  active: "border-emerald-300 bg-emerald-50 text-emerald-800",
  expired: "border-amber-300 bg-amber-50 text-amber-800",
  scheduled: "border-sky-300 bg-sky-50 text-sky-800",
  completed: "border-indigo-300 bg-indigo-50 text-indigo-800",
};

const treatmentPhaseKeys: Record<string, TranslationKey> = {
  active: "dash.badges.treatment.active",
  expired: "dash.badges.treatment.expired",
  scheduled: "dash.badges.treatment.scheduled",
  completed: "dash.badges.treatment.completed",
};

/**
 * Live signal for a treatment plan: ACTIVE TREATMENT / TREATMENT PERIOD ENDED
 * (end date passed, waiting for the clinician's final review) / COMPLETED
 * (clinician closed the plan) / SCHEDULED.
 */
export function TreatmentPhaseBadge({ phase }: { phase: string }) {
  const { t } = useLocale();
  const key = treatmentPhaseKeys[phase];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-[10px] font-semibold uppercase tracking-wide ${
        treatmentPhaseClasses[phase] || "border-line-strong bg-cream text-muted"
      }`}
    >
      {phase === "active" ? (
        <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" aria-hidden />
      ) : null}
      {phase === "expired" ? (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />
      ) : null}
      {key ? t(key) : phase}
    </span>
  );
}

/** Whole days from today until the given date (0 means today, negative = already passed). */
export function daysUntil(iso: string | Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}