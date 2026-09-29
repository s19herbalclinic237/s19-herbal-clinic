"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatDate } from "@/components/account/badges";
import {
  FaEnvelopeOpen,
  FaPaperPlane,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa6";

interface MessageView {
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
  messages: MessageView[];
  unread: boolean;
  lastAt: string;
}

export function MessagesTab() {
  const { t } = useLocale();
  const [messages, setMessages] = useState<MessageView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);

  const load = () => {
    let active = true;
    fetch("/api/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setMessages(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch(() => {
        if (active) setError(t("dash.messages.loadError"));
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, [t]);

  const threads: ThreadView[] = useMemo(() => {
    const list = messages || [];
    const byKey = new Map<string, MessageView[]>();
    for (const m of list) {
      const key = m.thread || m._id;
      const arr = byKey.get(key) || [];
      arr.push(m);
      byKey.set(key, arr);
    }
    return Array.from(byKey.entries())
      .map(([key, arr]) => {
        arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
        const root = arr[0];
        const last = arr[arr.length - 1];
        return {
          key,
          subject: root.subject,
          messages: arr,
          unread: arr.some((m) => m.author === "admin" && !m.read),
          lastAt: last.createdAt,
        };
      })
      .sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
  }, [messages]);

  function markThreadRead(key: string) {
    const thread = threads.find((th) => th.key === key);
    if (!thread) return;
    for (const m of thread.messages) {
      if (m.author === "admin" && !m.read) {
        fetch(`/api/messages/${m._id}/read`, { method: "POST", credentials: "include" }).catch(() => {});
      }
    }
    setMessages((prev) =>
      prev
        ? prev.map((m) =>
            (m.thread || m._id) === key && m.author === "admin" ? { ...m, read: true } : m
          )
        : prev
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("dash.messages.intro")}</p>
        <Button size="sm" onClick={() => setComposing((v) => !v)}>
          {composing ? t("dash.messages.cancel") : (
            <>
              <FaPlus className="h-3.5 w-3.5" aria-hidden />
              {t("dash.messages.new")}
            </>
          )}
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {composing ? (
        <NewThreadForm
          onSent={() => {
            setComposing(false);
            load();
          }}
        />
      ) : null}

      {!messages ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {messages && messages.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaEnvelopeOpen className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">{t("dash.messages.empty")}</p>
        </div>
      ) : null}

      {messages && messages.length > 0 ? (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const lastMsg = thread.messages[thread.messages.length - 1];
            return (
              <li
                key={thread.key}
                className={`overflow-hidden rounded-lg border bg-white ${thread.unread ? "border-gold-300" : "border-line"}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenKey(openKey === thread.key ? null : thread.key);
                    if (openKey !== thread.key) markThreadRead(thread.key);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest-50/50 sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-bold text-ink">
                      {thread.unread ? (
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-gold-500" aria-hidden />
                      ) : null}
                      <span className="truncate">{thread.subject}</span>
                    </span>
                    <span className={`mt-0.5 block truncate text-xs ${thread.unread ? "font-semibold text-forest-800" : "text-muted"}`}>
                      {lastMsg.author === "user"
                        ? `${t("dash.messages.you")}: ${lastMsg.body}`
                        : `${t("dash.messages.clinicShort")}: ${lastMsg.body}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                    <span>{formatDate(thread.lastAt)}</span>
                    {openKey === thread.key ? (
                      <FaChevronUp className="h-3 w-3" aria-hidden />
                    ) : (
                      <FaChevronDown className="h-3 w-3" aria-hidden />
                    )}
                  </span>
                </button>
                {openKey === thread.key ? (
                  <div className="border-t border-forest-100 bg-cream/60 px-4 py-4 sm:px-5">
                    <ul className="space-y-2.5">
                      {thread.messages.map((m) => (
                        <li
                          key={m._id}
                          className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                            m.author === "user"
                              ? "ml-auto bg-forest-950 text-white"
                              : "border border-line bg-white text-ink"
                          }`}
                        >
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${m.author === "user" ? "text-gold-300" : "text-muted"}`}>
                            {m.author === "user" ? t("dash.messages.you") : t("dash.messages.clinic")} · {formatDate(m.createdAt)}
                          </p>
                          <p className="mt-1 whitespace-pre-line leading-relaxed">{m.body}</p>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-4 border-t border-forest-100 pt-4">
                      <ReplyForm threadId={thread.key} onSent={load} />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function NewThreadForm({ onSent }: { onSent: () => void }) {
  const { t } = useLocale();
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.messages.sendError"));
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dash.messages.sendError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <p className="font-display text-base font-semibold text-ink">{t("dash.messages.newThread")}</p>
      {error ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className="mt-3 space-y-4">
        <Field label={t("dash.messages.subject")} required>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={120}
            placeholder={t("dash.messages.subjectPh")}
          />
        </Field>
        <Field label={t("dash.messages.message")} required>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            minLength={2}
            maxLength={5000}
            rows={4}
            placeholder={t("dash.messages.messagePh")}
          />
        </Field>
      </div>
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={busy}>
          <FaPaperPlane className="h-3.5 w-3.5" aria-hidden />
          {busy ? t("dash.messages.sending") : t("dash.messages.send")}
        </Button>
      </div>
    </form>
  );
}

function ReplyForm({ threadId, onSent }: { threadId: string; onSent: () => void }) {
  const { t } = useLocale();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy || text.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.messages.replyError"));
      setText("");
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("dash.messages.replyError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <div className="min-w-52 flex-1">
        <Field label={t("dash.messages.reply")}>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={5000}
            placeholder={t("dash.messages.replyPh")}
          />
        </Field>
      </div>
      <Button type="submit" disabled={busy || text.trim().length < 2}>
        <FaPaperPlane className="h-3.5 w-3.5" aria-hidden />
        {busy ? t("dash.messages.sending") : t("dash.messages.sendReply")}
      </Button>
      {error ? <p className="w-full text-xs text-red-600">{error}</p> : null}
    </form>
  );
}