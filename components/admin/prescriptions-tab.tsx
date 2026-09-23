"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { formatDate, PrescriptionStatusBadge } from "@/components/account/badges";
import {
  FaChevronDown,
  FaChevronUp,
  FaPencil,
  FaPills,
  FaPlus,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";

interface PatientOption {
  id: string;
  name: string;
  email: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

interface PrescriptionAdminView {
  _id: string;
  user: { _id: string; name?: string; email?: string };
  forMember?: string;
  doctorName?: string;
  issuedDate: string;
  expiresAt?: string;
  status: "active" | "expired";
  medications: Medication[];
  notes?: string;
}

const emptyMed = { name: "", dosage: "", frequency: "", duration: "", instructions: "" };

function MedRow({
  med,
  index,
  onChange,
  onRemove,
}: {
  med: Medication;
  index: number;
  onChange: (index: number, patch: Partial<Medication>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-3">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Medication" required>
          <Input value={med.name} onChange={(e) => onChange(index, { name: e.target.value })} placeholder="e.g. S19 Diabecare" maxLength={120} required />
        </Field>
        <Field label="Dosage" required>
          <Input value={med.dosage} onChange={(e) => onChange(index, { dosage: e.target.value })} placeholder="e.g. 10 ml" maxLength={120} required />
        </Field>
        <Field label="Frequency" required>
          <Input value={med.frequency} onChange={(e) => onChange(index, { frequency: e.target.value })} placeholder="e.g. 2x daily after meals" maxLength={120} required />
        </Field>
        <Field label="Duration">
          <Input value={med.duration || ""} onChange={(e) => onChange(index, { duration: e.target.value })} placeholder="e.g. 14 days" maxLength={120} />
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          <Field label="Instructions">
            <Input value={med.instructions || ""} onChange={(e) => onChange(index, { instructions: e.target.value })} placeholder="e.g. Take with warm water; avoid alcohol" maxLength={500} />
          </Field>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
        >
          <FaTrashCan className="h-3 w-3" aria-hidden />
          Remove medication
        </button>
      </div>
    </div>
  );
}

function PrescriptionForm({
  initial,
  patients,
  onSaved,
  onCancel,
}: {
  initial: PrescriptionAdminView | null;
  patients: PatientOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState(initial ? String(initial.user._id) : patients[0]?.id || "");
  const [forMember, setForMember] = useState(initial?.forMember || "");
  const [doctorName, setDoctorName] = useState(initial?.doctorName || "");
  const [issuedDate, setIssuedDate] = useState(
    initial ? initial.issuedDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : "");
  const [status, setStatus] = useState<"active" | "expired">(initial?.status || "active");
  const [medications, setMedications] = useState<Medication[]>(
    initial?.medications?.length ? initial.medications : [{ ...emptyMed }]
  );
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  function setMed(index: number, patch: Partial<Medication>) {
    setMedications((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      window.alert("Please choose a patient.");
      return;
    }
    const cleaned = medications.filter((m) => m.name.trim() && m.dosage.trim() && m.frequency.trim());
    if (cleaned.length === 0) {
      window.alert("Add at least one medication with name, dosage and frequency.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user: userId,
        forMember: forMember.trim() || undefined,
        doctorName: doctorName.trim() || undefined,
        issuedDate: `${issuedDate}T12:00:00`,
        expiresAt: expiresAt ? `${expiresAt}T12:00:00` : undefined,
        status,
        medications: cleaned,
        notes: notes.trim() || undefined,
      };
      const res = await fetch(
        initial ? `/api/admin/prescriptions/${initial._id}` : "/api/admin/prescriptions",
        {
          method: initial ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the prescription.");
      onSaved();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not save the prescription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">{initial ? "Edit prescription" : "Issue a prescription"}</p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
        >
          <FaXmark className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Patient" required>
          <Select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Issued date" required>
          <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} required />
        </Field>
        <Field label="Valid until">
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </Field>
        <Field label="Doctor / clinician">
          <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} maxLength={100} placeholder="e.g. Dr. Nguema" />
        </Field>
        <Field label="For family member">
          <Input value={forMember} onChange={(e) => setForMember(e.target.value)} maxLength={80} placeholder="Leave empty for the account holder" />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as "active" | "expired")}>
            <option value="active">Active (current treatment)</option>
            <option value="expired">Past / expired</option>
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink">Medications</p>
        <div className="mt-3 space-y-3">
          {medications.map((m, index) => (
            <MedRow key={index} med={m} index={index} onChange={setMed} onRemove={(i) => setMedications((list) => list.filter((_, x) => x !== i))} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setMedications((list) => [...list, { ...emptyMed }])}
          className="mt-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-forest-800 hover:border-forest-400"
        >
          <FaPlus className="h-3 w-3" aria-hidden />
          Add medication
        </button>
      </div>

      <div className="mt-4">
        <Field label="Notes (optional)">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dosing guidance, warnings, follow-up plan..." maxLength={1000} />
        </Field>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Issue prescription"}
        </Button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function AdminPrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionAdminView[] | null>(null);
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
    noteTimer.current = setTimeout(() => setNote(null), 3000);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/prescriptions", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      })
      .catch(() => {
        if (active) setError("Could not load prescriptions.");
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

  async function removePrescription(p: PrescriptionAdminView) {
    if (!window.confirm("Delete this prescription? This removes it from the patient's record.")) return;
    try {
      const res = await fetch(`/api/admin/prescriptions/${p._id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the prescription.");
      load();
      notify(data.message || "Prescription deleted.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete the prescription.");
    }
  }

  const editing = prescriptions?.find((p) => p._id === editingId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Issue treatment plans with dosage instructions. Active ones appear under the patient&apos;s &quot;Current&quot; tab.
        </p>
        {!showForm && !editing ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            Issue prescription
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
        <PrescriptionForm
          initial={editing}
          patients={patients}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            load();
            notify("Prescription saved.");
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      ) : null}

      {showForm && patients.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No patient accounts yet - ask a patient to sign up, then issue their prescriptions here.
        </p>
      ) : null}

      {!prescriptions ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {prescriptions && prescriptions.length === 0 && !showForm ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaPills className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No prescriptions yet. Issue the first treatment plan.</p>
        </div>
      ) : null}

      {prescriptions && prescriptions.length > 0 ? (
        <ul className="space-y-2.5">
          {prescriptions.map((p) => (
            <div key={p._id} className="space-y-2">
              <div className="overflow-hidden rounded-lg border border-line bg-white">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === p._id ? null : p._id)}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest-50/50 sm:px-5"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${p.status === "active" ? "border-forest-300 bg-forest-50 text-forest-800" : "border-line-strong bg-cream text-muted"}`}>
                    <FaPills className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">
                      {p.user?.name || "Unknown"} · {p.medications.map((m) => m.name).join(" + ")}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      Issued {formatDate(p.issuedDate)} · {p.medications.length} medication{p.medications.length === 1 ? "" : "s"}
                      {p.forMember ? ` · ${p.forMember}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <PrescriptionStatusBadge status={p.status} />
                    {expandedId === p._id ? <FaChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden /> : <FaChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />}
                  </span>
                </button>
                {expandedId === p._id ? (
                  <div className="border-t border-forest-100 bg-cream/60 px-5 py-4">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-forest-200 text-left text-[10px] font-bold uppercase tracking-wide text-muted">
                          <th className="py-1.5 pr-3">Medication</th>
                          <th className="py-1.5 pr-3">Dosage</th>
                          <th className="py-1.5 pr-3">Frequency</th>
                          <th className="py-1.5">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-forest-100">
                        {p.medications.map((m, i) => (
                          <tr key={i}>
                            <td className="py-2 pr-3 align-top font-bold text-ink">{m.name}</td>
                            <td className="py-2 pr-3 align-top text-muted">{m.dosage}</td>
                            <td className="py-2 pr-3 align-top text-muted">{m.frequency}</td>
                            <td className="py-2 align-top text-muted">{m.duration || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {p.medications.some((m) => m.instructions) ? (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Directions</p>
                        <ul className="mt-1.5 space-y-1 text-sm text-muted">
                          {p.medications.map((m, i) =>
                            m.instructions ? (
                              <li key={i}>
                                <span className="font-semibold text-ink">{m.name}:</span> {m.instructions}
                              </li>
                            ) : null
                          )}
                        </ul>
                      </div>
                    ) : null}
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
                        onClick={() => void removePrescription(p)}
                        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                      >
                        <FaTrashCan className="h-3 w-3" aria-hidden />
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </ul>
      ) : null}
    </div>
  );
}