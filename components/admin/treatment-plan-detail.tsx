"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { formatDayDate } from "@/components/account/badges";
import { cn } from "@/lib/utils";
import {
  FaBell,
  FaCalendarCheck,
  FaCircleCheck,
  FaCreditCard,
  FaDroplet,
  FaFlaskVial,
  FaHeartPulse,
  FaListCheck,
  FaPencil,
  FaPills,
  FaPlus,
  FaRotateLeft,
  FaTriangleExclamation,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";

/* ── Types (mirror the admin APIs) ─────────────────────────────────────── */

interface AdminPlan {
  _id: string;
  user: { _id: string; name?: string; email?: string };
  forMember?: string;
  title: string;
  program?: string;
  startDate: string;
  endDate: string;
  notes?: string;
  phase: "active" | "expired" | "scheduled" | "completed";
  days: number;
  months: number;
  month: number | null;
  daysLeft: number;
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

interface FollowUp {
  _id: string;
  plan: string;
  user: string | { _id: string; name?: string };
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
}

interface Reminder {
  _id: string;
  plan: string;
  user: string | { _id: string; name?: string };
  kind: string;
  title: string;
  dueDate: string;
  amountFcfa?: number;
  notes?: string;
  status: "pending" | "done";
  overdue: boolean;
}

interface GlucoseReading {
  _id: string;
  plan: string;
  user: string | { _id: string; name?: string };
  forMember?: string;
  kind: "fasting" | "post-lunch";
  reading: number;
  mealInfo?: string;
  photoUrl?: string;
  createdAt: string;
  concerning: boolean;
}

const MILESTONE_OPTIONS: { value: FollowUp["milestone"]; label: string }[] = [
  { value: "baseline", label: "Baseline" },
  { value: "monthly", label: "Monthly check-in" },
  { value: "final", label: "Final assessment" },
  { value: "other", label: "Other" },
];

const REMINDER_KINDS: { value: Reminder["kind"]; label: string }[] = [
  { value: "payment", label: "Payment / installment" },
  { value: "refill", label: "Treatment renewal / refill" },
  { value: "appointment", label: "Appointment / follow-up call" },
  { value: "lab", label: "Laboratory test" },
  { value: "monitoring", label: "Daily monitoring" },
  { value: "custom", label: "Other" },
];

const REMINDER_LABELS: Record<string, string> = {
  payment: "Payment / installment",
  refill: "Treatment renewal / refill",
  appointment: "Appointment / follow-up call",
  lab: "Laboratory test",
  monitoring: "Daily monitoring",
  custom: "Other",
};

function miniInput(cls = "") {
  return cn(
    "w-full rounded-lg border border-line-strong bg-white px-2.5 py-1.5 text-sm outline-none focus:border-forest-500",
    cls
  );
}

/* ── Close-out (final review) ──────────────────────────────────────────── */

function CloseOutSection({ plan, onChanged }: { plan: AdminPlan; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    outcome: "completed",
    improvements: "",
    resolved: "",
    unresolvedProblems: "",
    complications: "",
    followUpLabs: "",
    notes: "",
  });

  if (plan.phase === "completed") {
    const r = plan.completionReview;
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-bold text-indigo-900">
            Final review recorded
            {plan.completedAt ? ` · closed ${formatDayDate(plan.completedAt)}` : ""}
          </p>
          <button
            type="button"
            onClick={async () => {
              if (
                !window.confirm(
                  "Reopen this plan? It will become active again and the patient will be notified."
                )
              ) {
                return;
              }
              try {
                const res = await fetch(`/api/admin/treatment-plans/${plan._id}`, {
                  method: "PATCH",
                  credentials: "include",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "active" }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Could not reopen the plan.");
                onChanged();
              } catch (err) {
                window.alert(err instanceof Error ? err.message : "Could not reopen the plan.");
              }
            }}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 text-xs font-semibold text-indigo-800 hover:bg-indigo-50"
          >
            <FaRotateLeft className="h-3 w-3" aria-hidden />
            Reopen
          </button>
        </div>
        <div className="mt-2 grid gap-x-6 gap-y-1.5 text-xs text-ink sm:grid-cols-2">
          <p><span className="font-semibold">Outcome:</span> {r?.outcome}</p>
          {r?.improvements ? <p><span className="font-semibold">Improvements:</span> {r.improvements}</p> : null}
          {r?.resolved ? <p><span className="font-semibold">Resolved:</span> {r.resolved}</p> : null}
          {r?.unresolvedProblems ? <p><span className="font-semibold">Unresolved:</span> {r.unresolvedProblems}</p> : null}
          {r?.complications ? <p><span className="font-semibold">Complications:</span> {r.complications}</p> : null}
          {r?.followUpLabs ? <p><span className="font-semibold">Follow-up labs:</span> {r.followUpLabs}</p> : null}
          {r?.notes ? <p className="sm:col-span-2"><span className="font-semibold">Notes:</span> {r.notes}</p> : null}
        </div>
      </div>
    );
  }

  if (plan.phase !== "expired") return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-900">
          <FaTriangleExclamation className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          Treatment period ended - record the final review
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors",
            open
              ? "border-line-strong bg-white text-muted"
              : "border-amber-400 bg-white text-amber-900 hover:bg-amber-100"
          )}
        >
          {open ? <FaXmark className="h-3 w-3" aria-hidden /> : <FaPencil className="h-3 w-3" aria-hidden />}
          {open ? "Close" : plan.status === "completed" ? "Edit review" : "Final review"}
        </button>
      </div>

      {open ? (
        <form
          className="mt-3 grid gap-3"
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            setSaving(true);
            try {
              const res = await fetch(`/api/admin/treatment-plans/${plan._id}`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "completed", completionReview: form }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Could not close the treatment.");
              setOpen(false);
              onChanged();
            } catch (err) {
              window.alert(err instanceof Error ? err.message : "Could not close the treatment.");
            } finally {
              setSaving(false);
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Outcome *</span>
              <select
                value={form.outcome}
                onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
                className={miniInput()}
              >
                <option value="completed">Completed programme</option>
                <option value="maintenance">Proceeds to maintenance</option>
                <option value="extended">Extends treatment</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Follow-up labs (optional)</span>
              <input
                value={form.followUpLabs}
                onChange={(e) => setForm((f) => ({ ...f, followUpLabs: e.target.value }))}
                placeholder="e.g. HbA1c 6.1%, LDL 1.8"
                className={miniInput()}
              />
            </label>
          </div>
          {(["improvements", "resolved", "unresolvedProblems", "complications"] as const).map((key) => (
            <label key={key} className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">
                {key === "improvements"
                  ? "Overall improvements"
                  : key === "resolved"
                    ? "Problems resolved"
                    : key === "unresolvedProblems"
                      ? "Unresolved problems"
                      : "Complications during treatment"}
              </span>
              <textarea
                rows={2}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className={cn(miniInput(), "resize-y")}
              />
            </label>
          ))}
          <label className="space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Notes (optional)</span>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={cn(miniInput(), "resize-y")} />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
            >
              <FaCircleCheck className="h-3.5 w-3.5" aria-hidden />
              {saving ? "Saving..." : "Close treatment"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/* ── Follow-up (progress) management ───────────────────────────────────── */

function FollowUpSection({ plan, onChanged }: { plan: AdminPlan; onChanged: () => void }) {
  const [items, setItems] = useState<FollowUp[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const blank = {
    date: new Date().toISOString().slice(0, 10),
    milestone: "monthly" as FollowUp["milestone"],
    milestoneLabel: "",
    improvements: "",
    resolved: "",
    improved: "",
    persistent: "",
    newSymptoms: "",
    adverse: "",
    weightKg: "",
    systolicBp: "",
    diastolicBp: "",
    glucoseMgdl: "",
    followUpLabs: "",
    clinicianNotes: "",
  };
  const [form, setForm] = useState(blank);

  const load = useCallback(() => {
    let active = true;
    fetch(`/api/admin/treatment-follow-ups?plan=${plan._id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data.followUps)) setItems(data.followUps as FollowUp[]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [plan._id]);

  useEffect(load, [load]);

  function openAdd() {
    setForm(blank);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(f: FollowUp) {
    setForm({
      date: f.date.slice(0, 10),
      milestone: f.milestone,
      milestoneLabel: f.milestoneLabel || "",
      improvements: f.improvements || "",
      resolved: f.resolvedSymptoms.join(", "),
      improved: f.improvedSymptoms.join(", "),
      persistent: f.persistentSymptoms.join(", "),
      newSymptoms: f.newSymptoms.join(", "),
      adverse: f.adverseReactions.join(", "),
      weightKg: f.vitals.weightKg !== undefined ? String(f.vitals.weightKg) : "",
      systolicBp: f.vitals.systolicBp !== undefined ? String(f.vitals.systolicBp) : "",
      diastolicBp: f.vitals.diastolicBp !== undefined ? String(f.vitals.diastolicBp) : "",
      glucoseMgdl: f.vitals.glucoseMgdl !== undefined ? String(f.vitals.glucoseMgdl) : "",
      followUpLabs: f.followUpLabs || "",
      clinicianNotes: f.clinicianNotes || "",
    });
    setEditingId(f._id);
    setShowForm(true);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!form.date) {
      setErr("Choose a follow-up date.");
      return;
    }
    try {
      const payload = {
        plan: plan._id,
        date: `${form.date}T12:00:00`,
        milestone: form.milestone,
        milestoneLabel: form.milestone === "other" ? form.milestoneLabel : undefined,
        improvements: form.improvements || undefined,
        resolvedSymptoms: form.resolved,
        improvedSymptoms: form.improved,
        persistentSymptoms: form.persistent,
        newSymptoms: form.newSymptoms,
        adverseReactions: form.adverse,
        vitals: {
          weightKg: form.weightKg || undefined,
          systolicBp: form.systolicBp || undefined,
          diastolicBp: form.diastolicBp || undefined,
          glucoseMgdl: form.glucoseMgdl || undefined,
        },
        followUpLabs: form.followUpLabs || undefined,
        clinicianNotes: form.clinicianNotes || undefined,
      };
      const res = await fetch(
        editingId ? `/api/admin/treatment-follow-ups/${editingId}` : "/api/admin/treatment-follow-ups",
        {
          method: editingId ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the follow-up.");
      setShowForm(false);
      setEditingId(null);
      load();
      onChanged();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not save the follow-up.");
    }
  }

  async function remove(f: FollowUp) {
    if (!window.confirm("Delete this progress note? The patient's history will lose this entry.")) return;
    try {
      const res = await fetch(`/api/admin/treatment-follow-ups/${f._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the follow-up.");
      load();
      onChanged();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete the follow-up.");
    }
  }

  const milestoneLabel = (f: FollowUp) => {
    if (f.milestone !== "monthly") {
      return f.milestone === "baseline"
        ? "Baseline"
        : f.milestone === "final"
          ? "Final assessment"
          : f.milestoneLabel || "Review";
    }
    const dayIndex = Math.round(
      (new Date(f.date).getTime() - new Date(plan.startDate).getTime()) / 86_400_000
    );
    const monthLength = plan.days / plan.months;
    const month = Math.min(plan.months, Math.floor(Math.max(0, dayIndex) / monthLength) + 1);
    return `Month ${month}`;
  };

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <FaHeartPulse className="h-4 w-4 text-rose-600" aria-hidden />
          Progress notes (follow-ups)
        </p>
        {!showForm ? (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 px-3 text-xs font-semibold text-rose-800 transition-colors hover:border-rose-500"
          >
            <FaPlus className="h-3 w-3" aria-hidden />
            Add follow-up
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mt-3 rounded-xl border border-rose-100 bg-rose-50/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-ink">
              {editingId ? "Edit follow-up" : "New follow-up"} - append to the dated history
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              aria-label="Close form"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
            >
              <FaXmark className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Date *</span>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={miniInput()} required />
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Milestone *</span>
              <select value={form.milestone} onChange={(e) => setForm((f) => ({ ...f, milestone: e.target.value as FollowUp["milestone"] }))} className={miniInput()}>
                {MILESTONE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            {form.milestone === "other" ? (
              <label className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Milestone label</span>
                <input value={form.milestoneLabel} onChange={(e) => setForm((f) => ({ ...f, milestoneLabel: e.target.value }))} placeholder="e.g. Week 6 review" className={miniInput()} />
              </label>
            ) : null}
          </div>
          <label className="mt-3 block space-y-1.5">
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Improvements recorded</span>
            <textarea rows={2} value={form.improvements} onChange={(e) => setForm((f) => ({ ...f, improvements: e.target.value }))} placeholder="What has improved since the last follow-up?" className={cn(miniInput(), "resize-y")} />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {([
              ["resolved", "Resolved symptoms (comma separated)"],
              ["improved", "Improved symptoms (comma separated)"],
              ["persistent", "Persistent symptoms (comma separated)"],
              ["newSymptoms", "New symptoms / complications (comma separated)"],
              ["adverse", "Adverse reactions (comma separated)"],
            ] as const).map(([key, label]) => (
              <label key={key} className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">{label}</span>
                <input value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={miniInput()} />
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {([
              ["weightKg", "Weight (kg)"],
              ["systolicBp", "BP systolic"],
              ["diastolicBp", "BP diastolic"],
              ["glucoseMgdl", "Glucose (mg/dL)"],
            ] as const).map(([key, label]) => (
              <label key={key} className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">{label}</span>
                <input type="number" step="any" value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} className={miniInput()} />
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Follow-up labs</span>
              <input value={form.followUpLabs} onChange={(e) => setForm((f) => ({ ...f, followUpLabs: e.target.value }))} className={miniInput()} />
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Clinician notes</span>
              <input value={form.clinicianNotes} onChange={(e) => setForm((f) => ({ ...f, clinicianNotes: e.target.value }))} className={miniInput()} />
            </label>
          </div>
          {err ? <p className="mt-2 text-xs font-semibold text-red-700">{err}</p> : null}
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="submit"
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white transition-colors hover:bg-rose-700"
            >
              {editingId ? "Save changes" : "Record follow-up"}
            </button>
          </div>
        </form>
      ) : null}

      {items === null ? (
        <div className="mt-3 flex h-16 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No progress notes yet. Add the Baseline assessment when the treatment starts, then one at
          each monthly follow-up and the Final assessment.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items
            .slice()
            .sort((a, b) => (a.date < b.date ? 1 : -1))
            .map((f) => {
              const v = f.vitals;
              const vitals: string[] = [];
              if (v.weightKg !== undefined) vitals.push(`${v.weightKg} kg`);
              if (v.systolicBp !== undefined && v.diastolicBp !== undefined) vitals.push(`BP ${v.systolicBp}/${v.diastolicBp}`);
              if (v.glucoseMgdl !== undefined) vitals.push(`Glu ${v.glucoseMgdl}`);
              return (
                <li key={f._id} className="rounded-lg border border-forest-100 bg-cream/50 px-3.5 py-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-forest-900">
                      {milestoneLabel(f)} <span className="font-normal text-muted">· {formatDayDate(f.date)}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => openEdit(f)} aria-label="Edit follow-up"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink">
                        <FaPencil className="h-3 w-3" aria-hidden />
                      </button>
                      <button type="button" onClick={() => void remove(f)} aria-label="Delete follow-up"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50">
                        <FaTrashCan className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  </div>
                  {f.improvements ? <p className="mt-1 text-xs text-ink"><span className="font-semibold">Improvements:</span> {f.improvements}</p> : null}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {f.resolvedSymptoms.map((s) => <span key={s} className="rounded-full border border-forest-300 bg-forest-50 px-2 py-0.5 text-[10px] font-semibold text-forest-800">✓ {s}</span>)}
                    {f.improvedSymptoms.map((s) => <span key={s} className="rounded-full border border-teal-300 bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800">↑ {s}</span>)}
                    {f.persistentSymptoms.map((s) => <span key={s} className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{s}</span>)}
                    {f.newSymptoms.map((s) => <span key={s} className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">! {s}</span>)}
                    {f.adverseReactions.map((s) => <span key={s} className="rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700">⚠ {s}</span>)}
                  </div>
                  {vitals.length > 0 ? <p className="mt-1 text-[11px] text-muted">Vitals: {vitals.join(" · ")}</p> : null}
                  {f.followUpLabs ? <p className="mt-0.5 text-[11px] text-muted"><span className="font-semibold">Labs:</span> {f.followUpLabs}</p> : null}
                  {f.clinicianNotes ? <p className="mt-0.5 text-[11px] text-muted"><span className="font-semibold">Notes:</span> {f.clinicianNotes}</p> : null}
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}

/* ── Reminders management ──────────────────────────────────────────────── */

function RemindersSection({ plan }: { plan: AdminPlan }) {
  const [items, setItems] = useState<Reminder[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    kind: "payment",
    title: "",
    dueDate: new Date().toISOString().slice(0, 10),
    amountFcfa: "",
    notes: "",
  });
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    fetch(`/api/admin/treatment-reminders?plan=${plan._id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data.reminders)) setItems(data.reminders as Reminder[]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [plan._id]);

  useEffect(load, [load]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await fetch("/api/admin/treatment-reminders", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan._id,
          kind: form.kind,
          title: form.title,
          dueDate: form.dueDate,
          amountFcfa: form.kind === "payment" && form.amountFcfa ? form.amountFcfa : undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create the reminder.");
      setForm((f) => ({ ...f, title: "", notes: "", amountFcfa: "" }));
      setShowForm(false);
      load();
    } catch (error) {
      setErr(error instanceof Error ? error.message : "Could not create the reminder.");
    }
  }

  async function setStatus(r: Reminder, status: "pending" | "done") {
    try {
      const res = await fetch(`/api/admin/treatment-reminders/${r._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update the reminder.");
      load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not update the reminder.");
    }
  }

  async function remove(r: Reminder) {
    if (!window.confirm("Delete this reminder?")) return;
    try {
      const res = await fetch(`/api/admin/treatment-reminders/${r._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the reminder.");
      load();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not delete the reminder.");
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-bold text-ink">
          <FaListCheck className="h-4 w-4 text-forest-700" aria-hidden />
          Reminders &amp; installments
        </p>
        {!showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-forest-300 bg-forest-50 px-3 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-500"
          >
            <FaPlus className="h-3 w-3" aria-hidden />
            Add reminder
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form onSubmit={submit} className="mt-3 rounded-xl border border-forest-100 bg-forest-50/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-ink">New reminder - shown to the patient under &quot;Today&apos;s tasks&quot;</p>
            <button type="button" onClick={() => setShowForm(false)} aria-label="Close form"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink">
              <FaXmark className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Type *</span>
              <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))} className={miniInput()}>
                {REMINDER_KINDS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Title *</span>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={form.kind === "payment" ? "e.g. 2nd installment" : form.kind === "refill" ? "e.g. Refill month 2 remedies" : form.kind === "appointment" ? "e.g. Follow-up call" : form.kind === "lab" ? "e.g. Fasting lab test" : "e.g. Take morning remedies"}
                className={miniInput()} required />
            </label>
            <label className="space-y-1.5">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Due date *</span>
              <input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className={miniInput()} required />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {form.kind === "payment" ? (
              <label className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Amount (FCFA)</span>
                <input type="number" min={0} value={form.amountFcfa} onChange={(e) => setForm((f) => ({ ...f, amountFcfa: e.target.value }))} className={miniInput()} />
              </label>
            ) : null}
            <label className={cn("space-y-1.5", form.kind === "payment" ? "" : "sm:col-span-2")}>
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">Notes (optional)</span>
              <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={miniInput()} />
            </label>
          </div>
          {err ? <p className="mt-2 text-xs font-semibold text-red-700">{err}</p> : null}
          <div className="mt-3 flex justify-end">
            <button type="submit" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-forest-800 px-4 text-xs font-bold text-white transition-colors hover:bg-forest-950">
              Create reminder
            </button>
          </div>
        </form>
      ) : null}

      {items === null ? (
        <div className="mt-3 flex h-16 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No reminders yet - add payment/installment dates, refill dates, follow-up calls and lab
          tests. Patients see them as tasks and overdue items alert the team.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.map((r) => {
            const Icon = r.kind === "payment" ? FaCreditCard : r.kind === "refill" ? FaPills : r.kind === "appointment" ? FaCalendarCheck : r.kind === "lab" ? FaFlaskVial : r.kind === "monitoring" ? FaDroplet : FaBell;
            const past = r.dueDate < today;
            return (
              <li key={r._id} className={cn(
                "flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2",
                r.status === "done" ? "border-line bg-cream/40 opacity-70" : past ? "border-red-200 bg-red-50/60" : "border-line bg-cream/50"
              )}>
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  r.status === "done" ? "bg-forest-100 text-forest-600" : past ? "bg-red-100 text-red-700" : "bg-white text-forest-700")}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-ink">
                    {r.title}
                    {r.amountFcfa ? <span className="text-forest-800"> · {r.amountFcfa.toLocaleString()} FCFA</span> : null}
                    <span className="ml-1.5 font-normal text-muted">({REMINDER_LABELS[r.kind] || r.kind})</span>
                  </span>
                  <span className="block text-[11px] text-muted">
                    Due {formatDayDate(r.dueDate)}
                    {past && r.status === "pending" ? " · overdue" : ""}
                    {r.notes ? ` · ${r.notes}` : ""}
                  </span>
                </span>
                {r.status === "pending" ? (
                  <button type="button" onClick={() => void setStatus(r, "done")}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-forest-300 bg-white px-2 text-[11px] font-bold text-forest-800 hover:bg-forest-50">
                    <FaCircleCheck className="h-3 w-3" aria-hidden /> Done
                  </button>
                ) : (
                  <button type="button" onClick={() => void setStatus(r, "pending")}
                    className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-line-strong bg-white px-2 text-[11px] font-semibold text-muted hover:text-ink">
                    <FaRotateLeft className="h-3 w-3" aria-hidden /> Reopen
                  </button>
                )}
                <button type="button" onClick={() => void remove(r)} aria-label="Delete reminder"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50">
                  <FaTrashCan className="h-3 w-3" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Glucose readings viewer ───────────────────────────────────────────── */

function GlucoseSection({ plan }: { plan: AdminPlan }) {
  const [items, setItems] = useState<GlucoseReading[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/glucose?plan=${plan._id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data.readings)) setItems(data.readings as GlucoseReading[]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [plan._id]);

  if (!plan.monitoring?.glucose) return null;

  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-ink">
        <FaDroplet className="h-4 w-4 text-sky-600" aria-hidden />
        Glucose readings
        <span className="font-normal text-muted">(fasting {plan.monitoring.fastingStart}–{plan.monitoring.fastingEnd} AM · post-lunch {plan.monitoring.postLunchStart}–{plan.monitoring.postLunchEnd})</span>
      </p>
      {items === null ? (
        <div className="mt-3 flex h-16 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-xs text-muted">
          No readings submitted yet. Missed submissions appear in the treatment alerts.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.slice(0, 10).map((r) => (
            <li key={r._id} className={cn(
              "flex flex-wrap items-center gap-2.5 rounded-lg border px-3 py-2",
              r.concerning ? "border-red-300 bg-red-50/70" : "border-line bg-cream/50"
            )}>
              <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold",
                r.concerning ? "border-red-300 bg-red-100 text-red-700" : r.kind === "fasting" ? "border-sky-300 bg-sky-50 text-sky-800" : "border-amber-300 bg-amber-50 text-amber-800")}>
                {r.reading} mg/dL {r.concerning ? "· concerning" : ""}
              </span>
              <span className="min-w-0 flex-1 text-[11px] text-muted">
                {r.kind === "fasting" ? "fasting" : "2h post-lunch"}
                {r.forMember ? ` · ${r.forMember}` : ""}
                {r.mealInfo ? ` · ${r.mealInfo}` : ""}
                {" · "}{formatDayDate(r.createdAt)}
              </span>
              {r.photoUrl ? (
                <a href={r.photoUrl} target="_blank" rel="noreferrer"
                  className="text-[11px] font-semibold text-sky-700 underline underline-offset-2 hover:text-sky-900">
                  View photo
                </a>
              ) : null}
            </li>
          ))}
          {items.length > 10 ? <p className="pt-1 text-[11px] text-muted">Showing the 10 most recent readings.</p> : null}
        </ul>
      )}
    </div>
  );
}

/* ── Detail wrapper ────────────────────────────────────────────────────── */

export function TreatmentPlanDetail({ plan, onChanged }: { plan: AdminPlan; onChanged: () => void }) {
  return (
    <div className="space-y-3">
      <CloseOutSection plan={plan} onChanged={onChanged} />
      <div className="grid items-start gap-3 xl:grid-cols-2">
        <FollowUpSection plan={plan} onChanged={onChanged} />
        <div className="space-y-3">
          <RemindersSection plan={plan} />
          <GlucoseSection plan={plan} />
        </div>
      </div>
    </div>
  );
}