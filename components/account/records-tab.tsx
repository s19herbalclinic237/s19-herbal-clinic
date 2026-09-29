"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n";
import {
  formatDayDate,
  RecordTypeClass,
  RecordTypeKeys,
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
  const { t } = useLocale();
  return (
    <div className="print-area">
      <div className="border-t border-forest-100 bg-cream/60 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-bold text-ink">{record.title}</p>
            <p className="mt-1 text-xs text-muted">
              {formatDayDate(record.date)}
              {record.doctorName ? ` · ${record.doctorName}` : ""}
              {record.forMember ? t("dash.records.patient", { name: record.forMember }) : ""}
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

        {record.diagnosis ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t("dash.records.diagnosis")}</p>
            <p className="mt-1 text-sm text-ink">{record.diagnosis}</p>
          </div>
        ) : null}
        {record.results ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t("dash.records.results")}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{record.results}</p>
          </div>
        ) : null}
        {record.notes ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{t("dash.records.notes")}</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{record.notes}</p>
          </div>
        ) : null}

        {record.attachments && record.attachments.length > 0 ? (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted">
              {t("dash.records.attachments", { n: record.attachments.length })}
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
                    <span className="truncate">{a.name || t("dash.records.document")}</span>
                    <span className="shrink-0 text-muted">{t("dash.records.open")}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-5 text-[10px] text-muted">{t("dash.records.footer")}</p>
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
  const { t } = useLocale();
  const typeKey = RecordTypeKeys[record.type] as TranslationKey | undefined;
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
            {typeKey ? t(typeKey) : record.type} · {formatDayDate(record.date)}
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
  const { t } = useLocale();
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
        if (active) setError(t("dash.records.loadError"));
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

  const shown = records
    ? records.filter((r) => {
        if (filter === "self") return !r.forMember;
        if (filter) return r.forMember === filter;
        return true;
      })
    : null;

  const chips: { key: string; labelKey: TranslationKey; label?: string }[] = [
    { key: "all", labelKey: "dash.records.all" },
    { key: "self", labelKey: "dash.records.me" },
    ...family.map((f) => ({ key: f.name, labelKey: "dash.records.all" as TranslationKey, label: f.name })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("dash.records.intro")}</p>
        {records && records.length > 0 ? (
          <span className="text-xs font-semibold text-muted">
            {t(records.length === 1 ? "dash.records.countOne" : "dash.records.count", { n: records.length })}
          </span>
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
              {c.label ?? t(c.labelKey)}
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
              ? t("dash.records.emptyAll")
              : filter === "all"
                ? t("dash.records.emptyFiltered")
                : t("dash.records.emptyMember", { name: filter })}
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
          {t("dash.records.privacy")}
        </p>
      ) : null}
    </div>
  );
}