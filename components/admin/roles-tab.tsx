"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { formatDate } from "@/components/account/badges";
import { FaArrowRotateLeft, FaUserDoctor, FaUsers, FaTrashCan, FaXmark } from "react-icons/fa6";

interface StaffRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "user" | "doctor";
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export function RolesTab() {
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [deleting, setDeleting] = useState<StaffRow | null>(null);
  const [confirmWord, setConfirmWord] = useState("");
  const [deletingBusy, setDeletingBusy] = useState(false);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/roles", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setRows(Array.isArray(data.users) ? data.users : []);
      })
      .catch(() => {
        if (active) setError("Could not load users.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  const update = async (row: StaffRow, patch: { role?: "user" | "doctor"; isActive?: boolean }) => {
    try {
      const res = await fetch("/api/admin/roles", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, ...patch }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setRows((prev) =>
        prev === null ? prev : prev.map((x) => (x.id === row.id ? { ...x, ...patch } : x))
      );
      notify(
          patch.role
            ? patch.role === "doctor"
              ? "Role changed to staff."
              : "Role changed to patient."
            : patch.isActive
              ? "Account activated."
              : "Account deactivated. Existing sessions were revoked."
        );
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${deleting.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: confirmWord }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setRows((prev) => (prev === null ? prev : prev.filter((x) => x.id !== deleting.id)));
      notify(`Account ${deleting.email} permanently deleted.`);
      setDeleting(null);
      setConfirmWord("");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setDeletingBusy(false);
    }
  };

  const filtered = rows?.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  const doctors = rows?.filter((r) => r.role === "doctor").length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Staff &amp; Roles</p>
          {rows ? (
            <p className="text-sm text-muted">
              {doctors} staff member{doctors === 1 ? "" : "s"} · {rows.length} patient accounts
            </p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
          Refresh
        </Button>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">{toast}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2.5 text-xs leading-relaxed text-sky-800">
        Staff are clinical team members: they can manage appointments, medical records, prescriptions,
        treatment plans and patient messages, but not the store, content, subscribers or other
        administration. A user needs a verified email before being promoted. Administrators are not listed here.
      </p>

      <div className="flex items-center gap-2">
        <Input placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
      </div>

      <div>
        <ResponsiveTable
          minWidthClassName="min-w-[640px]"
          rows={filtered ?? []}
          rowKey={(r) => r.id}
          columns={[
            {
              header: "User",
              render: (r) => (
                <>
                  <p className="font-semibold text-ink">
                    {r.name} {r.role === "doctor" ? <FaUserDoctor className="inline h-3.5 w-3.5 text-forest-700" aria-label="Staff" /> : null}
                  </p>
                  <p className="text-xs text-muted">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                </>
              ),
            },
            {
              header: "Joined",
              label: "Joined",
              render: (r) => <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>,
            },
            {
              header: "Status",
              render: (r) => (
                <>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                  >
                    {r.isActive ? "Active" : "Disabled"}
                  </span>
                  {!r.emailVerified ? (
                    <span className="ml-1.5 inline-block rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-[#8a6e1a]">
                      Unverified
                    </span>
                  ) : null}
                </>
              ),
            },
            {
              header: "Role",
              label: "Role",
              render: (r) => <span className="font-semibold capitalize text-ink">{r.role}</span>,
            },
            {
              header: "Actions",
              desktopOnly: true,
              render: (r) => (
                <div className="flex flex-wrap items-center gap-1.5">
                  {r.role === "doctor" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update(r, { role: "user" })}
                      disabled={!r.emailVerified || !r.isActive}
                    >
                      Make patient
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update(r, { role: "doctor" })}
                      disabled={!r.emailVerified || !r.isActive}
                      title={!r.emailVerified ? "Verify the email first" : undefined}
                    >
                      Make staff
                    </Button>
                  )}
                  {r.isActive ? (
                    <Button variant="outline" size="sm" onClick={() => update(r, { isActive: false })}>
                      Disable
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => update(r, { isActive: true })}>
                      Enable
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setConfirmWord("");
                      setDeleting(r);
                    }}
                    title={`Permanently delete ${r.email}`}
                  >
                    <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          renderTile={(r) => (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {r.name} {r.role === "doctor" ? <FaUserDoctor className="inline h-3.5 w-3.5 text-forest-700" aria-label="Staff" /> : null}
                  </p>
                  <p className="break-words text-xs text-muted">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                </div>
                <span className="shrink-0 rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-forest-700">
                  {r.role}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    r.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                  }`}
                >
                  {r.isActive ? "Active" : "Disabled"}
                </span>
                {!r.emailVerified ? (
                  <span className="inline-block rounded-full bg-gold-400/20 px-2 py-0.5 text-[10px] font-bold text-[#8a6e1a]">
                    Unverified
                  </span>
                ) : null}
                <span className="text-[10px] text-muted">Joined {formatDate(r.createdAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 border-t border-forest-50 pt-2.5">
                {r.role === "doctor" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => update(r, { role: "user" })}
                    disabled={!r.emailVerified || !r.isActive}
                  >
                    Make patient
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => update(r, { role: "doctor" })}
                    disabled={!r.emailVerified || !r.isActive}
                    title={!r.emailVerified ? "Verify the email first" : undefined}
                  >
                    Make staff
                  </Button>
                )}
                {r.isActive ? (
                  <Button variant="outline" size="sm" onClick={() => update(r, { isActive: false })}>
                    Disable
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => update(r, { isActive: true })}>
                    Enable
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setConfirmWord("");
                    setDeleting(r);
                  }}
                  title={`Permanently delete ${r.email}`}
                >
                  <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                  Delete
                </Button>
              </div>
            </>
          )}
        emptyState={
            <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
              <FaUsers className="h-4 w-4" aria-hidden /> No matching accounts.
            </p>
          }
        />
      </div>

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-semibold text-red-700">Delete account</h3>
              <button
                type="button"
                onClick={() => setDeleting(null)}
                aria-label="Close"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
              >
                <FaXmark className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              You are about to permanently delete{" "}
              <strong>{deleting.name}</strong> (<span className="break-all">{deleting.email}</span>).
              This removes their appointments, records, messages, treatment plans, glucose
              readings and all account data. <strong className="text-red-700">This cannot be undone.</strong>
            </p>
            <div className="mt-4">
              <label htmlFor="delete-confirm" className="block text-xs font-semibold uppercase tracking-wide text-ink">
                Type the account email to confirm
              </label>
              <Input
                id="delete-confirm"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                autoComplete="off"
                placeholder={deleting.email}
                className="mt-1.5"
              />
            </div>
            <p className="mt-2 text-xs text-muted">
              The account&apos;s orders are kept for financial records but detached from the deleted user.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => void handleDelete()}
                disabled={deletingBusy || confirmWord.trim().toLowerCase() !== deleting.email.toLowerCase()}
                className="bg-red-700 hover:bg-red-800"
              >
                {deletingBusy ? "Deleting..." : "Delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}