"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { AppointmentStatusBadge } from "@/components/account/badges";
import {
  FaCalendarCheck,
  FaCheck,
  FaLink,
  FaVideo,
  FaXmark,
} from "react-icons/fa6";

interface AppointmentAdminView {
  _id: string;
  user: { _id: string; name?: string; email?: string; phone?: string } | null;
  doctor: { _id: string; name?: string; specialty?: string } | null;
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

type Filter = "all" | "pending" | "confirmed" | "completed" | "cancelled";

function AppointmentCard({
  a,
  onChanged,
}: {
  a: AppointmentAdminView;
  onChanged: () => void;
}) {
  const [meetingUrl, setMeetingUrl] = useState(a.meetingUrl || "");
  const [busyAction, setBusyAction] = useState<string | null>(null);

  async function update(body: Record<string, unknown>) {
    setBusyAction("saving");
    try {
      const res = await fetch(`/api/admin/appointments/${a._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      onChanged();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setBusyAction(null);
    }
  }

  const isVideo = a.mode === "video";

  return (
    <li className="rounded-lg border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">
            {a.user?.name || "Unknown patient"}
            {a.user?.email ? <span className="ml-2 font-normal text-muted">{a.user.email}</span> : null}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {a.doctor?.name || "Doctor"} · {a.doctor?.specialty || ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {isVideo ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-800">
              <FaVideo className="h-2.5 w-2.5" aria-hidden />
              Video
            </span>
          ) : null}
          {a.forMember ? (
            <span className="inline-flex items-center rounded-full border border-forest-300 bg-forest-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest-800">
              For: {a.forMember}
            </span>
          ) : null}
          <AppointmentStatusBadge status={a.status} />
        </div>
      </div>

      <p className="mt-2 text-sm text-forest-800">
        <FaCalendarCheck className="mr-1 inline h-3.5 w-3.5" aria-hidden />
        {a.date} at {a.time}
      </p>
      {a.concern ? (
        <p className="mt-1.5 text-xs text-muted">
          <span className="font-semibold text-ink">Concern:</span> {a.concern}
        </p>
      ) : null}
      {a.user?.phone ? (
        <p className="mt-1.5 text-xs text-muted">📞 {a.user.phone}</p>
      ) : null}

      {a.status !== "cancelled" && a.status !== "completed" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {a.status === "pending" ? (
            <Button
              size="sm"
              disabled={busyAction !== null}
              onClick={() => void update({ status: "confirmed" })}
            >
              <FaCheck className="h-3 w-3" aria-hidden />
              Confirm
            </Button>
          ) : null}
          {a.status === "confirmed" ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={busyAction !== null}
              onClick={() => void update({ status: "completed" })}
            >
              Mark complete
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            disabled={busyAction !== null}
            onClick={() => {
              if (window.confirm("Cancel this appointment?")) void update({ status: "cancelled" });
            }}
          >
            <FaXmark className="h-3 w-3" aria-hidden />
            Cancel
          </Button>
        </div>
      ) : null}

      {isVideo && a.status !== "cancelled" && a.status !== "completed" ? (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50/60 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold text-forest-900">
            <FaLink className="h-3 w-3" aria-hidden />
            Consultation link (Google Meet, Whereby, WhatsApp video…)
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/…"
              className="max-w-md bg-white"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busyAction !== null || meetingUrl.trim() === a.meetingUrl}
              onClick={() => void update({ meetingUrl: meetingUrl.trim() })}
            >
              {busyAction === "saving" ? "Saving..." : "Save link"}
            </Button>
          </div>
          {a.meetingUrl ? (
            <p className="mt-2 break-all text-xs text-muted">
              Current: <a className="text-forest-800 underline" href={a.meetingUrl} target="_blank" rel="noreferrer">{a.meetingUrl}</a>
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function AdminAppointmentsTab() {
  const [appointments, setAppointments] = useState<AppointmentAdminView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const notify = (m: string) => {
    setNote(m);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 3000);
  };

  const load = (f: Filter) => {
    let active = true;
    fetch(`/api/admin/appointments?status=${f}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
      })
      .catch(() => {
        if (active) setError("Could not load appointments.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load(filter);
  }, [filter]);

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "Upcoming & active" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? "rounded-full bg-forest-950 px-3 py-1.5 text-xs font-bold text-white"
                : "cursor-pointer rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-forest-400 hover:text-ink"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {note ? (
        <p className="rounded-md border border-forest-300 bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!appointments ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {appointments && appointments.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaCalendarCheck className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No appointments in this view.</p>
        </div>
      ) : null}

      {appointments && appointments.length > 0 ? (
        <ul className="space-y-3">
          {appointments.map((a) => (
            <AppointmentCard
              key={a._id}
              a={a}
              onChanged={() => {
                load(filter);
                notify("Appointment updated.");
              }}
            />
          ))}
        </ul>
      ) : null}

      {appointments && appointments.length > 0 ? (
        <p className="text-xs text-muted">
          Confirming a video appointment sends the patient their join link (when set) in Messages.
        </p>
      ) : null}
    </div>
  );
}