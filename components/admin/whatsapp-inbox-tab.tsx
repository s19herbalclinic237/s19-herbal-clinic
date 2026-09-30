"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FaArrowRotateLeft,
  FaBan,
  FaCircleCheck,
  FaCircleExclamation,
  FaClock,
  FaLock,
  FaPaperPlane,
  FaTriangleExclamation,
  FaUser,
  FaXmark,
} from "react-icons/fa6";

/**
 * The staff view of inbound WhatsApp messages.
 *
 * ## Why a read-only inbox ships with the webhook
 *
 * The clinic's WhatsApp Business App is not connected to this number. Before this
 * module, a patient who replied to an automated message was talking to nobody.
 * Adding a webhook without adding somewhere for staff to look would not fix that -
 * it would make the failure quieter, which is worse, because the clinic would
 * believe replies were being handled.
 *
 * ## Why there is no reply box
 *
 * Sending free-form text is only legal inside Meta's 24-hour customer service
 * window, and the clinic's own consent position has to be checked first. Both are
 * M2's job and neither is built. A compose box here would invite a clinician to
 * type into a window the system has not verified, and the failure mode - a message
 * that silently never arrives - is the exact one M1 exists to end.
 *
 * The thread does show whether the window is open, so the number is visible and
 * checkable before anything is allowed to act on it.
 */

interface InboxConversation {
  id: string;
  phone: string;
  patient: { id: string; name: string; email: string } | null;
  displayName: string;
  lastMessageAt: string;
  preview: string;
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  windowExpiresAt: string | null;
  unread: number;
  needsAttention: boolean;
  optedOut: string | null;
  lastStatus: string;
}

interface InboxPayload {
  filter: string;
  totals: { attention: number; unread: number; all: number };
  conversations: InboxConversation[];
  error?: string;
}

interface ThreadMessage {
  id: string;
  direction: "inbound" | "outbound";
  kind: string;
  text: string;
  payload: string;
  mediaId: string;
  intent: string;
  template: string;
  status: string;
  statusDetail: string;
  occurredAt: string;
}

interface ThreadPayload {
  id: string;
  phone: string;
  patient: { id: string; name: string; email: string } | null;
  displayName: string;
  windowExpiresAt: string | null;
  optedOut: string | null;
  serviceWindowOpen: boolean;
  lastStatus: string;
  messages: ThreadMessage[];
  error?: string;
}

function when(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/** How a message is described in the thread, without inventing a meaning. */
function describe(message: ThreadMessage): string {
  if (message.direction === "outbound") {
    return message.template ? `Template: ${message.template}` : "Outbound message";
  }
  if (message.text) return message.text;
  if (message.payload) return `Button: ${message.payload}`;
  if (message.mediaId) return `Sent a ${message.kind}`;
  if (message.intent) return `Sent a ${message.intent.replace("_", " ")}`;
  return `Sent a ${message.kind}`;
}

function FilterButton({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-md bg-forest-700 px-3 py-1.5 text-xs font-bold text-white"
          : "rounded-md border border-line-strong bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:text-ink"
      }
    >
      {children}
      <span className="ml-1.5 opacity-70">{count}</span>
    </button>
  );
}

