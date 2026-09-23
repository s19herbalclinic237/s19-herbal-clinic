"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatDayDate,
  PrescriptionStatusBadge,
} from "@/components/account/badges";
import {
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaPills,
} from "react-icons/fa6";

interface MedicationView {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

interface PrescriptionView {
  _id: string;
  forMember?: string;
  doctorName?: string;
  issuedDate: string;
  expiresAt?: string;
  status: "active" | "expired";
  medications: MedicationView[];
  notes?: string;
}

function PrescriptionDetail({ p }: { p: PrescriptionView }) {
  return (
    <div className="print-area">
      <div className="border-t border-forest-100 bg-cream/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-ink">
              Prescription · {formatDayDate(p.issuedDate)}
            </p>
            <p className="mt-1 text-xs text-muted">
              Issued {formatDayDate(p.issuedDate)}
              {p.doctorName ? ` by ${p.doctorName}` : ""}
              {p.expiresAt ? ` · valid to ${formatDayDate(p.expiresAt)}` : ""}
              {p.forMember ? ` · Patient: ${p.forMember}` : ""}
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

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-forest-200 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
              <th className="py-2 pr-3">Medication</th>
              <th className="py-2 pr-3">Dosage</th>
              <th className="py-2 pr-3">Frequency</th>
              <th className="py-2">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-100">
            {p.medications.map((m, i) => (
              <tr key={i}>
                <td className="py-2.5 pr-3 align-top font-bold text-ink">{m.name}</td>
                <td className="py-2.5 pr-3 align-top text-muted">{m.dosage}</td>
                <td className="py-2.5 pr-3 align-top text-muted">{m.frequency}</td>
                <td className="py-2.5 align-top text-muted">{m.duration || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {p.medications.some((m) => m.instructions) ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Directions</p>
            <ul className="mt-1.5 space-y-1.5">
              {p.medications.map(
                (m, i) =>
                  m.instructions ? (
                    <li key={i} className="text-sm text-muted">
                      <span className="font-semibold text-ink">{m.name}:</span> {m.instructions}
                    </li>
                  ) : null
              )}
            </ul>
          </div>
        ) : null}

        {p.notes ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Notes</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{p.notes}</p>
          </div>
        ) : null}

        <p className="mt-5 text-[10px] text-muted">
          S19 Herbal Clinic · Follow your provider&apos;s instructions. Contact the clinic before
          changing any treatment.
        </p>
      </div>
    </div>
  );
}

function PrescriptionCard({
  p,
  expanded,
  onToggle,
}: {
  p: PrescriptionView;
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
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            p.status === "active"
              ? "border-forest-300 bg-forest-50 text-forest-800"
              : "border-line-strong bg-cream text-muted"
          }`}
        >
          <FaPills className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink">
            {p.medications.map((m) => m.name).join(" + ")}
          </span>
          <span className="mt-0.5 block text-xs text-muted">
            Issued {formatDayDate(p.issuedDate)}
            {p.forMember ? ` · ${p.forMember}` : ""}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <PrescriptionStatusBadge status={p.status} />
          {expanded ? <FaChevronUp className="h-3.5 w-3.5 text-muted" aria-hidden /> : <FaChevronDown className="h-3.5 w-3.5 text-muted" aria-hidden />}
        </span>
      </button>
      {expanded ? <PrescriptionDetail p={p} /> : null}
    </li>
  );
}

export function PrescriptionsTab() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"active" | "past">("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/prescriptions", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setPrescriptions(Array.isArray(data.prescriptions) ? data.prescriptions : []);
      })
      .catch(() => {
        if (active) setError("Could not load your prescriptions.");
      });
    return () => {
      active = false;
    };
  }, []);

  const { active, past } = useMemo(() => {
    const list = prescriptions || [];
    return {
      active: list.filter((p) => p.status === "active"),
      past: list.filter((p) => p.status === "expired"),
    };
  }, [prescriptions]);

  const shown = tab === "active" ? active : past;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={
              tab === "active"
                ? "rounded-md bg-forest-950 px-3 py-1.5 text-xs font-bold text-white"
                : "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
            }
          >
            Current ({active.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={
              tab === "past"
                ? "rounded-md bg-forest-950 px-3 py-1.5 text-xs font-bold text-white"
                : "cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-ink"
            }
          >
            Past ({past.length})
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!prescriptions ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {prescriptions && shown.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaPills className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {tab === "active"
              ? "No current prescriptions. Your active treatment plans will appear here."
              : "No past prescriptions yet."}
          </p>
        </div>
      ) : null}

      {shown.length > 0 ? (
        <ul className="space-y-3">
          {shown.map((p) => (
            <PrescriptionCard
              key={p._id}
              p={p}
              expanded={expandedId === p._id}
              onToggle={() => setExpandedId(expandedId === p._id ? null : p._id)}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}