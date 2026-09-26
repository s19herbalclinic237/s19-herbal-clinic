"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/account/badges";
import { useAuth } from "@/lib/auth-context";
import {
  FaArrowRotateLeft,
  FaEnvelope,
  FaPaperPlane,
  FaPlus,
  FaUsers,
} from "react-icons/fa6";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified: boolean;
  isActive: boolean;
  mrn: string;
  lastLoginAt: string | null;
  createdAt: string;
  orderCount: number;
  unreadCount: number;
  replyCount: number;
}

interface MsgView {
  _id: string;
  subject: string;
  body: string;
  read: boolean;
  author?: "admin" | "user";
  thread?: string;
  createdAt: string;
}

interface ThreadView {
  key: string;
  subject: string;
  messages: MsgView[];
  lastAt: string;
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
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.mrn.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Message Users</p>
          <p className="text-sm text-muted">
            Send reports, plans and medical information - and reply to your patients&apos; messages.
          </p>
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
        <Conversation
          user={selected}
          onClose={() => {
            setSelected(null);
            load();
          }}
          onSent={() => notify("Message sent. The user will see it in their messages inbox.")}
          onMrnChange={(mrn) => setSelected((prev) => (prev ? { ...prev, mrn } : prev))}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <Input placeholder="Search by name, email, phone or MRN…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search users" />
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
                  {u.mrn ? (
                    <span className="ml-2 inline-block rounded bg-forest-700 px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wider text-white">
                      MRN {u.mrn}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-muted">
                  {u.email}
                  {u.phone ? ` · ${u.phone}` : ""} · joined {formatDate(u.createdAt)}
                </p>
                <p className="text-xs text-muted">
                  {u.orderCount} order{u.orderCount === 1 ? "" : "s"}
                  {u.replyCount > 0 ? (
                    <span className="font-bold text-forest-800">
                      {" "}· {u.replyCount} new reply{u.replyCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                  {" "}· {u.unreadCount} unread
                  {u.lastLoginAt ? ` · last login ${formatDate(u.lastLoginAt)}` : " · never logged in"}
                </p>
              </div>
              <Button size="sm" variant={u.replyCount > 0 || u.unreadCount > 0 ? "gold" : "outline"} onClick={() => setSelected(u)}>
                <FaEnvelope className="h-3.5 w-3.5" aria-hidden />
                {u.replyCount > 0 ? `Conversations (${u.replyCount} new)` : "Message"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Conversation({
  user,
  onClose,
  onSent,
  onMrnChange,
}: {
  user: AdminUser;
  onClose: () => void;
  onSent: () => void;
  onMrnChange: (mrn: string) => void;
}) {
  const { user: me } = useAuth();
  const [messages, setMessages] = useState<MsgView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [editingMrn, setEditingMrn] = useState(false);
  const [mrnDraft, setMrnDraft] = useState(user.mrn || "");
  const [savingMrn, setSavingMrn] = useState(false);
  const [mrnError, setMrnError] = useState<string | null>(null);

  const isAdmin = me?.role === "admin";

  const saveMrn = async (value?: string) => {
    setSavingMrn(true);
    setMrnError(null);
    try {
      const next = (value ?? mrnDraft).trim().toUpperCase();
      const res = await fetch("/api/admin/mrn", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, mrn: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setMrnError(data.error || "Could not update the Medical Record Number.");
        setSavingMrn(false);
        return;
      }
      onMrnChange(next);
      setEditingMrn(false);
      setSavingMrn(false);
    } catch {
      setMrnError("Could not update the Medical Record Number.");
      setSavingMrn(false);
    }
  };

  const load = () => {
    let active = true;
    fetch(`/api/admin/messages?userId=${user.id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setMessages(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch(() => {
        if (active) setError("Could not load the conversation.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const threads: ThreadView[] = useMemo(() => {
    const list = messages || [];
    const byKey = new Map<string, MsgView[]>();
    for (const m of list) {
      const key = m.thread || m._id;
      const arr = byKey.get(key) || [];
      arr.push(m);
      byKey.set(key, arr);
    }
    return Array.from(byKey.entries())
      .map(([key, arr]) => {
        arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        const last = arr[arr.length - 1];
        return { key, subject: arr[0].subject, messages: arr, lastAt: last.createdAt };
      })
      .sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
  }, [messages]);

  const activeThread = threads.find((t) => t.key === openKey) || null;

  return (
    <div className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold text-ink">
          Conversation with {user.name}
          <span className="ml-2 text-sm font-normal text-muted">{user.email}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {error ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-3 rounded-lg border border-forest-100 bg-white px-3 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
              Medical Record Number
            </p>
            {user.mrn ? (
              <p className="font-display text-lg font-semibold tracking-wider text-ink">{user.mrn}</p>
            ) : (
              <p className="text-sm text-muted">Not assigned yet.</p>
            )}
          </div>
          {isAdmin && !editingMrn ? (
            <Button variant="outline" size="sm" onClick={() => { setMrnDraft(user.mrn || ""); setMrnError(null); setEditingMrn(true); }}>
              {user.mrn ? "Edit MRN" : "Assign MRN"}
            </Button>
          ) : null}
        </div>
        {isAdmin && editingMrn ? (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Input
              value={mrnDraft}
              onChange={(e) => setMrnDraft(e.target.value)}
              placeholder="e.g. S1900615"
              aria-label="Medical Record Number"
              className="w-56"
              autoFocus
            />
            <Button size="sm" onClick={() => void saveMrn()} disabled={savingMrn}>
              {savingMrn ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingMrn(false)} disabled={savingMrn}>
              Cancel
            </Button>
            {user.mrn ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={savingMrn}
                onClick={() => void saveMrn("")}
              >
                Remove
              </Button>
            ) : null}
          </div>
        ) : null}
        {mrnError ? (
          <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{mrnError}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => setComposing((v) => !v)}>
          {composing ? "Cancel new" : (
            <>
              <FaPlus className="h-3.5 w-3.5" aria-hidden />
              New message
            </>
          )}
        </Button>
      </div>

      {composing ? (
        <NewAdminMessage
          user={user}
          onSent={() => {
            setComposing(false);
            load();
            onSent();
          }}
        />
      ) : null}

      {!messages ? (
        <div className="mt-3 flex h-24 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {messages && messages.length === 0 ? (
        <div className="mt-3 rounded-lg border border-line bg-white p-6 text-center">
          <FaEnvelope className="mx-auto h-6 w-6 text-forest-300" aria-hidden />
          <p className="mt-2 text-sm text-muted">
            No conversations yet. Send the first message and it will appear here.
          </p>
        </div>
      ) : null}

      {messages && messages.length > 0 ? (
        <div className="mt-3 grid gap-3 lg:grid-cols-[240px_1fr]">
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {threads.map((t) => (
              <li key={t.key}>
                <button
                  type="button"
                  onClick={() => setOpenKey(t.key)}
                  className={`w-full cursor-pointer px-3 py-2.5 text-left transition-colors hover:bg-forest-50/60 ${
                    openKey === t.key ? "bg-forest-50" : ""
                  }`}
                >
                  <span className="block truncate text-xs font-bold text-ink">{t.subject}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {formatDate(t.lastAt)}
                    {t.messages[t.messages.length - 1].author === "user" ? " · from patient" : " · from clinic"}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-line bg-white">
            {activeThread ? (
              <div className="flex flex-col">
                <ul className="max-h-80 space-y-2 overflow-y-auto p-3.5">
                  {activeThread.messages.map((m) => (
                    <li
                      key={m._id}
                      className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                        m.author === "admin"
                          ? "bg-forest-950 text-white"
                          : "ml-auto border border-line bg-cream/70 text-ink"
                      }`}
                    >
                      <p className={`text-[10px] font-bold uppercase tracking-wide ${m.author === "admin" ? "text-gold-300" : "text-muted"}`}>
                        {m.author === "admin" ? "Clinic" : user.name} · {formatDate(m.createdAt)}
                      </p>
                      <p className="mt-1 whitespace-pre-line leading-relaxed">{m.body}</p>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-forest-100 p-3.5">
                  <AdminReplyForm
                    user={user}
                    threadId={activeThread.key}
                    onSent={() => {
                      load();
                      onSent();
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted">
                Choose a conversation on the left, or start a new message.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NewAdminMessage({
  user,
  onSent,
}: {
  user: AdminUser;
  onSent: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
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
    <form onSubmit={submit} className="mt-3 rounded-lg border border-forest-200 bg-white p-4">
      <p className="text-sm font-bold text-ink">New message to {user.name}</p>
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

function AdminReplyForm({
  user,
  threadId,
  onSent,
}: {
  user: AdminUser;
  threadId: string;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || text.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, text, thread: threadId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not send the message.");
      setText("");
      onSent();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="min-w-52 flex-1">
        <Field label="Reply">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={5000}
            placeholder="Reply in this conversation…"
          />
        </Field>
      </div>
      <Button type="submit" disabled={busy || text.trim().length < 2}>
        <FaPaperPlane className="h-3.5 w-3.5" aria-hidden />
        {busy ? "Sending…" : "Send reply"}
      </Button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </form>
  );
}