export function WhatsAppInboxTab() {
  const [data, setData] = useState<InboxPayload | null>(null);
  const [filter, setFilter] = useState("attention");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadPayload | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetch(`/api/admin/whatsapp/inbox?filter=${filter}`, { credentials: "include" })
      .then((r) => r.json())
      .then((payload: InboxPayload) => {
        if (payload.error) setError(payload.error);
        else {
          setError(null);
          setData(payload);
        }
      })
      .catch(() => setError("Could not load the WhatsApp inbox."));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const openThread = useCallback(async (id: string) => {
    setOpenId(id);
    setThread(null);
    setThreadError(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/inbox/${id}`, { credentials: "include" });
      const payload = (await res.json()) as ThreadPayload;
      if (payload.error) setThreadError(payload.error);
      else setThread(payload);
      // Opening a thread is what "dealt with" means, so it clears the flags.
      await fetch(`/api/admin/whatsapp/inbox/${id}`, { method: "PATCH", credentials: "include" });
      load();
    } catch {
      setThreadError("Could not load this conversation.");
    }
  }, [load]);

  const markAllRead = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/whatsapp/inbox", { method: "PATCH", credentials: "include" });
      if (!res.ok) throw new Error("Could not clear the inbox.");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const conversations = data?.conversations ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">WhatsApp inbox</p>
          <p className="text-sm text-muted">
            Replies patients send to the clinic number. Read-only — outgoing messages are handled by
            the automation, not here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={markAllRead}
            disabled={busy || (data?.totals.attention ?? 0) + (data?.totals.unread ?? 0) === 0}
          >
            <FaCircleCheck className="h-3.5 w-3.5" aria-hidden />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FilterButton active={filter === "attention"} onClick={() => setFilter("attention")} count={data?.totals.attention ?? 0}>
          Needs a person
        </FilterButton>
        <FilterButton active={filter === "unread"} onClick={() => setFilter("unread")} count={data?.totals.unread ?? 0}>
          Unread
        </FilterButton>
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")} count={data?.totals.all ?? 0}>
          All
        </FilterButton>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {conversations.length === 0 ? (
        <p className="rounded-lg border border-line bg-white p-6 text-sm text-muted">
          Nothing here. Inbound messages appear once the webhook is configured — see{" "}
          <code className="rounded bg-forest-50 px-1 py-0.5 text-xs">docs/WHATSAPP_INBOUND.md</code>.
        </p>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => openThread(conversation.id)}
                className="w-full cursor-pointer rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-forest-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {conversation.patient ? (
                      <FaUser className="h-4 w-4 text-forest-600" aria-hidden />
                    ) : (
                      <FaTriangleExclamation className="h-4 w-4 text-amber-600" aria-hidden />
                    )}
                    <span className="font-semibold text-ink">
                      {conversation.patient?.name || conversation.displayName || `+…${conversation.phone.slice(-4)}`}
                    </span>
                    {conversation.patient ? null : (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        Not a known patient
                      </span>
                    )}
                    {conversation.optedOut ? (
                      <span
                        className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700"
                        title={`Asked to stop messages on ${when(conversation.optedOut)}`}
                      >
                        Opted out
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {conversation.unread > 0 && (
                      <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-ink">
                        {conversation.unread}
                      </span>
                    )}
                    {when(conversation.lastMessageAt)}
                  </div>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted">{conversation.preview || "—"}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {openId ? (
        <div className="rounded-xl border border-line bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-base font-semibold text-ink">
              {thread?.patient?.name || thread?.displayName || (thread ? `+…${thread.phone.slice(-4)}` : "…")}
            </p>
            <button
              type="button"
              onClick={() => {
                setOpenId(null);
                setThread(null);
              }}
              aria-label="Close conversation"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted hover:text-ink"
            >
              <FaXmark className="h-4 w-4" aria-hidden />
            </button>
          </div>

          {threadError ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {threadError}
            </p>
          ) : null}

          {thread ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {thread.optedOut ? (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 font-semibold text-red-700">
                    <FaBan className="h-3 w-3" aria-hidden />
                    Asked to stop messages {when(thread.optedOut)} — do not re-engage
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-forest-50 px-2 py-1 text-forest-800">
                  {thread.serviceWindowOpen ? (
                    <FaPaperPlane className="h-3 w-3" aria-hidden />
                  ) : (
                    <FaLock className="h-3 w-3" aria-hidden />
                  )}
                  {thread.serviceWindowOpen
                    ? `Free-form replies allowed until ${when(thread.windowExpiresAt)}`
                    : "Outside the 24-hour window — templates only"}
                </span>
                {thread.windowExpiresAt ? (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    <FaClock className="h-3 w-3" aria-hidden />
                    Window closes {when(thread.windowExpiresAt)}
                  </span>
                ) : null}
                {thread.lastStatus ? (
                  <span className="text-muted">Last send: {thread.lastStatus}</span>
                ) : null}
              </div>

              <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                <FaCircleExclamation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                <span>
                  This clinic number is not connected to the WhatsApp Business App, so nothing here is
                  visible to the patient until the automation replies. Until then, a patient who has
                  written in is waiting.
                </span>
              </p>

              <ul className="mt-4 space-y-3">
                {thread.messages.map((message) => {
                  const mine = message.direction === "outbound";
                  const failed = message.status === "failed";
                  return (
                    <li
                      key={message.id}
                      className={`rounded-lg border px-3 py-2 ${
                        mine ? "border-forest-200 bg-forest-50" : "border-line bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span className="font-bold uppercase tracking-wide">
                          {mine ? "Sent" : "Received"}
                        </span>
                        <span>{when(message.occurredAt)}</span>
                        {message.intent ? <span>intent: {message.intent}</span> : null}
                        {message.status ? (
                          <span className={failed ? "font-bold text-red-700" : ""}>
                            {message.status}
                            {message.statusDetail ? ` — ${message.statusDetail}` : ""}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{describe(message)}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
