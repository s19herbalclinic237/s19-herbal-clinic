"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { formatDate, TreatmentPhaseBadge } from "@/components/account/badges";
import { localDateString } from "@/lib/dates";
import { TreatmentPlanDetail } from "@/components/admin/treatment-plan-detail";
import {
  FaCalendarDays,
  FaChevronDown,
  FaChevronUp,
  FaPencil,
  FaPlus,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";

interface PatientOption {
  id: string;
  name: string;
  email: string;
  familyMembers?: { id: string; name: string; relation?: string }[];
}

type Phase = "active" | "expired" | "scheduled" | "completed";

interface TreatmentPlanAdminView {
  _id: string;
  user: { _id: string; name?: string; email?: string };
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

export function TreatmentPlansTab() {
  const [plans, setPlans] = useState<TreatmentPlanAdminView[] | null>(null);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const notify = (m: string) => {
    setNote(m);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 4000);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/treatment-plans", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setPlans(Array.isArray(data.plans) ? data.plans : []);
      })
      .catch(() => {
        if (active) setError("Could not load treatment plans.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    const first = load();
    let second: (() => void) | undefined;
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.users)) setPatients(data.users);
      })
      .catch(() => undefined);
    return () => {
      first();
      second?.();
    };
  }, []);

  async function removePlan(p: TreatmentPlanAdminView) {
    if (
      !window.confirm(
        "Delete this treatment plan? It will be removed from the patient's portal (the portal keeps no history of it)."
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/treatment-plans/${p._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the treatment plan.");
      load();
      notify(data.message || "Treatment plan removed.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete the treatment plan.");
    }
  }

  const editing = plans?.find((p) => p._id === editingId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Track each patient&apos;s personalized treatment timeline - dates, live phase, progress
          notes, reminders &amp; installments, glucose monitoring and the end-of-treatment review.
        </p>
        {!showForm && !editing ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            New treatment plan
          </Button>
        ) : null}
      </div>

      {note ? (
        <p className="rounded-md border border-forest-300 bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">{note}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {(showForm || editing) && patients.length > 0 ? (
        <TreatmentPlanForm
          initial={editing}
          patients={patients}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            load();
            notify("Treatment plan saved - patient notified by email and dashboard message.");
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      ) : null}

      {showForm && patients.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No patient accounts yet - ask a patient to sign up, then create their treatment plan here.
        </p>
      ) : null}

      {!plans ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {plans && plans.length === 0 && !showForm ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaCalendarDays className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            No treatment plans yet. Create the first personalized plan for a patient.
          </p>
        </div>
      ) : null}

      {plans && plans.length > 0 ? (
        <ul className="space-y-2.5">
          {plans.map((p) => (
            <li key={p._id} className="space-y-2">
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest-50/50 sm:px-5"
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                      p.phase === "active"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : p.phase === "scheduled"
                          ? "border-sky-300 bg-sky-50 text-sky-700"
                          : p.phase === "completed"
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-amber-300 bg-amber-50 text-amber-700"
                    }`}
                  >
                    <FaCalendarDays className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">
                      {p.user?.name || "Unknown"} · {p.title}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {formatDate(p.startDate)} → {formatDate(p.endDate)}
                      {p.forMember ? ` · ${p.forMember}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <TreatmentPhaseBadge phase={p.phase} />
                    {expandedId === p._id ? (
                      <FaChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden />
                    ) : (
                      <FaChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />
                    )}
                  </span>
                </button>
                {expandedId === p._id ? (
                  <div className="border-t border-forest-100 bg-cream/60 px-5 py-4">
                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Starts</dt>
                        <dd className="mt-0.5 font-semibold text-ink">{formatDate(p.startDate)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Ends</dt>
                        <dd className="mt-0.5 font-semibold text-ink">{formatDate(p.endDate)}</dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Duration</dt>
                        <dd className="mt-0.5 font-semibold text-ink">
                          {p.months} {p.months === 1 ? "month" : "months"} · {p.days} day{p.days === 1 ? "" : "s"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Current position</dt>
                        <dd className="mt-0.5 font-semibold text-ink">
                          {p.phase === "active" && p.month
                            ? `Month ${p.month} of ${p.months} · ${p.daysLeft} day${p.daysLeft === 1 ? "" : "s"} left`
                            : p.phase === "completed"
                              ? "Closed after final review"
                              : p.phase === "expired"
                                ? "Period ended - final review pending"
                                : "Not started yet"}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Patient</dt>
                        <dd className="mt-0.5 font-semibold text-ink">{p.forMember || p.user?.name || "Account holder"}</dd>
                      </div>
                      {p.program ? (
                        <div className="flex justify-between gap-3 sm:block">
                          <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Program</dt>
                          <dd className="mt-0.5 font-semibold text-ink">{p.program}</dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-3 sm:block">
                        <dt className="text-[10px] font-bold uppercase tracking-wide text-muted">Status</dt>
                        <dd className="mt-0.5">
                          <TreatmentPhaseBadge phase={p.phase} />
                        </dd>
                      </div>
                    </dl>
                    {p.notes ? (
                      <p className="mt-3 text-sm text-muted">
                        <span className="font-semibold text-ink">Notes:</span> {p.notes}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(p._id)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
                      >
                        <FaPencil className="h-3 w-3" aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removePlan(p)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        <FaTrashCan className="h-3 w-3" aria-hidden />
                        Delete
                      </button>
                    </div>
                    <div className="mt-4 border-t border-forest-100 pt-4">
                      <TreatmentPlanDetail plan={p} onChanged={load} />
                    </div>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TreatmentPlanForm({
  initial,
  patients,
  onSaved,
  onCancel,
}: {
  initial: TreatmentPlanAdminView | null;
  patients: PatientOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState(
    initial?.user?._id ? String(initial.user._id) : patients[0]?.id || ""
  );
  const [forMember, setForMember] = useState(initial?.forMember || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [program, setProgram] = useState(initial?.program || "");
  const [startDate, setStartDate] = useState(
    initial ? initial.startDate.slice(0, 10) : localDateString()
  );
  const [endDate, setEndDate] = useState(
    initial ? initial.endDate.slice(0, 10) : ""
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);
  const [glucoseMonitoring, setGlucoseMonitoring] = useState(initial?.monitoring?.glucose || false);
  const [monitoring, setMonitoring] = useState({
    fastingStart: initial?.monitoring?.fastingStart || "06:00",
    fastingEnd: initial?.monitoring?.fastingEnd || "10:00",
    postLunchStart: initial?.monitoring?.postLunchStart || "14:00",
    postLunchEnd: initial?.monitoring?.postLunchEnd || "16:00",
  });

  const selectedPatient = patients.find((p) => p.id === userId);

  function quickDuration(days: number) {
    const start = new Date(`${startDate}T12:00:00`);
    if (Number.isNaN(start.getTime())) return;
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    setEndDate(localDateString(end));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      window.alert("Please choose a patient.");
      return;
    }
    if (!title.trim()) {
      window.alert("Give the treatment plan a name.");
      return;
    }
    const start = new Date(`${startDate}T12:00:00`);
    const end = new Date(`${endDate}T12:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      window.alert("Enter valid start and end dates.");
      return;
    }
    if (end.getTime() <= start.getTime()) {
      window.alert("The end date must be after the start date.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user: userId,
        forMember: forMember.trim() || undefined,
        title: title.trim(),
        program: program.trim() || undefined,
        startDate: `${startDate}T12:00:00`,
        endDate: `${endDate}T12:00:00`,
        notes: notes.trim() || undefined,
        monitoring: {
          glucose: glucoseMonitoring,
          ...monitoring,
        },
      };
      const res = await fetch(
        initial ? `/api/admin/treatment-plans/${initial._id}` : "/api/admin/treatment-plans",
        {
          method: initial ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the treatment plan.");
      onSaved();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not save the treatment plan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">
          {initial ? "Edit treatment plan" : "Create a treatment plan"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
        >
          <FaXmark className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Patient" required>
          <Select
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setForMember("");
            }}
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="For family member">
          <Select
            value={forMember}
            onChange={(e) => setForMember(e.target.value)}
            disabled={(selectedPatient?.familyMembers?.length || 0) === 0 && !forMember}
          >
            <option value="">
              {selectedPatient ? `Account holder · ${selectedPatient.name}` : "Account holder"}
            </option>
            {selectedPatient?.familyMembers?.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
                {m.relation ? ` (${m.relation})` : ""}
              </option>
            ))}
            {forMember && !selectedPatient?.familyMembers?.some((m) => m.name === forMember) ? (
              <option value={forMember}>{forMember} (family member)</option>
            ) : null}
          </Select>
        </Field>

        <div className="sm:col-span-2">
          <Field label="Plan name" required>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. Diabetes & Metabolic Treatment Plan'
              maxLength={200}
              required
            />
          </Field>
        </div>
        <Field label="Program (optional)">
          <Input
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g. diabetes-metabolic"
            maxLength={200}
          />
        </Field>
        <div />
        <Field label="Start date" required>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </Field>
        <Field label="End date" required>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </Field>

        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink">Quick durations</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: "3 months", days: 90 },
              { label: "6 months", days: 180 },
              { label: "9 months", days: 270 },
              { label: "12 months", days: 365 },
            ].map((q) => (
              <button
                key={q.days}
                type="button"
                onClick={() => quickDuration(q.days)}
                className="cursor-pointer rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2 rounded-xl border border-sky-200 bg-sky-50/50 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={glucoseMonitoring}
              onChange={(e) => setGlucoseMonitoring(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-sky-600"
            />
            <span className="text-sm font-bold text-ink">
              Require daily glucose monitoring
              <span className="mt-0.5 block text-xs font-normal text-muted">
                Patients get fasting + post-lunch logging with optional meter-photo upload; the team
                is alerted about missed and concerning readings.
              </span>
            </span>
          </label>
          {glucoseMonitoring ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              {(
                [
                  ["fastingStart", "Fasting start"],
                  ["fastingEnd", "Fasting end"],
                  ["postLunchStart", "Post-lunch start"],
                  ["postLunchEnd", "Post-lunch end"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="space-y-1.5">
                  <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink">{label}</span>
                  <Input
                    type="time"
                    value={monitoring[key]}
                    onChange={(e) => setMonitoring((m) => ({ ...m, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Field label="Notes (optional)">
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Follow-up plan, goals, warnings..."
              maxLength={2000}
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Create plan"}
        </Button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}