"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/components/account/badges";
import { FaEnvelopeOpen } from "react-icons/fa6";

interface MessageView {
  _id: string;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export function MessagesTab() {
  const [messages, setMessages] = useState<MessageView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/messages", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setMessages(Array.isArray(data.messages) ? data.messages : []);
      })
      .catch(() => {
        if (active) setError("Could not load your messages.");
      });
    return () => {
      active = false;
    };
  }, []);

  function markRead(id: string) {
    setMessages((prev) => (prev ? prev.map((m) => (m._id === id ? { ...m, read: true } : m)) : prev));
    fetch(`/api/messages/${id}/read`, { method: "POST", credentials: "include" }).catch(() => {});
  }

  if (error) {
    return <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }

  if (!messages) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-white p-8 text-center">
        <FaEnvelopeOpen className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
        <p className="mt-3 text-sm text-muted">
          No messages yet. The clinic will reach out here with order updates, reports, and news.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((m) => (
        <li
          key={m._id}
          className={`rounded-lg border p-4 sm:p-5 ${m.read ? "border-line bg-white" : "border-gold-300 bg-gold-50"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink">
                {!m.read ? <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gold-600 align-middle" aria-hidden /> : null}
                {m.subject}
              </p>
              <p className="mt-0.5 text-xs text-muted">{formatDate(m.createdAt)}</p>
            </div>
            {!m.read ? (
              <button
                type="button"
                onClick={() => markRead(m._id)}
                className="shrink-0 rounded-md border border-line-strong bg-white px-2.5 py-1 text-xs font-semibold text-forest-700 hover:bg-forest-50"
              >
                Mark as read
              </button>
            ) : null}
          </div>
          {m.body ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{m.body}</p> : null}
        </li>
      ))}
    </ul>
  );
}