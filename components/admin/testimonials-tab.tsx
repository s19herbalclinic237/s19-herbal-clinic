"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import { formatDate, TestimonialStatusBadge } from "@/components/account/badges";
import {
  FaArrowRotateLeft,
  FaBan,
  FaCheck,
  FaCommentMedical,
  FaPencil,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";

interface AdminTestimonial {
  _id: string;
  user?: { _id?: string; name?: string; email?: string } | null;
  name: string;
  city: string;
  country?: string;
  program: string;
  text: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export function AdminTestimonialsTab() {
  const [items, setItems] = useState<AdminTestimonial[] | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = (status: StatusFilter = filter) => {
    let active = true;
    const url = status === "all" ? "/api/admin/testimonials" : `/api/admin/testimonials?status=${status}`;
    fetch(url, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setItems(Array.isArray(data.testimonials) ? data.testimonials : []);
      })
      .catch(() => {
        if (active) setError("Could not load testimonials.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const patch = async (id: string, body: Record<string, unknown>, message: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        testimonial?: Partial<AdminTestimonial>;
      };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setItems((prev) => (prev === null ? prev : prev.map((t) => (t._id === id ? { ...t, ...(data.testimonial ?? {}) } : t))));
      notify(message);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (t: AdminTestimonial) => {
    if (!window.confirm("Delete this testimonial permanently?")) return;
    setBusyId(t._id);
    try {
      const res = await fetch(`/api/admin/testimonials/${t._id}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setItems((prev) => (prev === null ? prev : prev.filter((x) => x._id !== t._id)));
      notify("Testimonial deleted.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const saveEdit = (t: AdminTestimonial) => {
    void patch(t._id, { text: editText }, "Testimonial updated.");
    setEditingId(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Testimonial Moderation</p>
          <p className="text-sm text-muted">Approved stories are shown on the site.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => load()}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            Add manually
          </Button>
        </div>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">{toast}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setItems(null);
              setFilter(f.id);
            }}
            className={
              filter === f.id
                ? "rounded-full border border-forest-700 bg-forest-800 px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full border border-line-strong bg-white px-3 py-1 text-xs font-medium text-muted hover:border-forest-300 hover:text-ink"
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {showAdd ? <AddTestimonialForm onDone={(msg) => { setShowAdd(false); notify(msg); load(filter); }} /> : null}

      {items === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaCommentMedical className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            {filter === "pending" ? "No testimonials awaiting review." : "No testimonials in this list."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((t) => {
            const editing = editingId === t._id;
            return (
              <li key={t._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{t.name}</p>
                      <TestimonialStatusBadge status={t.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {t.city}
                      {t.country ? `, ${t.country}` : ""} · {t.program} · {formatDate(t.createdAt)}
                      {t.user?.name ? ` · submitted by ${t.user.name} (${t.user.email})` : " · added by clinic"}
                    </p>
                  </div>
                </div>

                {editing ? (
                  <div className="mt-3 space-y-2">
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={1200} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(t)}>
                        Save text
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-ink">{t.text}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {t.status !== "approved" ? (
                    <Button size="sm" disabled={busyId === t._id} onClick={() => void patch(t._id, { status: "approved" }, "Approved - now live on the site.")}>
                      <FaCheck className="h-3.5 w-3.5" aria-hidden />
                      Approve
                    </Button>
                  ) : null}
                  {t.status !== "rejected" ? (
                    <Button variant="outline" size="sm" disabled={busyId === t._id} onClick={() => void patch(t._id, { status: "rejected" }, "Rejected.")}>
                      <FaBan className="h-3.5 w-3.5" aria-hidden />
                      Reject
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" disabled={busyId === t._id} onClick={() => { setEditingId(editing ? null : t._id); setEditText(t.text); }}>
                    <FaPencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" disabled={busyId === t._id} onClick={() => void remove(t)}>
                    <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AddTestimonialForm({ onDone }: { onDone: (message: string) => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [program, setProgram] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"pending" | "approved">("pending");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, country, program, text, status }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save.");
      onDone(status === "approved" ? "Testimonial saved and approved." : "Testimonial added - pending review.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <p className="font-display text-base font-semibold text-ink">Add a testimonial</p>
      {error ? (
        <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <Field label="Customer name" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" required>
            <Input value={city} onChange={(e) => setCity(e.target.value)} required minLength={2} />
          </Field>
          <Field label="Country">
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Cameroun" />
          </Field>
        </div>
        <Field label="Program / concern" required className="sm:col-span-2">
          <Input value={program} onChange={(e) => setProgram(e.target.value)} required minLength={2} />
        </Field>
        <Field label="Testimonial text" required className="sm:col-span-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} required minLength={20} maxLength={1200} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "pending" | "approved")}
          className="rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink focus:border-forest-500 focus:outline-none"
        >
          <option value="pending">Save as pending</option>
          <option value="approved">Approve immediately</option>
        </select>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save testimonial"}
        </Button>
      </div>
    </form>
  );
}