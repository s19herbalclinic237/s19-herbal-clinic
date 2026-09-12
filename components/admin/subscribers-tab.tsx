"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/account/badges";
import { FaArrowRotateLeft, FaEnvelopeOpenText, FaUsers } from "react-icons/fa6";

interface SubscriberRow {
  _id: string;
  email: string;
  name?: string;
  status: "subscribed" | "unsubscribed";
  createdAt: string;
}

export function SubscribersTab() {
  const [rows, setRows] = useState<SubscriberRow[] | null>(null);
  const [counts, setCounts] = useState<{ total: number; subscribed: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = () => {
    let active = true;
    fetch("/api/admin/subscribers", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else {
          setRows(Array.isArray(data.subscribers) ? data.subscribers : []);
          setCounts(data.counts ?? null);
        }
      })
      .catch(() => {
        if (active) setError("Could not load subscribers.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const setStatus = async (row: SubscriberRow, status: "subscribed" | "unsubscribed") => {
    try {
      const res = await fetch(`/api/admin/subscribers/${row._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setRows((prev) => (prev === null ? prev : prev.map((x) => (x._id === row._id ? { ...x, status } : x))));
      setCounts((prev) => (prev === null ? prev : { ...prev, subscribed: prev.subscribed + (status === "subscribed" ? 1 : -1) }));
      notify(status === "subscribed" ? "Re-subscribed." : "Unsubscribed.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const remove = async (row: SubscriberRow) => {
    if (!window.confirm(`Delete ${row.email} permanently?`)) return;
    try {
      const res = await fetch(`/api/admin/subscribers/${row._id}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setRows((prev) => (prev === null ? prev : prev.filter((x) => x._id !== row._id)));
      setCounts((prev) => (prev === null ? prev : { ...prev, total: prev.total - 1, subscribed: prev.subscribed - (row.status === "subscribed" ? 1 : 0) }));
      notify("Subscriber removed.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const filtered = rows?.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.email.toLowerCase().includes(q) || (r.name || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Newsletter Subscribers</p>
          {counts ? (
            <p className="text-sm text-muted">
              {counts.subscribed} subscribed of {counts.total} total
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

      <FanoutForm onResult={notify} />

      <div className="flex items-center gap-2">
        <Input placeholder="Search by email or name…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search subscribers" />
      </div>

      {rows === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaUsers className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {counts?.total ? "No subscribers match." : "No subscribers yet. The newsletter form on the blog collects them."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {(filtered || []).map((r) => (
            <li key={r._id} className="flex flex-wrap items-center gap-3 p-3 sm:px-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-forest-50 text-forest-700">
                <FaEnvelopeOpenText className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {r.email}
                  {r.status === "unsubscribed" ? <span className="ml-2 text-xs font-medium text-muted">(unsubscribed)</span> : null}
                </p>
                <p className="text-xs text-muted">
                  {r.name ? `${r.name} · ` : ""}subscribed {formatDate(r.createdAt)}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <input
                  type="checkbox"
                  checked={r.status === "subscribed"}
                  onChange={(e) => void setStatus(r, e.target.checked ? "subscribed" : "unsubscribed")}
                  className="h-3.5 w-3.5 accent-forest-700"
                />
                Active
              </label>
              <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" aria-label={`Delete ${r.email}`} onClick={() => void remove(r)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FanoutForm({ onResult }: { onResult: (message: string) => void }) {
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/fanout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, text }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        delivered?: number;
        emailOnly?: number;
      };
      if (!res.ok) throw new Error(data.error || "Could not send.");
      const message = `Update queued: ${data.delivered} user in-app message${data.delivered === 1 ? "" : "s"}` +
        (data.emailOnly ? ` and ${data.emailOnly} subscriber${data.emailOnly === 1 ? "" : "s"} (no account yet) marked for later delivery.` : ".");
      setResult(message);
      onResult(message);
      setSubject("");
      setText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <p className="font-display text-base font-semibold text-ink">Send an update to all subscribers</p>
      <p className="mt-1 text-sm text-muted">
        Users with matching accounts get an in-app message; other subscribers are tracked for email delivery.
      </p>
      {error ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      {result ? (
        <p className="mt-2 rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">{result}</p>
      ) : null}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Subject" required>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} required maxLength={120} placeholder="New article: Understanding blood sugar" />
        </Field>
        <Field label="Message" required>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} required maxLength={5000} minLength={2} placeholder="Read our latest update…" />
        </Field>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send to all subscribers"}
        </Button>
      </div>
    </form>
  );
}