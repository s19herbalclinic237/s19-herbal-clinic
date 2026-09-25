"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { formatDate } from "@/components/account/badges";
import { FaArrowRotateLeft, FaUserDoctor, FaUsers } from "react-icons/fa6";

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
      notify(patch.role ? `Role changed to ${patch.role}.` : patch.isActive ? "Account activated." : "Account deactivated. Existing sessions were revoked.");
    } catch (e) {
      notify((e as Error).message);
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
              {doctors} doctor{doctors === 1 ? "" : "s"} · {rows.length} patient accounts
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
        Doctors are clinical staff: they can manage appointments, medical records, prescriptions,
        treatment plans and patient messages, but not the store, content, subscribers or other
        administration. A user needs a verified email before being promoted. Administrators are not listed here.
      </p>

      <div className="flex items-center gap-2">
        <Input placeholder="Search by name or email…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-forest-100 text-[11px] font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(filtered ?? []).map((r) => (
              <tr key={r.id} className="border-b border-forest-50 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">
                    {r.name} {r.role === "doctor" ? <FaUserDoctor className="inline h-3.5 w-3.5 text-forest-700" aria-label="Doctor" /> : null}
                  </p>
                  <p className="text-xs text-muted">{r.email}{r.phone ? ` · ${r.phone}` : ""}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3">
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
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold capitalize text-ink">{r.role}</span>
                </td>
                <td className="px-4 py-3">
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
                        Make doctor
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered && filtered.length === 0 ? (
          <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted">
            <FaUsers className="h-4 w-4" aria-hidden /> No matching accounts.
          </p>
        ) : null}
      </div>
    </div>
  );
}