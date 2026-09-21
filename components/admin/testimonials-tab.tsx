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
  FaLanguage,
  FaPencil,
  FaPlus,
  FaStar,
  FaTrashCan,
} from "react-icons/fa6";

interface AdminTestimonial {
  _id: string;
  user?: { _id?: string; name?: string; email?: string } | null;
  name: string;
  city: string;
  country?: string;
  program: string;
  programFr?: string;
  text: string;
  textFr?: string;
  rating?: number;
  email?: string;
  videoUrl?: string;
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

/** Free auto-translate (EN -> FR) via /api/translate. Returns null on failure. */
async function postTranslate(source: string): Promise<string | null> {
  const text = source.trim();
  if (!text) return null;
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, target: "fr" }),
    });
    const data = (await res.json().catch(() => ({}))) as { translated?: string; error?: string };
    if (!res.ok || typeof data.translated !== "string") return null;
    return data.translated;
  } catch {
    return null;
  }
}

/** Translates program + text (EN -> FR). Each result is null when that call failed. */
async function translatePairToFr(program: string, text: string) {
  const [programTxt, textTxt] = await Promise.all([postTranslate(program), postTranslate(text)]);
  return { program: programTxt, text: textTxt };
}

/** One-click "fill the French fields for me" button (uses the free translation API). */
function AutoTranslateButton({
  onTranslate,
  disabled,
}: {
  onTranslate: () => Promise<boolean>;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const click = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    let ok = false;
    try {
      ok = await onTranslate();
    } finally {
      setBusy(false);
    }
    if (!ok) setFailed(true);
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <Button type="button" variant="outline" size="sm" onClick={click} disabled={busy || disabled}>
        <FaLanguage className="h-3.5 w-3.5" aria-hidden />
        {busy ? "Translating…" : "Auto-translate to French"}
      </Button>
      {failed ? <span className="text-xs text-red-600">Unavailable - type it manually</span> : null}
    </span>
  );
}

