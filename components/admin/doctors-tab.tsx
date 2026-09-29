"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { validateImageFile } from "@/lib/image-upload";
import {
  FaPencil,
  FaPlus,
  FaTrashCan,
  FaXmark,
  FaCloudArrowUp,
  FaImage,
} from "react-icons/fa6";

interface ScheduleRow {
  day: number;
  start: string;
  end: string;
  slotMinutes: number;
}

interface DoctorView {
  _id: string;
  name: string;
  specialty: string;
  specialtyFr?: string;
  bio?: string;
  bioFr?: string;
  photo?: string;
  phone?: string;
  schedule: ScheduleRow[];
  active: boolean;
  sortOrder: number;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyDoctor = {
  name: "",
  specialty: "",
  specialtyFr: "",
  bio: "",
  bioFr: "",
  photo: "",
  phone: "",
  sortOrder: 0,
};

function DoctorForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: DoctorView | null;
  onSaved: (doctor: DoctorView) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          specialty: initial.specialty,
          specialtyFr: initial.specialtyFr || "",
          bio: initial.bio || "",
          bioFr: initial.bioFr || "",
          photo: initial.photo || "",
          phone: initial.phone || "",
          sortOrder: initial.sortOrder,
        }
      : emptyDoctor
  );
  const [schedule, setSchedule] = useState<ScheduleRow[]>(
    initial?.schedule?.length ? initial.schedule : []
  );
  const [active, setActive] = useState(initial ? initial.active : true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  async function uploadPhoto(file: File) {
    const validationError = validateImageFile(file);
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      if (validationError) throw new Error(validationError);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: string };
      if (!res.ok || !data.secure_url) throw new Error(data.error || "Upload failed.");
      set("photo", data.secure_url);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed. Paste an image URL instead.");
    } finally {
      setUploadingPhoto(false);
      if (photoFileRef.current) photoFileRef.current.value = "";
    }
  }

  function set<K extends keyof typeof form>(key: K, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateScheduleRow(index: number, patch: Partial<ScheduleRow>) {
    setSchedule((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      window.alert("Please provide the staff member's name.");
      return;
    }
    if (form.specialty.trim().length < 2) {
      window.alert("Please provide the specialty.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        active,
        schedule,
      };
      const res = await fetch(initial ? `/api/admin/doctors/${initial._id}` : "/api/admin/doctors", {
        method: initial ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the staff member.");
      onSaved(data.doctor as DoctorView);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not save the staff member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-forest-200 bg-forest-50/50 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">{initial ? "Edit staff member" : "Add a staff member"}</p>
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
        <Field label="Name" required>
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={100} />
        </Field>
        <Field label="Specialty" required>
          <Input required value={form.specialty} onChange={(e) => set("specialty", e.target.value)} maxLength={100} />
        </Field>
        <Field label="Specialty (French)">
          <Input value={form.specialtyFr} onChange={(e) => set("specialtyFr", e.target.value)} maxLength={100} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} maxLength={30} />
        </Field>
        <Field label="Photo URL" hint="Or upload a photo from your device (JPG, PNG, WebP, AVIF or GIF, under 5 MB).">
          <div className="flex gap-2">
            <Input value={form.photo} onChange={(e) => set("photo", e.target.value)} placeholder="https://..." />
            <Button
              variant="outline"
              size="md"
              type="button"
              disabled={uploadingPhoto}
              onClick={() => photoFileRef.current?.click()}
            >
              {uploadingPhoto ? (
                <FaCloudArrowUp className="h-4 w-4 animate-bounce" aria-hidden />
              ) : (
                <FaImage className="h-4 w-4" aria-hidden />
              )}
              {uploadingPhoto ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={photoFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
            />
          </div>
          {photoError ? <p className="mt-1 text-xs text-red-600">{photoError}</p> : null}
        </Field>
        <Field label="Sort order">
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Bio (English)">
            <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Bio (French)">
            <Textarea rows={3} value={form.bioFr} onChange={(e) => set("bioFr", e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink">Weekly availability</p>
        <p className="mt-1 text-xs text-muted">
          Slots are generated automatically for each day. Leave empty on days the staff member is off.
        </p>
        <div className="mt-3 space-y-2">
          {schedule.map((row, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2">
              <div className="w-24">
                <Field label="Day">
                  <Select
                    value={row.day}
                    onChange={(e) => updateScheduleRow(index, { day: Number(e.target.value) })}
                  >
                    {DAY_LABELS.map((label, day) => (
                      <option key={day} value={day}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="w-24">
                <Field label="Start">
                  <Input
                    type="time"
                    value={row.start}
                    onChange={(e) => updateScheduleRow(index, { start: e.target.value })}
                  />
                </Field>
              </div>
              <div className="w-24">
                <Field label="End">
                  <Input
                    type="time"
                    value={row.end}
                    onChange={(e) => updateScheduleRow(index, { end: e.target.value })}
                  />
                </Field>
              </div>
              <div className="w-28">
                <Field label="Slot (min)">
                  <Input
                    type="number"
                    min={15}
                    max={120}
                    step={15}
                    value={row.slotMinutes}
                    onChange={(e) =>
                      updateScheduleRow(index, { slotMinutes: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setSchedule((rows) => rows.filter((_, i) => i !== index))}
                className="mb-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                aria-label="Remove schedule row"
              >
                <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setSchedule((rows) => [...rows, { day: 1, start: "08:00", end: "16:00", slotMinutes: 30 }])
            }
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-forest-800 hover:border-forest-400"
          >
            <FaPlus className="h-3 w-3" aria-hidden />
            Add day
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 accent-forest-700"
          />
          Accepting bookings
        </label>
        <div className="flex flex-1 items-center justify-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : initial ? "Save changes" : "Add staff member"}
          </Button>
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted hover:text-ink">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

export function DoctorsTab() {
  const [doctors, setDoctors] = useState<DoctorView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setNote(message);
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => setNote(null), 3000);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/doctors", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setDoctors(Array.isArray(data.doctors) ? data.doctors : []);
      })
      .catch(() => {
        if (active) setError("Could not load staff.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  async function toggleActive(doctor: DoctorView) {
    try {
      const res = await fetch(`/api/admin/doctors/${doctor._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !doctor.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setDoctors((prev) =>
        prev === null ? prev : prev.map((d) => (d._id === doctor._id ? { ...d, active: !doctor.active } : d))
      );
      notify(doctor.active ? "Staff member hidden from booking." : "Staff member is now accepting bookings.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function remove(doctor: DoctorView) {
    if (!window.confirm(`Delete "${doctor.name}" permanently? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/doctors/${doctor._id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the staff member.");
      setDoctors((prev) => (prev === null ? prev : prev.filter((d) => d._id !== doctor._id)));
      notify(data.message || "Staff member deleted.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete the staff member.");
    }
  }

  const editingDoctor = editingId ? doctors?.find((d) => d._id === editingId) || null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Staff members appear on the booking screen with their weekly availability.
        </p>
        {!showForm && !editingDoctor ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            Add staff member
          </Button>
        ) : null}
      </div>

      {note ? (
        <p className="rounded-md border border-forest-300 bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">
          {note}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {showForm ? (
        <DoctorForm
          initial={null}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {editingDoctor ? (
        <DoctorForm
          initial={editingDoctor}
          onSaved={() => {
            setEditingId(null);
            load();
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : null}

      {!doctors ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {doctors && doctors.length === 0 && !showForm ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <p className="text-sm text-muted">
            No staff members yet. Add your clinic&apos;s team so patients can book appointments.
          </p>
        </div>
      ) : null}

      {doctors && doctors.length > 0 ? (
        <ul className="space-y-2.5">
          {doctors.map((d) => {
            const workingDays = new Set(d.schedule.map((s) => s.day)).size;
            return (
              <li
                key={d._id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3.5 sm:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-950 text-xs font-bold text-gold-300">
                  {d.name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((w) => w[0]?.toUpperCase())
                    .join("") || "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">
                    {d.name}
                    {!d.active ? (
                      <span className="ml-2 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
                        Hidden
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {d.specialty}
                    {workingDays > 0 ? ` · available ${workingDays} day${workingDays === 1 ? "" : "s"}/week` : " · no schedule set"}
                  </span>
                </span>
                <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={() => void toggleActive(d)}
                    className="h-4 w-4 accent-forest-700"
                  />
                  Active
                </label>
                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingId(d._id)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted transition-colors hover:border-forest-400 hover:text-forest-800"
                    aria-label={`Edit ${d.name}`}
                  >
                    <FaPencil className="h-3 w-3" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(d)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                    aria-label={`Hide ${d.name}`}
                  >
                    <FaTrashCan className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}