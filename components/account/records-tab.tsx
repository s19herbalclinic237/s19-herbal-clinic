"use client";

import { useEffect, useState } from "react";
import {
  formatDayDate,
  RecordTypeClass,
  RecordTypeLabel,
} from "@/components/account/badges";
import {
  FaChevronDown,
  FaChevronUp,
  FaFileMedical,
  FaPrint,
  FaUserGroup,
} from "react-icons/fa6";

interface Attachment {
  name: string;
  url: string;
}

interface RecordView {
  _id: string;
  type: string;
  title: string;
  date: string;
  doctorName?: string;
  diagnosis?: string;
  notes?: string;
  results?: string;
  forMember?: string;
  attachments: Attachment[];
}

interface FamilyOption {
  _id: string;
  name: string;
}

function RecordDetail({ record }: { record: RecordView }) {
  return (
    <div className="print-area">
      <div className="border-t border-forest-100 bg-cream/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-ink">{record.title}</p>
            <p className="mt-1 text-xs text-muted">
              {formatDayDate(record.date)}
              {record.doctorName ? ` · ${record.doctorName}` : ""}
              {record.forMember ? ` · Patient: ${record.forMember}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-forest-950 px-3.5 text-xs font-bold text-white transition-colors hover:bg-forest-800 print:hidden"
          >
            <FaPrint className="h-3.5 w-3.5" aria-hidden />
            Download PDF
          </button>
        </div>

        {record.diagnosis ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Diagnosis</p>
            <p className="mt-1 text-sm text-ink">{record.diagnosis}</p>
          </div>
        ) : null}
        {record.results ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Results</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{record.results}</p>
          </div>
        ) : null}
        {record.notes ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Notes</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{record.notes}</p>
          </div>
        ) : null}

        {record.attachments && record.attachments.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
              Attachments ({record.attachments.length})
            </p>
            <ul className="mt-2 space-y-1.5">
              {record.attachments.map((a, i) => (
                <li key={`${a.url}-${i}`}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-2 rounded-md border border-line-strong bg-white px-3 py-2 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
                  >
                    <FaFileMedical className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{a.name || "Document"}</span>
                    <span className="shrink-0 text-muted">· open</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-5 text-[10px] text-muted">
          S19 Herbal Clinic · Document provided to the patient for personal records.
        </p>
      </div>
    </div>
  );
}

function RecordCard({
  record,
  expanded,
  onToggle,
}: {
  record: RecordView;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="overflow-hidden rounded-lg border border-line bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-forest-50/50 sm:px-5"
      >
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${RecordTypeClass[record.type] || "border-line-strong bg-cream text-muted"}`}
        >
          <FaFileMedical className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">{record.title}</span>
          <span className="mt-0.5 block text-xs text-muted">
            {RecordTypeLabel[record.type] || record.type} · {formatDayDate(record.date)}
            {record.doctorName ? ` · ${record.doctorName}` : ""}
          </span>
        </span>
        <span className="shrink-0 text-muted">
          {expanded ? <FaChevronUp className="h-3.5 w-3.5" aria-hidden /> : <FaChevronDown className="h-3.5 w-3.5" aria-hidden />}
        </span>
      </button>
      {expanded ? <RecordDetail record={record} /> : null}
    </li>
  );
}

export function RecordsTab() {
  const [records, setRecords] = useState<RecordView[] | null>(null);
  const [family, setFamily] = useState<FamilyOption[]>([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/medical-records", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setRecords(Array.isArray(data.records) ? data.records : []);
      })
      .catch(() => {
        if (active) setError("Could not load your medical records.");
      });
    fetch("/api/family-members", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.members))
          setFamily(data.members.map((m: FamilyOption) => ({ _id: m._id, name: m.name })));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const shown = records
    ? records.filter((r) => {
        if (filter === "self") return !r.forMember;
        if (filter) return r.forMember === filter;
        return true;
      })
    : null;

  const chips: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    { key: "self", label: "Me" },
    ...family.map((f) => ({ key: f.name, label: f.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Your visit history, diagnoses, lab results and scans - kept private and downloadable as
          PDF.
        </p>
        {records && records.length > 0 ? (
          <span className="text-xs font-semibold text-muted">{records.length} record{records.length === 1 ? "" : "s"}</span>
        ) : null}
      </div>

      {family.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={
                filter === c.key
                  ? "rounded-full bg-forest-950 px-3 py-1.5 text-xs font-bold text-white"
                  : "cursor-pointer rounded-full border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!records ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {records && shown && shown.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaFileMedical className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {records.length === 0
              ? "No medical records yet. Records from your visits, lab work and scans with the clinic will appear here."
              : filter === "all"
                ? "No medical records match this view."
                : `No medical records for ${filter} yet.`}
          </p>
        </div>
      ) : null}

      {shown && shown.length > 0 ? (
        <ul className="space-y-3">
          {shown.map((r) => (
            <RecordCard
              key={r._id}
              record={r}
              expanded={expandedId === r._id}
              onToggle={() => setExpandedId(expandedId === r._id ? null : r._id)}
            />
          ))}
        </ul>
      ) : null}

      {records && records.length > 0 ? (
        <p className="flex items-start gap-2 rounded-md border border-line bg-white px-3 py-2.5 text-xs text-muted">
          <FaUserGroup className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-700" aria-hidden />
          Your records are only visible to you and the clinic team. Use &quot;Download PDF&quot; to keep a
          copy for other providers.
        </p>
      ) : null}
    </div>
  );
}