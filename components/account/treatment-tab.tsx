"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { TreatmentPhaseBadge, formatDayDate } from "@/components/account/badges";
import { cn } from "@/lib/utils";
import {
  FaArrowRotateRight,
  FaBell,
  FaCalendarCheck,
  FaCalendarDays,
  FaCamera,
  FaCircleCheck,
  FaCreditCard,
  FaDroplet,
  FaFlaskVial,
  FaHeartPulse,
  FaListCheck,
  FaPills,
  FaXmark,
} from "react-icons/fa6";

/* ── Shared view types (mirror the patient APIs) ──────────────────────── */

type Phase = "active" | "expired" | "scheduled" | "completed";

interface PlanView {
  _id: string;
  forMember?: string;
  title: string;
  program?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  phase: Phase;
  days: number;
  months: number;
  month: number | null;
  day: number | null;
  daysLeft: number;
  elapsed: number;
  status: "active" | "completed";
  completedAt?: string;
  completionReview?: {
    improvements?: string;
    resolved?: string;
    unresolvedProblems?: string;
    complications?: string;
    followUpLabs?: string;
    outcome: "maintenance" | "extended" | "completed" | "discontinued";
    notes?: string;
  };
  monitoring?: {
    glucose: boolean;
    fastingStart: string;
    fastingEnd: string;
    postLunchStart: string;
    postLunchEnd: string;
  };
}

type ReminderView = {
  _id: string;
  plan: string;
  forMember?: string;
  kind: string;
  title: string;
  dueDate: string;
  amountFcfa?: number;
  notes?: string;
  status: "pending" | "done";
  overdue: boolean;
};

type FollowUpView = {
  _id: string;
  plan: string;
  forMember?: string;
  milestone: "baseline" | "monthly" | "final" | "other";
  milestoneLabel?: string;
  date: string;
  improvements?: string;
  resolvedSymptoms: string[];
  improvedSymptoms: string[];
  persistentSymptoms: string[];
  newSymptoms: string[];
  adverseReactions: string[];
  vitals: { weightKg?: number; systolicBp?: number; diastolicBp?: number; glucoseMgdl?: number };
  followUpLabs?: string;
  clinicianNotes?: string;
};

type GlucoseView = {
  _id: string;
  plan: string;
  forMember?: string;
  kind: "fasting" | "post-lunch";
  reading: number;
  mealInfo?: string;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  concerning: boolean;
};

/* ── Small helpers ─────────────────────────────────────────────────────── */

function glucoseLevel(kind: "fasting" | "post-lunch", reading: number) {
  if (kind === "fasting") {
    if (reading >= 126) return { label: "High", cls: "border-red-300 bg-red-50 text-red-700" };
    if (reading >= 100) return { label: "Elevated", cls: "border-amber-300 bg-amber-50 text-amber-800" };
    return { label: "Normal", cls: "border-forest-300 bg-forest-50 text-forest-800" };
  }
  if (reading >= 200) return { label: "High", cls: "border-red-300 bg-red-50 text-red-700" };
  if (reading >= 140) return { label: "Elevated", cls: "border-amber-300 bg-amber-50 text-amber-800" };
  return { label: "Normal", cls: "border-forest-300 bg-forest-50 text-forest-800" };
}

function milestoneLabel(f: FollowUpView, plan: PlanView): string {
  if (f.milestone === "baseline") return "Baseline";
  if (f.milestone === "final") return "Final assessment";
  if (f.milestone === "other") return f.milestoneLabel || "Review";
  const start = new Date(plan.startDate);
  const monthLength = plan.days / plan.months;
  const dayIndex = Math.floor(
    (new Date(f.date).getTime() - start.getTime()) / 86_400_000
  );
  if (dayIndex < 0) return "Review";
  const month = Math.min(plan.months, Math.floor((dayIndex + 1) / monthLength) + 1);
  return `Month ${month}`;
}

