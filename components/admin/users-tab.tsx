"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { formatDate } from "@/components/account/badges";
import {
  FaAddressBook,
  FaArrowRotateLeft,
  FaCircleXmark,
  FaIdCard,
  FaMagnifyingGlass,
  FaTriangleExclamation,
  FaUsers,
  FaXmark,
} from "react-icons/fa6";

/**
 * Every account on the system, with the details needed to recognise someone who
 * walks in, and the Medical Record Number they file under.
 *
 * This screen exists because the other two do not do this job:
 *   - Staff & Roles shows who can be promoted or disabled, so it must not list
 *     the administrator who is signed in.
 *   - Users & Messages is a chat view, so it carries only what a conversation
 *     needs.
 *
 * Here the MRN sits on the same line as the name, because that is how the
 * clinic actually calls a patient: name plus file number. It can be searched
 * for, and filtered for the patients who do not have one yet, which is the list
 * the clinic needs before it starts issuing numbers.
 *
 * Assigning and changing an MRN is administrator-only and is handled by
 * /api/admin/mrn, which records every change in the audit log.
 */

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "doctor" | "user";
  isActive: boolean;
  emailVerified: boolean;
  mrn: string;
  dob: string;
  gender: string;
  address: string;
  avatar: string;
  whatsappOptIn: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  familyCount: number;
}

interface DirectoryTotals {
  shown: number;
  unassignedMrn: number;
  disabled: number;
  unverified: number;
}

interface DetailUser extends DirectoryUser {
  emergencyContact: { name: string; phone: string; relation: string };
  whatsappOptInAt: string | null;
  preferredLanguage: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  familyMembers: Array<{ id: string; name: string; dob: string; gender: string; relation: string; notes: string }>;
  counts: Record<string, number>;
}

const ROLE_LABEL: Record<DirectoryUser["role"], string> = {
  admin: "Administrator",
  doctor: "Staff",
  user: "Patient",
};

const COUNT_LABEL: Array<[string, string]> = [
  ["records", "Medical records"],
  ["prescriptions", "Prescriptions"],
  ["plans", "Treatment plans"],
  ["reminders", "Reminders"],
  ["followUps", "Follow-ups"],
  ["readings", "Readings"],
  ["appointments", "Appointments"],
  ["orders", "Orders"],
  ["messages", "Messages"],
  ["testimonials", "Testimonials"],
];

function RoleBadge({ role }: { role: DirectoryUser["role"] }) {
  const cls =
    role === "admin"
      ? "bg-gold-400/20 text-[#8a6e1a]"
      : role === "doctor"
        ? "bg-sky-50 text-sky-700"
        : "bg-forest-50 text-forest-700";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${cls}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

/** The number the clinic files this patient under. Deliberately the most
 *  prominent thing on the tile, because it is what the clinic reads out. */
function MrnChip({ mrn }: { mrn: string }) {
  if (!mrn) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
        <FaTriangleExclamation className="h-3 w-3" aria-hidden />
        No MRN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-forest-800 px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-forest-50">
      <FaIdCard className="h-3 w-3" aria-hidden />
      {mrn}
    </span>
  );
}

