"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/account/badges";
import { FaArrowRotateLeft, FaEnvelope, FaUsers } from "react-icons/fa6";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  orderCount: number;
  unreadCount: number;
}

export function MessagingTab() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = () => {
    let active = true;
    fetch("/api/admin/users", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setUsers(Array.isArray(data.users) ? data.users : []);
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

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const filtered = users?.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Message Users</p>
          <p className="text-sm text-muted">Send reports, plans and medical information to your patients.</p>
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
      {selected ? (
        <MessageForm
          user={selected}
          onClose={() => setSelected(null)}
          onSent={() => {
            setSelected(null);
            setUsers((prev) =>
              prev === null ? prev : prev.map((u) => (u.id === selected.id ? { ...u, unreadCount: u.unreadCount + 1 } : u))
            );
            notify("Message sent. The user will see it in their messages inbox.");
          }}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <Input placeholder="Search by name, email or phone…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
      </div>

      {users === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaUsers className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No users found.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {(filtered || []).map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 p-3 sm:px-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {u.name}
                  {!u.isActive ? <span className="ml-2 text-xs font-medium text-muted">(inactive)</span> : null}
                </p>
                <p className="truncate text-xs text-muted">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""} · joined {formatDate(u.createdAt)}
                </p>
                <p className="text-xs text-muted">
                  {u.orderCount} order{u.orderCount === 1 ? "" : "s"} · {u.unreadCount} unread
                  {u.lastLoginAt ? ` · last login ${formatDate(u.lastLoginAt)}` : " · never logged in"}
                </p>
              </div>
              <Button size="sm" variant={u.unreadCount > 0 ? "gold" : "outline"} onClick={() => setSelected(u)}>
                <FaEnvelope className="h-3.5 w-3.5" aria-hidden />
                Message
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MessageForm({ user, onClose, onSent }: { user: AdminUser; onClose: () => void; onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, subject, text }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send the message.");
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold text-ink">
          New message to {user.name}
          <span className="ml-2 text-sm font-normal text-muted">{user.email}</span>
        </p>
        <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
      </div>
      {error ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className="mt-3 space-y-4">
        <Field label="Subject" required>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={120}
            placeholder="Your treatment report"
          />
        </Field>
        <Field label="Message" required>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            maxLength={5000}
            minLength={2}
            placeholder="The user will read this in their dashboard Messages inbox and receive an unread badge."
          />
        </Field>
      </div>
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={busy}>
          {busy ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}