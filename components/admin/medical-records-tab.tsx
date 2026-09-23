"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { formatDate, RecordTypeClass, RecordTypeLabel } from "@/components/account/badges";
import {
  FaChevronDown,
  FaChevronUp,
  FaFileMedical,
  FaLink,
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

interface Attachment {
  name: string;
  url: string;
}

interface RecordAdminView {
  _id: string;
  user: { _id: string; name?: string; email?: string };
  forMember?: string;
  type: string;
  title: string;
  date: string;
  doctorName?: string;
  diagnosis?: string;
  notes?: string;
  results?: string;
  attachments: Attachment[];
}

const emptyAttach = { name: "", url: "" };

function RecordForm({
  initial,
  patients,
  onSaved,
  onCancel,
}: {
  initial: RecordAdminView | null;
  patients: PatientOption[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [userId, setUserId] = useState(initial ? String(initial.user._id) : patients[0]?.id || "");
  const [forMember, setForMember] = useState(initial?.forMember || "");
  const [type, setType] = useState(initial?.type || "visit");
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(
    initial ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [doctorName, setDoctorName] = useState(initial?.doctorName || "");
  const [diagnosis, setDiagnosis] = useState(initial?.diagnosis || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [results, setResults] = useState(initial?.results || "");
  const [attachments, setAttachments] = useState<Attachment[]>(
    initial?.attachments?.length ? initial.attachments : []
  );
  const [saving, setSaving] = useState(false);

  const selectedPatient = patients.find((p) => p.id === userId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!userId) {
      window.alert("Please choose a patient.");
      return;
    }
    if (title.trim().length < 2) {
      window.alert("Please provide a record title.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user: userId,
        forMember: forMember.trim() || undefined,
        type,
        title: title.trim(),
        date: `${date}T12:00:00`,
        doctorName: doctorName.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        notes: notes.trim() || undefined,
        results: results.trim() || undefined,
        attachments: attachments.filter((a) => a.url.trim().startsWith("http")).map((a) => ({ name: a.name.trim() || "Attachment", url: a.url.trim() })),
      };
      const res = await fetch(
        initial ? `/api/admin/medical-records/${initial._id}` : "/api/admin/medical-records",
        {
          method: initial ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the record.");
      onSaved();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not save the record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">{initial ? "Edit medical record" : "Add a medical record"}</p>
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
        <Field label="Record type" required>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(RecordTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" required>
          <Input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} required />
        </Field>
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="e.g. First consultation - type 2 diabetes plan" />
          </Field>
        </div>
        <Field label="Doctor / clinician">
          <Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} maxLength={100} placeholder="e.g. Dr. Nguema" />
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
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Diagnosis / findings">
          <Textarea rows={3} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
        </Field>
        <Field label="Results (lab / scan summary)">
          <Textarea rows={3} value={results} onChange={(e) => setResults(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Doctor's notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink">Attachments</p>
        <p className="mt-1 text-xs text-muted">
          Paste links to documents or scans (Cloudinary, Drive, etc.). Patients can open and print them.
        </p>
        <div className="mt-3 space-y-2">
          {attachments.map((a, index) => (
            <div key={index} className="flex flex-wrap items-end gap-2">
              <div className="w-36">
                <Field label="Name">
                  <Input value={a.name} onChange={(e) => setAttachments((list) => list.map((x, i) => (i === index ? { ...x, name: e.target.value } : x)))} placeholder="Lab result PDF" />
                </Field>
              </div>
              <div className="min-w-40 flex-1">
                <Field label="URL">
                  <Input value={a.url} onChange={(e) => setAttachments((list) => list.map((x, i) => (i === index ? { ...x, url: e.target.value } : x)))} placeholder="https://..." />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => setAttachments((list) => list.filter((_, i) => i !== index))}
                className="mb-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                aria-label="Remove attachment"
              >
                <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAttachments((list) => [...list, { ...emptyAttach }])}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-forest-800 hover:border-forest-400"
          >
            <FaLink className="h-3 w-3" aria-hidden />
            Add attachment
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-end gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Add record"}
        </Button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-muted hover:text-ink">
          Cancel
        </button>
      </div>
    </form>
  );
}

function RecordRow({
  r,
  expanded,
  onToggle,
}: {
  r: RecordAdminView;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest-50/50 sm:px-5"
      >
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${RecordTypeClass[r.type] || "border-line-strong bg-cream text-muted"}`}>
          <FaFileMedical className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{r.title}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {r.user?.name || "Unknown"} · {RecordTypeLabel[r.type] || r.type} · {formatDate(r.date)}
          </span>
        </span>
        {expanded ? <FaChevronUp className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden /> : <FaChevronDown className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
      </button>
      {expanded ? (
        <div className="border-t border-forest-100 bg-cream/60 px-5 py-4">
          <dl className="space-y-2.5 text-sm">
            {r.doctorName ? (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-bold uppercase tracking-wide text-muted">Clinician</dt><dd className="text-ink">{r.doctorName}</dd></div>
            ) : null}
            {r.forMember ? (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-bold uppercase tracking-wide text-muted">Patient</dt><dd className="text-ink">{r.forMember}</dd></div>
            ) : null}
            {r.diagnosis ? (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-bold uppercase tracking-wide text-muted">Diagnosis</dt><dd className="text-ink">{r.diagnosis}</dd></div>
            ) : null}
            {r.results ? (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-bold uppercase tracking-wide text-muted">Results</dt><dd className="whitespace-pre-line text-ink">{r.results}</dd></div>
            ) : null}
            {r.notes ? (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]"><dt className="text-xs font-bold uppercase tracking-wide text-muted">Notes</dt><dd className="whitespace-pre-line text-ink">{r.notes}</dd></div>
            ) : null}
            {r.attachments?.length ? (
              <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                <dt className="text-xs font-bold uppercase tracking-wide text-muted">Files</dt>
                <dd className="space-y-1">
                  {r.attachments.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block truncate text-forest-800 underline">
                      {a.name || "Attachment"} · open
                    </a>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </li>
  );
}

export function AdminMedicalRecordsTab() {
  const [records, setRecords] = useState<RecordAdminView[] | null>(null);
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
    fetch("/api/admin/medical-records", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setRecords(Array.isArray(data.records) ? data.records : []);
      })
      .catch(() => {
        if (active) setError("Could not load medical records.");
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

  async function removeRecord(r: RecordAdminView) {
    if (!window.confirm(`Delete "${r.title}"? This removes it from the patient's records.`)) return;
    try {
      const res = await fetch(`/api/admin/medical-records/${r._id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the record.");
      load();
      notify(data.message || "Record deleted.");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Could not delete the record.");
    }
  }

  const editingRecord = records?.find((r) => r._id === editingId) || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Add visit summaries, diagnoses, lab results and scans. Patients see these under Medical Records.
        </p>
        <div className="flex items-center gap-2">
          {!showForm && !editingRecord ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <FaPlus className="h-3.5 w-3.5" aria-hidden />
              Add record
            </Button>
          ) : null}
        </div>
      </div>

      {note ? (
        <p className="rounded-md border border-forest-300 bg-forest-50 px-3 py-2 text-xs font-semibold text-forest-800">{note}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {(showForm || editingRecord) && patients.length > 0 ? (
        <RecordForm
          initial={editingRecord}
          patients={patients}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            load();
            notify("Medical record saved - patient notified.");
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      ) : null}

      {showForm && patients.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          No patient accounts yet - ask a patient to sign up, then add their records here.
        </p>
      ) : null}

      {!records ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {records && records.length === 0 && !showForm ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaFileMedical className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No medical records yet. Add the first record for a patient.</p>
        </div>
      ) : null}

      {records && records.length > 0 ? (
        <ul className="space-y-2.5">
          {records.map((r) => (
            <li key={r._id} className="space-y-2">
              <RecordRow r={r} expanded={expandedId === r._id} onToggle={() => setExpandedId(expandedId === r._id ? null : r._id)} />
              {expandedId === r._id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingId(r._id)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
                  >
                    <FaPencil className="h-3 w-3" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void removeRecord(r)}
                    className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50"
                  >
                    <FaTrashCan className="h-3 w-3" aria-hidden />
                    Delete
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}