export function UsersTab() {
  const [users, setUsers] = useState<DirectoryUser[] | null>(null);
  const [totals, setTotals] = useState<DirectoryTotals | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Starts true because the first load runs from an effect; `load` itself must
  // not set it, or every filter change becomes a second render pass.
  const [busy, setBusy] = useState(true);

  const [query, setQuery] = useState("");
  const [applied, setApplied] = useState("");
  const [role, setRole] = useState("all");
  const [mrnState, setMrnState] = useState("any");

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailUser | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [editingMrn, setEditingMrn] = useState(false);
  const [mrnDraft, setMrnDraft] = useState("");
  const [mrnError, setMrnError] = useState<string | null>(null);
  const [savingMrn, setSavingMrn] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4500);
  };

  // Written as a promise chain rather than async/await so every setState sits
  // inside a callback. Called from an effect on mount and from the filters, and
  // the React lint rule treats an async function's body as synchronous enough
  // to warn about, which is a false positive here but still an error.
  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (applied) params.set("q", applied);
    if (role !== "all") params.set("role", role);
    if (mrnState !== "any") params.set("mrn", mrnState);

    return fetch(`/api/admin/directory?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json().catch(() => ({})))
      .then((data: { users?: DirectoryUser[]; totals?: DirectoryTotals; error?: string }) => {
        if (data.error) {
          setError(data.error);
          setUsers(null);
        } else {
          setError(null);
          setUsers(data.users ?? []);
          setTotals(data.totals ?? null);
        }
      })
      .catch(() => {
        setError("Could not load the user directory.");
        setUsers(null);
      })
      .finally(() => setBusy(false));
  }, [applied, role, mrnState]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Every deliberate re-run goes through here so the button and the selects
   *  share one place that turns the spinner on. */
  const refresh = () => {
    setBusy(true);
    void load();
  };

  // Detail is fetched on demand rather than listed up front: the clinic's file
  // for one person is the only thing that needs the address, ID documents and
  // record counts, and shipping those for 500 accounts on a phone is not
  // reasonable. Loading is driven from the click rather than from an effect so
  // the reset of the previous person's details happens in the same event as
  // the open, not in a second render pass.
  const openDetail = useCallback((id: string) => {
    setOpenId(id);
    setEditingMrn(false);
    setMrnDraft("");
    setMrnError(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);

    fetch(`/api/admin/users/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { user?: DetailUser; error?: string }) => {
        setDetailError(data.error ?? null);
        setDetail(data.user ?? null);
      })
      .catch(() => setDetailError("Could not load that account."))
      .finally(() => setDetailLoading(false));
  }, []);

  const closeDetail = () => {
    setOpenId(null);
    setDetail(null);
    setDetailError(null);
    setEditingMrn(false);
  };

  /** One toggle drives both layouts, so Details and Close stay in step. */
  const toggleDetail = (id: string) => {
    if (openId === id) closeDetail();
    else openDetail(id);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApplied(query.trim());
    refresh();
  };

  const saveMrn = async (userId: string, value: string) => {
    setSavingMrn(true);
    setMrnError(null);
    try {
      const res = await fetch("/api/admin/mrn", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, mrn: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setMrnError(data.error || "Could not update the Medical Record Number.");
        return;
      }
      setEditingMrn(false);
      setMrnDraft("");
      setUsers((prev) =>
        prev
          ? prev.map((u) =>
              u.id === userId ? { ...u, mrn: value.trim().toUpperCase().replace(/\s+/g, "-") } : u
            )
          : prev
      );
      setDetail((prev) => (prev && prev.id === userId ? { ...prev, mrn: value.trim().toUpperCase().replace(/\s+/g, "-") } : prev));
      notify(data.message || "Medical Record Number updated.");
    } catch {
      setMrnError("Could not update the Medical Record Number.");
    } finally {
      setSavingMrn(false);
    }
  };

  const rows = useMemo(() => users ?? [], [users]);

  const columns = [
    {
      header: "Patient",
      render: (u: DirectoryUser) => (
        <>
          <p className="font-semibold text-ink">{u.name}</p>
          <p className="break-all text-xs text-muted">{u.email}</p>
        </>
      ),
    },
    {
      header: "MRN",
      render: (u: DirectoryUser) => <MrnChip mrn={u.mrn} />,
    },
    {
      header: "Contact",
      label: "Phone",
      render: (u: DirectoryUser) => <span className="text-xs text-muted">{u.phone || "—"}</span>,
    },
    {
      header: "Account",
      render: (u: DirectoryUser) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <RoleBadge role={u.role} />
          {u.isActive ? null : (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
              <FaCircleXmark className="h-3 w-3" aria-hidden />
              Disabled
            </span>
          )}
          {u.emailVerified ? null : (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Unverified
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Joined",
      label: "Joined",
      render: (u: DirectoryUser) => <span className="text-xs text-muted">{formatDate(u.createdAt)}</span>,
    },
    {
      header: "",
      desktopOnly: true,
      render: (u: DirectoryUser) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleDetail(u.id)}
          aria-expanded={openId === u.id}
        >
          {openId === u.id ? "Close" : "Details"}
        </Button>
      ),
      cellClassName: "px-4 py-3",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">Users</h2>
        <p className="mt-1 text-sm text-muted">
          Every account on the site, with the Medical Record Number the clinic files each person
          under. Search by name, email, phone or MRN.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-[15rem] flex-1 items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone or MRN…"
            aria-label="Search users"
          />
          <Button type="submit" size="sm" disabled={busy}>
            <FaMagnifyingGlass className="h-3.5 w-3.5" aria-hidden />
            {busy ? "Searching…" : "Search"}
          </Button>
        </div>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setBusy(true);
          }}
          aria-label="Filter by account type"
          className="w-auto"
        >
          <option value="all">All accounts</option>
          <option value="user">Patients</option>
          <option value="doctor">Staff</option>
          <option value="admin">Administrators</option>
        </Select>
        <Select
          value={mrnState}
          onChange={(e) => {
            setMrnState(e.target.value);
            setBusy(true);
          }}
          aria-label="Filter by MRN"
          className="w-auto"
        >
          <option value="any">Any MRN</option>
          <option value="assigned">Has an MRN</option>
          <option value="unassigned">Missing an MRN</option>
        </Select>
        {applied || role !== "all" || mrnState !== "any" ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setApplied("");
              setRole("all");
              setMrnState("any");
              setBusy(true);
            }}
          >
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Clear
          </Button>
        ) : null}
      </form>

      {totals ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl border border-line bg-white p-3 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Shown</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{totals.shown}</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-3 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Missing MRN</p>
            <p className="mt-1 font-display text-xl font-semibold text-amber-700">
              {totals.unassignedMrn}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-3 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Disabled</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{totals.disabled}</p>
          </div>
          <div className="rounded-xl border border-line bg-white p-3 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wide text-muted">Unverified</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{totals.unverified}</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!users ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : (
        <ResponsiveTable
          rows={rows}
          rowKey={(u) => u.id}
          minWidthClassName="min-w-[720px]"
          columns={columns}
          emptyState={
            <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
              <FaUsers className="h-4 w-4" aria-hidden /> No accounts match this search.
            </p>
          }
          renderTile={(u) => (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{u.name}</p>
                  <p className="break-all text-xs text-muted">{u.email}</p>
                </div>
                <RoleBadge role={u.role} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <MrnChip mrn={u.mrn} />
                {u.isActive ? null : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    <FaCircleXmark className="h-3 w-3" aria-hidden />
                    Disabled
                  </span>
                )}
                {u.emailVerified ? null : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    Unverified
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span>{u.phone || "No phone"}</span>
                <span>Joined {formatDate(u.createdAt)}</span>
              </div>
              <div className="border-t border-forest-50 pt-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleDetail(u.id)}
                  aria-expanded={openId === u.id}
                >
                  {openId === u.id ? "Close details" : "Details"}
                </Button>
              </div>
            </>
          )}
        />
      )}

      {openId ? (
        <section className="rounded-2xl border border-line bg-white p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
              <FaAddressBook className="h-4 w-4 text-forest-600" aria-hidden />
              Account details
            </h3>
            <Button variant="ghost" size="sm" onClick={closeDetail} aria-label="Close details">
              <FaXmark className="h-4 w-4" aria-hidden />
            </Button>
          </div>

          {detailLoading ? (
            <div className="mt-4 flex h-20 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
            </div>
          ) : detailError ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {detailError}
            </p>
          ) : detail ? (
            <div className="mt-4 space-y-5">
              {/* MRN first and largest: it is what the clinic calls the patient by. */}
              <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-forest-700">
                      Medical Record Number
                    </p>
                    {detail.mrn ? (
                      <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-ink">
                        {detail.mrn}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-muted">
                        Not assigned yet. Patients are not issued a number until the clinic assigns one.
                      </p>
                    )}
                  </div>
                  {detail.role !== "admin" ? (
                    editingMrn ? null : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMrnDraft(detail.mrn);
                          setMrnError(null);
                          setEditingMrn(true);
                        }}
                      >
                        {detail.mrn ? "Change MRN" : "Assign MRN"}
                      </Button>
                    )
                  ) : (
                    <p className="text-xs text-muted">Administrator accounts do not have an MRN.</p>
                  )}
                </div>

                {editingMrn ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={mrnDraft}
                      onChange={(e) => setMrnDraft(e.target.value)}
                      placeholder="e.g. S1900615"
                      aria-label="Medical Record Number"
                      className="w-48"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      disabled={savingMrn}
                      onClick={() => void saveMrn(detail.id, mrnDraft)}
                    >
                      {savingMrn ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" disabled={savingMrn} onClick={() => setEditingMrn(false)}>
                      Cancel
                    </Button>
                    {detail.mrn ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={savingMrn}
                        onClick={() => void saveMrn(detail.id, "")}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {mrnError ? (
                  <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {mrnError}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-muted">
                    Every assign, change and removal is recorded in the audit log with who did it and
                    when. Two patients can never hold the same number.
                  </p>
                )}
              </div>

              <DetailSection title="Identity">
                <DetailRow label="Name" value={detail.name} />
                <DetailRow label="Email" value={detail.email} />
                <DetailRow label="Phone" value={detail.phone || "—"} />
                <DetailRow label="Date of birth" value={detail.dob || "—"} />
                <DetailRow label="Gender" value={detail.gender || "—"} />
                <DetailRow label="Address" value={detail.address || "—"} />
              </DetailSection>

              <DetailSection title="Account">
                <DetailRow label="Role" value={ROLE_LABEL[detail.role]} />
                <DetailRow label="Status" value={detail.isActive ? "Active" : "Disabled"} />
                <DetailRow label="Email" value={detail.emailVerified ? "Verified" : "Not verified"} />
                <DetailRow label="WhatsApp" value={detail.whatsappOptIn ? "Opted in" : "Not opted in"} />
                <DetailRow label="Language" value={detail.preferredLanguage === "fr" ? "French" : "English"} />
                <DetailRow label="Last sign-in" value={detail.lastLoginAt ? formatDate(detail.lastLoginAt) : "Never"} />
                <DetailRow label="Joined" value={formatDate(detail.createdAt)} />
              </DetailSection>

              <DetailSection title="Emergency contact">
                <DetailRow label="Name" value={detail.emergencyContact.name || "—"} />
                <DetailRow label="Phone" value={detail.emergencyContact.phone || "—"} />
                <DetailRow label="Relation" value={detail.emergencyContact.relation || "—"} />
              </DetailSection>

              <DetailSection title="Records on file">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {COUNT_LABEL.map(([key, label]) => (
                    <div key={key} className="rounded-lg border border-forest-50 bg-forest-50/40 px-3 py-2">
                      <p className="font-display text-lg font-semibold text-ink">{detail.counts[key] ?? 0}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {detail.idCardFrontUrl || detail.idCardBackUrl ? (
                <DetailSection title="ID documents">
                  <div className="flex flex-wrap gap-3">
                    {detail.idCardFrontUrl ? (
                      <a href={detail.idCardFrontUrl} target="_blank" rel="noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detail.idCardFrontUrl}
                          alt={`Front of the ID document belonging to ${detail.name}`}
                          className="h-24 w-36 rounded-lg border border-line object-cover"
                        />
                      </a>
                    ) : null}
                    {detail.idCardBackUrl ? (
                      <a href={detail.idCardBackUrl} target="_blank" rel="noreferrer" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={detail.idCardBackUrl}
                          alt={`Back of the ID document belonging to ${detail.name}`}
                          className="h-24 w-36 rounded-lg border border-line object-cover"
                        />
                      </a>
                    ) : null}
                  </div>
                </DetailSection>
              ) : null}

              {detail.familyMembers.length ? (
                <DetailSection title={`Family members (${detail.familyMembers.length})`}>
                  {detail.familyMembers.map((m) => (
                    <DetailRow
                      key={m.id}
                      label={m.name}
                      value={[m.relation, m.dob, m.gender].filter(Boolean).join(" · ") || "—"}
                    />
                  ))}
                </DetailSection>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-forest-950 px-4 py-2 text-xs font-semibold text-white shadow-lift lg:bottom-8">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{title}</p>
      <div className="mt-2 space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 border-b border-forest-50 pb-1.5 last:border-0">
      <span className="min-w-[9rem] text-xs text-muted">{label}</span>
      <span className="min-w-0 flex-1 break-words text-sm text-ink">{value}</span>
    </div>
  );
}