function SymptomChips({ label, items, tone }: { label: string; items: string[]; tone: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((s) => (
          <span
            key={s}
            className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", tone)}
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

const reminderKindIcon: Record<string, typeof FaBell> = {
  payment: FaCreditCard,
  refill: FaPills,
  appointment: FaCalendarCheck,
  lab: FaFlaskVial,
  monitoring: FaDroplet,
  custom: FaBell,
};

function SectionCard({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-forest-100 px-5 py-3.5">
        <h3 className="flex items-center gap-2 font-display text-sm font-bold text-ink">
          {icon}
          {title}
        </h3>
        {action || null}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/* ── Plan hero: timeline + "Month X of Y" ──────────────────────────────── */

function PlanHero({ p }: { p: PlanView }) {
  const phaseNote =
    p.phase === "scheduled"
      ? "Not started yet - the clinic will follow your progress once it begins."
      : p.phase === "expired"
        ? "Your treatment period has ended. The clinic will record the final review and close your plan shortly."
        : p.phase === "completed"
          ? p.completionReview?.outcome === "maintenance"
            ? "Treatment completed - you continue on a maintenance program."
            : p.completionReview?.outcome === "extended"
              ? "Treatment completed - the clinic has extended your care in a new phase."
              : "Treatment completed - the clinic closed your plan after the final review."
          : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <div className="border-b border-forest-800 bg-forest-950 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold-400">
              Personalized Treatment Plan
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-white">{p.title}</h2>
            {p.forMember ? <p className="mt-0.5 text-xs text-forest-200">Patient: {p.forMember}</p> : null}
          </div>
          <TreatmentPhaseBadge phase={p.phase} />
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-white/5 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-forest-300">Started</p>
            <p className="mt-0.5 font-semibold text-white">{formatDayDate(p.startDate)}</p>
          </div>
          <div className="rounded-xl bg-white/5 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-forest-300">
              {p.phase === "completed" ? "Completed" : "Expected completion"}
            </p>
            <p className="mt-0.5 font-semibold text-white">
              {formatDayDate(p.completedAt || p.endDate)}
            </p>
          </div>
          <div className="rounded-xl bg-white/5 px-3.5 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-forest-300">Duration</p>
            <p className="mt-0.5 font-semibold text-white">
              {p.months} {p.months === 1 ? "month" : "months"}
              {p.phase === "active" && p.month ? ` · Month ${p.month} of ${p.months}` : ""}
            </p>
          </div>
        </div>

        {p.phase === "active" || p.phase === "scheduled" ? (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-forest-200">
                {p.phase === "active" && p.month
                  ? `Day ${p.day} of ${p.days} · Month ${p.month} of ${p.months}`
                  : `Day 0 of ${p.days}`}
              </span>
              <span className="font-semibold text-gold-400">
                {p.phase === "active"
                  ? p.daysLeft > 0
                    ? `${p.daysLeft} day${p.daysLeft === 1 ? "" : "s"} remaining`
                    : "Final day of treatment"
                  : "Awaiting start"}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gold-400 transition-all"
                style={{ width: `${Math.round((p.phase === "active" ? p.elapsed : 0) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {phaseNote ? (
          <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs leading-relaxed text-forest-100">
            {phaseNote}
          </p>
        ) : null}

        {p.monitoring?.glucose ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
            <FaDroplet className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-hidden />
            <span>
              Daily glucose monitoring required - fasting{" "}
              <span className="font-bold">{p.monitoring.fastingStart}–{p.monitoring.fastingEnd}</span>{" "}
              and 2h post-lunch{" "}
              <span className="font-bold">{p.monitoring.postLunchStart}–{p.monitoring.postLunchEnd}</span>.
            </span>
          </div>
        ) : null}
      </div>

      {p.phase === "completed" && p.completionReview ? (
        <div className="border-b border-forest-100 bg-indigo-50/60 px-5 py-4 sm:px-6">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">
            Final review · {p.completionReview.outcome}
          </p>
          <div className="mt-2 grid gap-3 text-[13px] text-ink sm:grid-cols-2">
            {p.completionReview.improvements ? (
              <p><span className="font-semibold">Improvements:</span> {p.completionReview.improvements}</p>
            ) : null}
            {p.completionReview.resolved ? (
              <p><span className="font-semibold">Resolved:</span> {p.completionReview.resolved}</p>
            ) : null}
            {p.completionReview.unresolvedProblems ? (
              <p><span className="font-semibold">Unresolved:</span> {p.completionReview.unresolvedProblems}</p>
            ) : null}
            {p.completionReview.complications ? (
              <p><span className="font-semibold">Complications:</span> {p.completionReview.complications}</p>
            ) : null}
            {p.completionReview.followUpLabs ? (
              <p><span className="font-semibold">Follow-up labs:</span> {p.completionReview.followUpLabs}</p>
            ) : null}
            {p.completionReview.notes ? (
              <p className="sm:col-span-2"><span className="font-semibold">Notes:</span> {p.completionReview.notes}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ── Glucose logging ───────────────────────────────────────────────────── */

function GlucoseSection({ plan, readings, onSaved }: {
  plan: PlanView;
  readings: GlucoseView[];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"fasting" | "post-lunch">("fasting");
  const [reading, setReading] = useState("");
  const [mealInfo, setMealInfo] = useState("");
  const [photoName, setPhotoName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const today = new Date().toDateString();
  const todayReadings = readings.filter((r) => new Date(r.createdAt).toDateString() === today);
  const fastingDone = todayReadings.some((r) => r.kind === "fasting");
  const postLunchDone = todayReadings.some((r) => r.kind === "post-lunch");

  function pickPhoto(file: File | null) {
    setPhotoName(file ? file.name : "");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const value = Number(reading);
    if (!Number.isFinite(value) || value < 10 || value > 900) {
      setErr("Enter a valid reading between 10 and 900 mg/dL.");
      return;
    }
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const form = new FormData();
      form.set("plan", plan._id);
      form.set("kind", kind);
      form.set("reading", String(value));
      if (mealInfo.trim()) form.set("mealInfo", mealInfo.trim());
      const file = fileRef.current?.files?.[0];
      if (file) form.set("photo", file);
      const res = await fetch("/api/glucose", { method: "POST", credentials: "include", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the reading.");
      setMsg("Reading saved. Thank you for monitoring your glucose!");
      setReading("");
      setMealInfo("");
      pickPhoto(null);
      if (fileRef.current) fileRef.current.value = "";
      setOpen(false);
      onSaved();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not save the reading.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title="Diabetes monitoring"
      icon={<FaDroplet className="h-4 w-4 text-sky-600" aria-hidden />}
      action={
        plan.phase === "active" ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors",
              open
                ? "border-line-strong bg-white text-muted"
                : "border-sky-300 bg-sky-50 text-sky-800 hover:border-sky-500"
            )}
          >
            {open ? <FaXmark className="h-3 w-3" aria-hidden /> : <FaDroplet className="h-3 w-3" aria-hidden />}
            {open ? "Close" : "Log reading"}
          </button>
        ) : null
      }
    >
      <div className="flex flex-wrap gap-2 text-xs">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold",
          fastingDone ? "border-forest-300 bg-forest-50 text-forest-800" : "border-line-strong bg-cream text-muted")}>
          <FaCircleCheck className={cn("h-3 w-3", fastingDone ? "text-forest-600" : "text-muted")} aria-hidden />
          Fasting {fastingDone ? "logged today" : "pending"}
        </span>
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold",
          postLunchDone ? "border-forest-300 bg-forest-50 text-forest-800" : "border-line-strong bg-cream text-muted")}>
          <FaCircleCheck className={cn("h-3 w-3", postLunchDone ? "text-forest-600" : "text-muted")} aria-hidden />
          2h post-lunch {postLunchDone ? "logged today" : "pending"}
        </span>
      </div>

      {open ? (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Reading type" required>
              <div className="flex gap-2">
                {(["fasting", "post-lunch"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={cn(
                      "flex-1 cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors",
                      kind === k
                        ? "border-sky-500 bg-sky-600 text-white"
                        : "border-line-strong bg-white text-muted hover:border-sky-400"
                    )}
                  >
                    {k === "fasting" ? "Fasting (6–10 AM)" : "2h post-lunch"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Reading (mg/dL)" required>
              <input
                type="number"
                min={10}
                max={900}
                inputMode="numeric"
                value={reading}
                onChange={(e) => setReading(e.target.value)}
                placeholder="e.g. 104"
                className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
                required
              />
            </Field>
          </div>
          {kind === "post-lunch" ? (
            <Field label="What did you eat? (optional)">
              <input
                type="text"
                value={mealInfo}
                onChange={(e) => setMealInfo(e.target.value)}
                placeholder="e.g. Rice, beans and fish"
                maxLength={500}
                className="w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:border-forest-500"
              />
            </Field>
          ) : null}
          <Field label="Photo of the glucose meter result (optional)" hint="Clear photo of the meter screen. Max 6 MB.">
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink hover:border-sky-400">
                <FaCamera className="h-3.5 w-3.5" aria-hidden />
                {photoName || "Choose photo"}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
                />
              </label>
              {photoPreview ? (
                <img src={photoPreview} alt="Glucose meter result preview" className="h-14 w-14 rounded-lg border border-line object-cover" />
              ) : null}
              {photoName ? (
                <button type="button" onClick={() => pickPhoto(null)} className="text-xs font-semibold text-red-600 hover:underline">
                  Remove
                </button>
              ) : null}
            </div>
          </Field>
          {err ? <p className="text-xs font-semibold text-red-700">{err}</p> : null}
          {msg ? <p className="text-xs font-semibold text-forest-700">{msg}</p> : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-bold text-white transition-colors hover:bg-sky-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save reading"}
            </button>
          </div>
        </form>
      ) : null}

      {readings.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {readings.slice(0, 6).map((r) => {
            const level = glucoseLevel(r.kind, r.reading);
            return (
              <li key={r._id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-cream/50 px-3.5 py-2.5">
                <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-lg", r.kind === "fasting" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700")}>
                  <FaDroplet className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink">{r.reading} mg/dL</span>
                  <span className="block text-[11px] text-muted">
                    {r.kind === "fasting" ? "Fasting" : "2h post-lunch"}
                    {r.mealInfo ? ` · ${r.mealInfo}` : ""} · {formatDayDate(r.createdAt)}
                  </span>
                </span>
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", level.cls)}>
                  {level.label}
                </span>
                {r.photoUrl ? (
                  <a href={r.photoUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900">
                    View photo
                  </a>
                ) : null}
              </li>
            );
          })}
          {readings.length > 6 ? (
            <p className="pt-1 text-[11px] text-muted">Showing the 6 most recent readings.</p>
          ) : null}
        </ul>
      ) : (
        <p className="mt-4 text-xs text-muted">
          No readings yet - log your first fasting or post-lunch reading above.
        </p>
      )}
    </SectionCard>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-ink">
        {label} {required ? <span className="text-gold-600">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

/* ── Today's tasks (reminders + required readings) ─────────────────────── */

function TasksSection({
  plan,
  reminders,
  onMarkDone,
}: {
  plan: PlanView;
  reminders: ReminderView[];
  onMarkDone: (id: string) => void;
}) {
  const mine = useMemo(() => {
    const list = reminders
      .filter((r) => r.plan === plan._id)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
    const pending = list.filter((r) => r.status === "pending");
    const done = list.filter((r) => r.status === "done").slice(-3);
    return { pending, done };
  }, [reminders, plan._id]);

  if (mine.pending.length === 0 && mine.done.length === 0) {
    return (
      <SectionCard
        title="Today's tasks & reminders"
        icon={<FaListCheck className="h-4 w-4 text-forest-700" aria-hidden />}
      >
        <p className="text-xs text-muted">
          The clinic will post reminders here for payments, refills, follow-up calls, lab tests and
          daily monitoring.
        </p>
      </SectionCard>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <SectionCard
      title="Today's tasks & reminders"
      icon={<FaListCheck className="h-4 w-4 text-forest-700" aria-hidden />}
    >
      {mine.pending.length > 0 ? (
        <ul className="space-y-2">
          {mine.pending.map((r) => {
            const Icon = reminderKindIcon[r.kind] || FaBell;
            const past = r.dueDate < today;
            const due = r.dueDate === today;
            return (
              <li key={r._id} className="flex items-center gap-3 rounded-lg border border-line bg-cream/50 px-3.5 py-2.5">
                <span className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  past ? "bg-red-100 text-red-700" : due ? "bg-amber-100 text-amber-700" : "bg-forest-100 text-forest-700"
                )}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {r.title}
                    {r.kind === "payment" && r.amountFcfa ? (
                      <span className="text-forest-800"> · {r.amountFcfa.toLocaleString()} FCFA</span>
                    ) : null}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {due ? "Due today" : past ? `Overdue · due ${formatDayDate(r.dueDate)}` : `Due ${formatDayDate(r.dueDate)}`}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => onMarkDone(r._id)}
                  className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-forest-300 bg-white px-2.5 text-[11px] font-bold text-forest-800 transition-colors hover:bg-forest-50"
                >
                  <FaCircleCheck className="h-3 w-3" aria-hidden />
                  Done
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted">All tasks done - great job!</p>
      )}
      {mine.done.length > 0 ? (
        <div className="mt-3 border-t border-forest-100 pt-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Recently done</p>
          <ul className="mt-1.5 space-y-1">
            {mine.done.map((r) => (
              <li key={r._id} className="flex items-center gap-2 text-xs text-muted">
                <FaCircleCheck className="h-3 w-3 shrink-0 text-forest-500" aria-hidden />
                <span className="truncate">{r.title} · {formatDayDate(r.dueDate)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </SectionCard>
  );
}

/* ── Progress timeline (follow-ups) ────────────────────────────────────── */

function ProgressSection({ plan, followUps }: { plan: PlanView; followUps: FollowUpView[] }) {
  const mine = useMemo(
    () => followUps.filter((f) => f.plan === plan._id).sort((a, b) => (a.date < b.date ? -1 : 1)),
    [followUps, plan._id]
  );

  return (
    <SectionCard title="Treatment progress" icon={<FaHeartPulse className="h-4 w-4 text-rose-600" aria-hidden />}>
      {mine.length === 0 ? (
        <p className="text-xs text-muted">
          The clinic records your progress at each follow-up - Baseline, Month 1, Month 2... Final
          assessment. Updates will appear here as a dated history.
        </p>
      ) : (
        <ol className="relative space-y-5 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-px before:bg-forest-200">
          {mine.map((f) => {
            const v = f.vitals;
            const vitals: string[] = [];
            if (v.weightKg !== undefined) vitals.push(`${v.weightKg} kg`);
            if (v.systolicBp !== undefined && v.diastolicBp !== undefined)
              vitals.push(`BP ${v.systolicBp}/${v.diastolicBp}`);
            if (v.glucoseMgdl !== undefined) vitals.push(`Glucose ${v.glucoseMgdl} mg/dL`);
            return (
              <li key={f._id} className="relative pl-9">
                <span className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-forest-200 bg-white">
                  <span className="h-2 w-2 rounded-full bg-forest-600" />
                </span>
                <p className="text-xs font-bold text-forest-900">{milestoneLabel(f, plan)}</p>
                <p className="text-[11px] text-muted">{formatDayDate(f.date)}{f.forMember ? ` · ${f.forMember}` : ""}</p>
                {f.improvements ? (
                  <p className="mt-1.5 rounded-lg bg-forest-50 px-3 py-2 text-xs leading-relaxed text-ink">
                    <span className="font-semibold text-forest-800">Improvements:</span> {f.improvements}
                  </p>
                ) : null}
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                  <SymptomChips label="Resolved" items={f.resolvedSymptoms} tone="border-forest-300 bg-forest-50 text-forest-800" />
                  <SymptomChips label="Improved" items={f.improvedSymptoms} tone="border-teal-300 bg-teal-50 text-teal-800" />
                  <SymptomChips label="Persistent" items={f.persistentSymptoms} tone="border-amber-300 bg-amber-50 text-amber-800" />
                  <SymptomChips label="New / complications" items={f.newSymptoms} tone="border-red-300 bg-red-50 text-red-700" />
                  <SymptomChips label="Adverse reactions" items={f.adverseReactions} tone="border-rose-300 bg-rose-50 text-rose-700" />
                </div>
                {vitals.length > 0 ? (
                  <p className="mt-2.5 text-xs text-muted">
                    <span className="font-semibold text-ink">Vitals:</span> {vitals.join(" · ")}
                  </p>
                ) : null}
                {f.followUpLabs ? (
                  <p className="mt-1.5 text-xs text-muted">
                    <span className="font-semibold text-ink">Follow-up labs:</span> {f.followUpLabs}
                  </p>
                ) : null}
                {f.clinicianNotes ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-ink">Clinician notes:</span> {f.clinicianNotes}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </SectionCard>
  );
}

/* ── Tab shell ─────────────────────────────────────────────────────────── */

export function TreatmentTab() {
  const [plans, setPlans] = useState<PlanView[] | null>(null);
  const [reminders, setReminders] = useState<ReminderView[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpView[]>([]);
  const [glucose, setGlucose] = useState<GlucoseView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    let active = true;
    Promise.all([
      fetch("/api/treatment-plans", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/treatment-reminders", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/treatment-follow-ups", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/glucose", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([p, r, f, g]) => {
        if (!active) return;
        if (p.error) setError(p.error);
        else if (Array.isArray(p.plans)) setPlans(p.plans as PlanView[]);
        if (Array.isArray(r.reminders)) setReminders(r.reminders as ReminderView[]);
        if (Array.isArray(f.followUps)) setFollowUps(f.followUps as FollowUpView[]);
        if (Array.isArray(g.readings)) setGlucose(g.readings as GlucoseView[]);
      })
      .catch(() => {
        if (active) setError("Could not load your treatment dashboard.");
      })
      .finally(() => {
        if (active) setRefreshing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(load, [load]);

  async function markReminderDone(id: string) {
    try {
      const res = await fetch(`/api/treatment-reminders/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "done" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the reminder.");
      setReminders((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "done", overdue: false } : r))
      );
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not update the reminder.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Your personalized treatment dashboard - timeline, progress, today&apos;s tasks and
          required readings, all in one place.
        </p>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            load();
          }}
          disabled={refreshing}
          className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink transition-colors hover:border-forest-400 disabled:opacity-50"
        >
          <FaArrowRotateRight className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden />
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!plans ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {plans && plans.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-10 text-center">
          <FaCalendarDays className="mx-auto h-8 w-8 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            No treatment plan yet. The clinic sets up a personalized 3-month or 6-month plan for you -
            once it is ready, your treatment dashboard will appear here.
          </p>
        </div>
      ) : null}

      {plans && plans.length > 0 ? (
        <div className="space-y-6">
          {plans
            .slice()
            .sort((a, b) => (a.startDate < b.startDate ? 1 : -1))
            .map((p) => (
              <div key={p._id} className="space-y-4">
                <PlanHero p={p} />
                {p.phase === "active" ? (
                  <div className="grid gap-4 xl:grid-cols-2">
                    <TasksSection plan={p} reminders={reminders} onMarkDone={markReminderDone} />
                    {p.monitoring?.glucose ? (
                      <GlucoseSection plan={p} readings={glucose} onSaved={load} />
                    ) : null}
                  </div>
                ) : null}
                <ProgressSection plan={p} followUps={followUps} />
              </div>
            ))}
        </div>
      ) : null}
    </div>
  );
}