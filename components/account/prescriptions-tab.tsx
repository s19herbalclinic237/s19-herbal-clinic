"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n";
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

interface FamilyOption {
  _id: string;
  name: string;
}

function PrescriptionDetail({ p }: { p: PrescriptionView }) {
  const { t } = useLocale();
  return (
    <div className="print-area">
      <div className="border-t border-forest-100 bg-cream/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-ink">
              {t("dash.prescriptions.title", { date: formatDayDate(p.issuedDate) })}
            </p>
            <p className="mt-1 text-xs text-muted">
              {t("dash.prescriptions.issued", { date: formatDayDate(p.issuedDate) })}
              {p.doctorName ? t("dash.prescriptions.byDoctor", { name: p.doctorName }) : ""}
              {p.expiresAt ? t("dash.prescriptions.validTo", { date: formatDayDate(p.expiresAt) }) : ""}
              {p.forMember ? t("dash.prescriptions.patient", { name: p.forMember }) : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-forest-950 px-3.5 text-xs font-bold text-white transition-colors hover:bg-forest-800 print:hidden"
          >
            <FaPrint className="h-3.5 w-3.5" aria-hidden />
            {t("dash.records.downloadPdf")}
          </button>
        </div>

        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-forest-200 text-left text-[10px] font-bold uppercase tracking-widest text-muted">
              <th className="py-2 pr-3">{t("dash.prescriptions.medication")}</th>
              <th className="py-2 pr-3">{t("dash.prescriptions.dosage")}</th>
              <th className="py-2 pr-3">{t("dash.prescriptions.frequency")}</th>
              <th className="py-2">{t("dash.prescriptions.duration")}</th>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t("dash.prescriptions.directions")}</p>
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
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t("dash.prescriptions.notes")}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{p.notes}</p>
          </div>
        ) : null}

        <p className="mt-5 text-[10px] text-muted">{t("dash.prescriptions.footer")}</p>
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
  const { t } = useLocale();
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
            {t("dash.prescriptions.issued", { date: formatDayDate(p.issuedDate) })}
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
  const { t } = useLocale();
  const [prescriptions, setPrescriptions] = useState<PrescriptionView[] | null>(null);
  const [family, setFamily] = useState<FamilyOption[]>([]);
  const [filter, setFilter] = useState("all");
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
        if (active) setError(t("dash.prescriptions.loadError"));
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
  }, [t]);

  const { active, past } = useMemo(() => {
    const list = prescriptions || [];
    return {
      active: list.filter((p) => p.status === "active"),
      past: list.filter((p) => p.status === "expired"),
    };
  }, [prescriptions]);

  const shown = (tab === "active" ? active : past).filter((p) => {
    if (filter === "self") return !p.forMember;
    if (filter) return p.forMember === filter;
    return true;
  });

  const chips: { key: string; labelKey: TranslationKey; label?: string }[] = [
    { key: "all", labelKey: "dash.prescriptions.all" },
    { key: "self", labelKey: "dash.prescriptions.me" },
    ...family.map((f) => ({ key: f.name, labelKey: "dash.prescriptions.all" as TranslationKey, label: f.name })),
  ];

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
            {t("dash.prescriptions.current", { n: active.length })}
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
            {t("dash.prescriptions.past", { n: past.length })}
          </button>
        </div>
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
              {c.label ?? t(c.labelKey)}
            </button>
          ))}
        </div>
      ) : null}

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
              ? filter === "all"
                ? t("dash.prescriptions.emptyCurrentAll")
                : t("dash.prescriptions.emptyCurrentMember", { name: filter })
              : filter === "all"
                ? t("dash.prescriptions.emptyPastAll")
                : t("dash.prescriptions.emptyPastMember", { name: filter })}
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