"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { DateField } from "@/components/ui/date-field";
import { AppointmentStatusBadge, formatDayDate } from "@/components/account/badges";
import { useLocale } from "@/components/i18n/locale-provider";
import { waLink } from "@/lib/site";
import {
  FaCalendarCheck,
  FaClock,
  FaPencil,
  FaPlus,
  FaTrashCan,
  FaVideo,
  FaWhatsapp,
  FaXmark,
} from "react-icons/fa6";

interface DoctorView {
  _id: string;
  name: string;
  specialty: string;
  specialtyFr?: string;
  photo?: string;
}

interface AppointmentView {
  _id: string;
  doctor: DoctorView;
  forMember?: string;
  date: string;
  time: string;
  mode: "clinic" | "video";
  concern?: string;
  notes?: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  meetingUrl?: string;
  createdAt: string;
}

interface FamilyView {
  _id: string;
  name: string;
  relation: string;
}

function todayISO(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

function doctorLabel(d: DoctorView): string {
  return `${d.name} · ${d.specialtyFr || d.specialty}`;
}

/* ── Booking wizard ───────────────────────────────────────────────────── */

function BookAppointment({
  doctors,
  family,
  initialMode,
  onDone,
  onCancel,
}: {
  doctors: DoctorView[];
  family: FamilyView[];
  initialMode: "clinic" | "video";
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [step, setStep] = useState<1 | 2>(1);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<{
    key: string;
    items: string[] | null;
    error: string | null;
  }>({ key: "", items: null, error: null });
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<"clinic" | "video">(initialMode);
  const [forMember, setForMember] = useState("self");
  const [concern, setConcern] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedDoctor = doctors.find((d) => d._id === doctorId);

  const canCheck = Boolean(doctorId && date && date >= todayISO());
  const queryKey = `${doctorId}|${date}`;
  const slotsUpToDate = canCheck && slots.key === queryKey;

  const selectMode = (m: "clinic" | "video") => {
    setMode(m);
    setStep(2);
  };

  useEffect(() => {
    if (!canCheck) return;
    const key = `${doctorId}|${date}`;
    let active = true;
    fetch(`/api/appointments/availability?doctor=${doctorId}&date=${date}`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setSlots({
          key,
          items: data.error ? null : Array.isArray(data.slots) ? data.slots : [],
          error: data.error || null,
        });
      })
      .catch(() => {
        if (active)
          setSlots({ key, items: null, error: t("dash.appointments.loadAvailability") });
      });
    return () => {
      active = false;
    };
  }, [canCheck, doctorId, date]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!doctorId || !date || !time) {
      toast.error(t("dash.appointments.chooseFirst"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor: doctorId,
          date,
          time,
          mode,
          forMember: forMember === "self" ? "" : forMember,
          concern,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.appointments.bookError"));
      toast.success(data.message || t("dash.appointments.booked"));
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.appointments.bookError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-ink">{t("dash.appointments.bookTitle")}</h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label={t("dash.appointments.closeBooking")}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-line-strong text-muted transition-colors hover:bg-forest-50"
        >
          <FaXmark className="h-4 w-4" aria-hidden />
        </button>
      </div>

      {/* Step 1: doctor + date */}
      <div className="mt-4 space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={t("dash.appointments.stepDoctor")} required>
            <Select
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                setTime("");
              }}
              required
            >
              <option value="">{t("dash.appointments.chooseDoctor")}</option>
              {doctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {doctorLabel(d)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("dash.appointments.stepDate")} required>
            <DateField
              min={todayISO()}
              value={date}
              onChange={(v) => {
                setDate(v);
                setTime("");
              }}
              required
            />
          </Field>
        </div>

        {selectedDoctor ? (
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink">
              <FaCalendarCheck className="h-3.5 w-3.5 text-forest-700" aria-hidden />
              {t("dash.appointments.availableFor", { name: selectedDoctor.name })}
            </p>
            {!canCheck ? (
              <p className="rounded-md border border-line bg-cream px-3 py-2 text-xs text-muted">
                {t("dash.appointments.pickDoctorDate")}
              </p>
            ) : !slotsUpToDate ? (
              <div className="flex h-16 items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
              </div>
            ) : slots.error ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {slots.error}
              </p>
            ) : slots.items && slots.items.length === 0 ? (
              <p className="rounded-md border border-line bg-cream px-3 py-2 text-xs text-muted">
                {t("dash.appointments.noSlots")}
              </p>
            ) : slots.items ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                {slots.items.map((s) => {
                  const active = time === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTime(s)}
                      className={
                        active
                          ? "flex cursor-pointer items-center justify-center rounded-lg bg-forest-800 px-2 py-2 text-xs font-bold text-white"
                          : "flex cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white px-2 py-2 text-xs font-semibold text-ink transition-colors hover:border-forest-400 hover:bg-forest-50"
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Step 2: details */}
        {step === 2 || doctorId ? (
          <div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label={t("dash.appointments.mode")} required>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        value: "clinic",
                        label: t("dash.appointments.modeClinic"),
                        hint: t("dash.appointments.modeClinicHint"),
                      },
                      {
                        value: "video",
                        label: t("dash.appointments.modeVideo"),
                        hint: t("dash.appointments.modeVideoHint"),
                      },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => selectMode(m.value)}
                      className={
                        mode === m.value
                          ? "rounded-lg border border-forest-600 bg-forest-50 p-3 text-left"
                          : "rounded-lg border border-line-strong bg-white p-3 text-left transition-colors hover:border-forest-300"
                      }
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={mode === m.value}
                        onChange={() => selectMode(m.value)}
                      />
                      <span className="block text-sm font-bold text-ink">{m.label}</span>
                      <span className="block text-[11px] text-muted">{m.hint}</span>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label={t("dash.appointments.whoFor")}>
                <Select value={forMember} onChange={(e) => setForMember(e.target.value)}>
                  <option value="self">{t("dash.appointments.myself")}</option>
                  {family.map((f) => (
                    <option key={f._id} value={f.name}>
                      {f.name} ({f.relation})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t("dash.appointments.concern")}>
                <Select value={concern} onChange={(e) => setConcern(e.target.value)}>
                  <option value="">{t("dash.appointments.concernGeneral")}</option>
                  <option>{t("dash.appointments.concernDiabetes")}</option>
                  <option>{t("dash.appointments.concernHypertension")}</option>
                  <option>{t("dash.appointments.concernProstate")}</option>
                  <option>{t("dash.appointments.concernWomen")}</option>
                  <option>{t("dash.appointments.concernGastritis")}</option>
                  <option>{t("dash.appointments.concernLiver")}</option>
                  <option>{t("dash.appointments.concernCancer")}</option>
                </Select>
              </Field>
              <Field label={t("dash.appointments.notes")}>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("dash.appointments.notesPh")}
                  maxLength={500}
                />
              </Field>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting || !slotsUpToDate || !time}>
            {submitting ? t("dash.appointments.booking") : t("dash.appointments.request")}
          </Button>
          {mode === "video" ? (
            <p className="text-xs text-muted">{t("dash.appointments.videoHint")}</p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

/* ── Reschedule inline form ───────────────────────────────────────────── */

function RescheduleForm({
  appointment,
  onDone,
  onCancel,
}: {
  appointment: AppointmentView;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useLocale();
  const [date, setDate] = useState(appointment.date);
  const [slots, setSlots] = useState<{
    key: string;
    items: string[] | null;
    error: string | null;
  }>({ key: "", items: null, error: null });
  const [time, setTime] = useState(appointment.time);
  const [saving, setSaving] = useState(false);

  const canCheck = Boolean(date && date >= todayISO());
  const queryKey = `${appointment.doctor._id}|${date}`;
  const slotsUpToDate = canCheck && slots.key === queryKey;

  useEffect(() => {
    if (!canCheck) return;
    const key = `${appointment.doctor._id}|${date}`;
    let active = true;
    fetch(
      `/api/appointments/availability?doctor=${appointment.doctor._id}&date=${date}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setSlots({
          key,
          items: data.error ? null : Array.isArray(data.slots) ? data.slots : [],
          error: data.error || null,
        });
      })
      .catch(() => {
        if (active)
          setSlots({ key, items: null, error: t("dash.appointments.loadAvailability") });
      });
    return () => {
      active = false;
    };
  }, [canCheck, appointment.doctor._id, date]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!date || !time) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${appointment._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reschedule", date, time }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.appointments.rescheduleError"));
      toast.success(data.message || t("dash.appointments.rescheduled"));
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.appointments.rescheduleError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="mt-3 rounded-md border border-forest-200 bg-forest-50/50 p-4"
    >
      <p className="text-xs font-bold text-ink">{t("dash.appointments.rescheduleTitle")}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label={t("dash.appointments.newDate")}>
          <DateField
            min={todayISO()}
            value={date}
            onChange={(v) => {
              setDate(v);
              setTime("");
            }}
            required
          />
        </Field>
        <Field label={t("dash.appointments.newTime")}>
          {!canCheck ? (
            <Select value={time} onChange={(e) => setTime(e.target.value)} required disabled>
              <option value="">{t("dash.appointments.pickDate")}</option>
            </Select>
          ) : !slotsUpToDate ? (
            <div className="flex h-9 items-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
            </div>
          ) : slots.error ? (
            <p className="text-xs text-amber-700">{slots.error}</p>
          ) : (
            <Select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={!slots.items}
            >
              {!slots.items ? (
                <option value="">{t("dash.appointments.pickDate")}</option>
              ) : slots.items.length === 0 ? (
                <option value="">{t("dash.appointments.noSlotsDay")}</option>
              ) : (
                slots.items.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              )}
            </Select>
          )}
        </Field>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving || !slotsUpToDate || !time}>
          {saving ? t("dash.appointments.saving") : t("dash.appointments.confirmReschedule")}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          {t("dash.appointments.cancel")}
        </button>
      </div>
    </form>
  );
}

/* ── Appointment card ─────────────────────────────────────────────────── */

function AppointmentCard({
  appointment,
  onChanged,
}: {
  appointment: AppointmentView;
  onChanged: () => void;
}) {
  const { t } = useLocale();
  const [rescheduling, setRescheduling] = useState(false);
  const [busy, setBusy] = useState(false);

  const dateObj = new Date(`${appointment.date}T12:00:00`);
  const isPastAppointment =
    appointment.status === "completed" || appointment.date < todayISO();

  async function cancel() {
    if (!window.confirm(t("dash.appointments.cancelPrompt"))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/appointments/${appointment._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.appointments.cancelError"));
      toast.success(data.message || t("dash.appointments.cancelled"));
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.appointments.cancelError"));
    } finally {
      setBusy(false);
    }
  }

  const reminderMessage = t("dash.appointments.reminderMsg", {
    kind:
      appointment.mode === "video"
        ? t("dash.appointments.reminderVideo")
        : t("dash.appointments.reminderAppt"),
    doctor: appointment.doctor.name,
    date: appointment.date,
    time: appointment.time,
    mode:
      appointment.mode === "video"
        ? t("dash.appointments.reminderTele")
        : t("dash.appointments.reminderClinic"),
  });

  return (
    <li className="rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-ink">
              {appointment.doctor?.name || t("dash.appointments.clinic")}
            </p>
            <AppointmentStatusBadge status={appointment.status} />
            {appointment.mode === "video" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
                <FaVideo className="h-2.5 w-2.5" aria-hidden />
                {t("dash.appointments.videoBadge")}
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {appointment.doctor?.specialtyFr || appointment.doctor?.specialty}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-forest-800">
            {formatDayDate(dateObj.toISOString())}
          </p>
          <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-muted">
            <FaClock className="h-3 w-3" aria-hidden />
            {appointment.time}
          </p>
        </div>
      </div>

      {appointment.forMember ? (
        <p className="mt-2 rounded-md bg-forest-50 px-2.5 py-1.5 text-xs text-forest-800">
          {t("dash.appointments.patient")}
          <span className="font-semibold">{appointment.forMember}</span>
        </p>
      ) : null}
      {appointment.concern ? (
        <p className="mt-2 text-xs text-muted">
          <span className="font-semibold text-ink">
            {t("dash.appointments.concernLabel")}
          </span>{" "}
          {appointment.concern}
        </p>
      ) : null}

      {/* Video consultation surface */}
      {appointment.mode === "video" && !isPastAppointment ? (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50/60 p-3">
          <p className="text-xs font-bold text-forest-900">
            {t("dash.appointments.videoConsult")}
          </p>
          {appointment.meetingUrl ? (
            <a
              href={appointment.meetingUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex h-9 items-center gap-2 rounded-lg bg-forest-900 px-3.5 text-xs font-bold text-white transition-colors hover:bg-forest-800"
            >
              <FaVideo className="h-3.5 w-3.5" aria-hidden />
              {t("dash.appointments.join")}
            </a>
          ) : (
            <p className="mt-1.5 text-xs text-muted">
              {t("dash.appointments.joinSoon")}
            </p>
          )}
        </div>
      ) : null}

      {!isPastAppointment ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <a
            href={waLink(reminderMessage)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
          >
            <FaWhatsapp className="h-3 w-3 text-[#25D366]" aria-hidden />
            {t("dash.appointments.whatsappReminder")}
          </a>
          {appointment.status !== "completed" ? (
            <button
              type="button"
              onClick={() => setRescheduling((v) => !v)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-ink transition-colors hover:border-forest-400"
            >
              <FaPencil className="h-3 w-3" aria-hidden />
              {t("dash.appointments.reschedule")}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void cancel()}
            disabled={busy}
            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
          >
            <FaTrashCan className="h-3 w-3" aria-hidden />
            {t("dash.appointments.cancelBtn")}
          </button>
        </div>
      ) : null}

      {rescheduling ? (
        <RescheduleForm
          appointment={appointment}
          onDone={() => {
            setRescheduling(false);
            onChanged();
          }}
          onCancel={() => setRescheduling(false)}
        />
      ) : null}
    </li>
  );
}

/* ── Tab shell ────────────────────────────────────────────────────────── */

export function AppointmentsTab() {
  const { t } = useLocale();
  const [appointments, setAppointments] = useState<AppointmentView[] | null>(null);
  const [doctors, setDoctors] = useState<DoctorView[]>([]);
  const [family, setFamily] = useState<FamilyView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showBook, setShowBook] = useState(false);
  const [bookMode, setBookMode] = useState<"clinic" | "video">("clinic");
  const [view, setView] = useState<"all" | "upcoming" | "past">("all");

  const load = useCallback(() => {
    let active = true;
    fetch("/api/appointments", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      })
      .catch(() => {
        if (active) setError(t("dash.appointments.loadError"));
      });
    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    const first = load();
    let second: (() => void) | undefined;
    fetch("/api/doctors", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.doctors)) setDoctors(data.doctors);
      })
      .catch(() => undefined);
    fetch("/api/family-members", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.members))
          setFamily(data.members.map((m: FamilyView) => ({ _id: m._id, name: m.name, relation: m.relation })));
      })
      .catch(() => undefined);
    return () => {
      first();
      second?.();
    };
  }, [load]);

  const grouped = useMemo(() => {
    const list = appointments || [];
    const sorted = [...list].sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
    const today = todayISO();
    const active = sorted.filter(
      (a) =>
        a.status !== "cancelled" &&
        a.status !== "completed" &&
        a.date >= today
    );
    const past = sorted.filter((a) => a.status === "completed" || a.date < today);
    return { active, past };
  }, [appointments]);

  const shown =
    view === "all"
      ? [...grouped.active, ...grouped.past]
      : view === "upcoming"
        ? grouped.active
        : grouped.past;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          {(
            [
              { value: "all", label: t("dash.appointments.viewAll") },
              { value: "upcoming", label: t("dash.appointments.viewUpcoming") },
              { value: "past", label: t("dash.appointments.viewPast") },
            ] as const
          ).map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => setView(v.value)}
              className={
                view === v.value
                  ? "rounded-md bg-forest-950 px-3 py-1.5 text-xs font-bold text-white"
                  : "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
              }
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setBookMode("video"); setShowBook(true); }}>
            <FaVideo className="h-3.5 w-3.5" aria-hidden />
            {t("dash.appointments.bookVideo")}
          </Button>
          <Button size="sm" onClick={() => { setBookMode("clinic"); setShowBook(true); }}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            {t("dash.appointments.bookBtn")}
          </Button>
        </div>
      </div>

      {showBook ? (
        <BookAppointment
          doctors={doctors}
          family={family}
          initialMode={bookMode}
          onDone={() => {
            setShowBook(false);
            setView("all");
            load();
          }}
          onCancel={() => setShowBook(false)}
        />
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!appointments ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {appointments && shown.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaCalendarCheck className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">{t("dash.appointments.empty")}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button size="sm" onClick={() => setShowBook(true)}>
              <FaPlus className="h-3.5 w-3.5" aria-hidden />
              {t("dash.appointments.bookFirst")}
            </Button>
          </div>
        </div>
      ) : null}

      {appointments && shown.length > 0 ? (
        <ul className="space-y-3">
          {shown.map((a) => (
            <AppointmentCard
              key={a._id}
              appointment={a}
              onChanged={load}
            />
          ))}
        </ul>
      ) : null}

      {doctors.length === 0 && !showBook ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t("dash.appointments.noBooking")}
        </p>
      ) : null}
    </div>
  );
}