export function AdminTestimonialsTab() {
  const [items, setItems] = useState<AdminTestimonial[] | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editFrProgram, setEditFrProgram] = useState("");
  const [editFrText, setEditFrText] = useState("");
  const [editVideo, setEditVideo] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [translateId, setTranslateId] = useState<string | null>(null);
  const [frProgram, setFrProgram] = useState("");
  const [frText, setFrText] = useState("");
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
    void patch(
      t._id,
      { text: editText, videoUrl: editVideo, programFr: editFrProgram.trim(), textFr: editFrText.trim() },
      "Testimonial updated."
    );
    setEditingId(null);
  };

  const openTranslate = (t: AdminTestimonial) => {
    setTranslateId((cur) => (cur === t._id ? null : t._id));
    setFrProgram(t.programFr || "");
    setFrText(t.textFr || "");
  };

  const approveWithTranslation = (t: AdminTestimonial) => {
    void patch(
      t._id,
      { status: "approved", programFr: frProgram.trim(), textFr: frText.trim() },
      "Approved - now live on the site."
    );
    setTranslateId(null);
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
            {filter === "pending" ? "No testimonials awaiting review." : "No testimonials in this list yet - try another filter or add one."}
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
                      <span className="flex items-center gap-0.5 text-gold-500">
                        {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                          <FaStar key={j} className="h-3 w-3" aria-hidden />
                        ))}
                      </span>
                      <TestimonialStatusBadge status={t.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {t.city}
                      {t.country ? `, ${t.country}` : ""} · {t.program} · {formatDate(t.createdAt)}
                      {t.email ? ` · ${t.email}` : ""}
                      {t.videoUrl ? " · video review linked" : ""}
                      {t.textFr ? " · French translation added" : ""}
                      {t.user?.name ? ` · submitted by ${t.user.name} (${t.user.email})` : " · added by clinic"}
                    </p>
                  </div>
                </div>

                {editing ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-end">
                      <AutoTranslateButton
                        disabled={busyId === t._id}
                        onTranslate={async () => {
                          const r = await translatePairToFr(t.program, t.text);
                          if (r.program !== null) setEditFrProgram(r.program);
                          if (r.text !== null) setEditFrText(r.text);
                          return r.program !== null || r.text !== null;
                        }}
                      />
                    </div>
                    <Input
                      value={editFrProgram}
                      onChange={(e) => setEditFrProgram(e.target.value)}
                      placeholder="Program in French (optional)"
                      maxLength={100}
                    />
                    <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} maxLength={1200} />
                    <Textarea
                      value={editFrText}
                      onChange={(e) => setEditFrText(e.target.value)}
                      placeholder="Testimonial text in French (optional)"
                      maxLength={2000}
                    />
                    <Input
                      value={editVideo}
                      onChange={(e) => setEditVideo(e.target.value)}
                      placeholder="Video review link (YouTube / Google Drive / Vimeo) - leave empty for none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEdit(t)}>
                        Save changes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-relaxed text-ink">{t.text}</p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  {t.status !== "approved" ? (
                    <Button size="sm" disabled={busyId === t._id} onClick={() => openTranslate(t)}>
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
                  <Button variant="ghost" size="sm" disabled={busyId === t._id} onClick={() => { setEditingId(editing ? null : t._id); setEditText(t.text); setEditFrProgram(t.programFr || ""); setEditFrText(t.textFr || ""); setEditVideo(t.videoUrl || ""); }}>
                    <FaPencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" disabled={busyId === t._id} onClick={() => void remove(t)}>
                    <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>

                {translateId === t._id ? (
                  <div className="mt-3 rounded-md border border-gold-200 bg-gold-50/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-forest-800">
                        Optional French version - shown to French-speaking visitors. Leave empty to keep the English text.
                      </p>
                      <AutoTranslateButton
                        disabled={busyId === t._id}
                        onTranslate={async () => {
                          const r = await translatePairToFr(t.program, t.text);
                          if (r.program !== null) setFrProgram(r.program);
                          if (r.text !== null) setFrText(r.text);
                          return r.program !== null || r.text !== null;
                        }}
                      />
                    </div>
                    <div className="mt-2 grid gap-2">
                      <Input
                        value={frProgram}
                        onChange={(e) => setFrProgram(e.target.value)}
                        placeholder="Program in French (optional)"
                        maxLength={100}
                      />
                      <Textarea
                        value={frText}
                        onChange={(e) => setFrText(e.target.value)}
                        placeholder="Testimonial text in French (optional)"
                        rows={3}
                        maxLength={2000}
                      />
                    </div>
                    <div className="mt-2 flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setTranslateId(null)}>
                        Cancel
                      </Button>
                      <Button size="sm" disabled={busyId === t._id} onClick={() => approveWithTranslation(t)}>
                        <FaCheck className="h-3.5 w-3.5" aria-hidden />
                        Approve
                      </Button>
                    </div>
                  </div>
                ) : null}
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
  const [programFr, setProgramFr] = useState("");
  const [text, setText] = useState("");
  const [textFr, setTextFr] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [email, setEmail] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
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
        body: JSON.stringify({ name, city, country, program, text, programFr, textFr, rating, email, videoUrl, status }),
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
        <Field label="Rating" hint="1 - 5 stars">
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink focus:border-forest-500 focus:outline-none"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} star{r > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Email">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="client@example.com" />
        </Field>
        <Field label="Testimonial text" required className="sm:col-span-2">
          <Textarea value={text} onChange={(e) => setText(e.target.value)} required minLength={20} maxLength={1200} />
        </Field>
        <div className="flex justify-end sm:col-span-2">
          <AutoTranslateButton
            disabled={busy}
            onTranslate={async () => {
              const r = await translatePairToFr(program, text);
              if (r.program !== null) setProgramFr(r.program);
              if (r.text !== null) setTextFr(r.text);
              return r.program !== null || r.text !== null;
            }}
          />
        </div>
        <Field
          label="Program (French)"
          hint="Optional - shown to French-speaking visitors"
          className="sm:col-span-2"
        >
          <Input value={programFr} onChange={(e) => setProgramFr(e.target.value)} maxLength={100} placeholder="e.g. Soutien au diabète et à la santé métabolique" />
        </Field>
        <Field
          label="Testimonial text (French)"
          hint="Optional - if left empty, French visitors see the English text"
          className="sm:col-span-2"
        >
          <Textarea value={textFr} onChange={(e) => setTextFr(e.target.value)} maxLength={2000} placeholder="French translation of the testimonial" />
        </Field>
        <Field
          label="Video review link"
          hint="Paste a YouTube, Google Drive or Vimeo link (optional)"
          className="sm:col-span-2"
        >
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/... or https://youtube.com/watch?v=..."
          />
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