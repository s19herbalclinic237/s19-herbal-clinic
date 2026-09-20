"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { formatDate } from "@/components/account/badges";
import { StoryVideo } from "@/components/testimonials/story-video";
import {
  FaArrowRotateLeft,
  FaLink,
  FaPencil,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";

interface AdminVideoReview {
  _id: string;
  url: string;
  title?: string;
  active: boolean;
  createdAt: string;
}

/**
 * Admin tab for the Live Reviews page. Paste video links (YouTube, Google
 * Drive or Vimeo) — they appear on /live-reviews in the order they were
 * pasted (oldest first).
 */
export function AdminVideosTab() {
  const [items, setItems] = useState<AdminVideoReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pasteUrl, setPasteUrl] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [busyAdd, setBusyAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const load = () => {
    let active = true;
    fetch("/api/admin/video-reviews", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setItems(Array.isArray(data.videos) ? data.videos : []);
      })
      .catch(() => {
        if (active) setError("Could not load video reviews.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busyAdd) return;
    setBusyAdd(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/video-reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: pasteUrl, title: pasteTitle }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        video?: AdminVideoReview;
      };
      if (!res.ok) throw new Error(data.error || "Could not save the video review.");
      setPasteUrl("");
      setPasteTitle("");
      setItems((prev) => (prev === null ? prev : [...prev, data.video as AdminVideoReview]));
      notify("Video review added - it is live on the Live Reviews page.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyAdd(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, message: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/video-reviews/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; video?: AdminVideoReview };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setItems((prev) => (prev === null ? prev : prev.map((v) => (v._id === id ? { ...v, ...(data.video ?? {}) } : v))));
      notify(message);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (v: AdminVideoReview) => {
    if (!window.confirm("Delete this video review?")) return;
    setBusyId(v._id);
    try {
      const res = await fetch(`/api/admin/video-reviews/${v._id}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setItems((prev) => (prev === null ? prev : prev.filter((x) => x._id !== v._id)));
      notify("Video review deleted.");
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Live Reviews</p>
          <p className="text-sm text-muted">
            Paste video links below - they appear on the Live Reviews page in the order they are pasted.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load()}>
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

      <form onSubmit={add} className="rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Video link" required>
            <Input
              value={pasteUrl}
              onChange={(e) => setPasteUrl(e.target.value)}
              placeholder="https://drive.google.com/file/d/... or YouTube / Vimeo link"
              required
            />
          </Field>
          <Field label="Title (optional)">
            <Input value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder="e.g. Marie's review" />
          </Field>
          <Button type="submit" disabled={busyAdd} className="mb-0.5">
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            {busyAdd ? "Adding…" : "Paste link"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Supported: YouTube, Google Drive and Vimeo links. Google Drive files must be shared with
          &quot;Anyone with the link&quot; to play.
        </p>
      </form>

      {items === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaLink className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            No video reviews yet - paste your first link above.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((v, index) => {
            const editing = editingId === v._id;
            return (
              <li key={v._id} className="rounded-lg border border-line bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">
                      <span className="mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-100 px-1.5 text-xs font-bold text-forest-800">
                        #{index + 1}
                      </span>
                      {editing ? (
                        "Editing"
                      ) : (
                        <span>{v.title || "Untitled review"}</span>
                      )}
                    </p>
                    <p className="mt-0.5 max-w-xl truncate text-xs text-muted">
                      <a href={v.url} target="_blank" rel="noopener noreferrer" className="hover:text-forest-700 hover:underline">
                        {v.url}
                      </a>
                      {" · "}added {formatDate(v.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {v.active ? (
                      <span className="rounded-full bg-forest-100 px-2 py-0.5 text-xs font-semibold text-forest-800">Visible</span>
                    ) : (
                      <span className="rounded-full bg-line px-2 py-0.5 text-xs font-semibold text-muted">Hidden</span>
                    )}
                  </div>
                </div>

                {editing ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      placeholder="Video link"
                    />
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Title (optional)"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          void patch(v._id, { url: editUrl, title: editTitle }, "Video review updated.");
                          setEditingId(null);
                        }}
                      >
                        Save changes
                      </Button>
                    </div>
                  </div>
                ) : null}

                <StoryVideo url={v.url} />

                <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                  <Button
                    size="sm"
                    disabled={busyId === v._id}
                    onClick={() => void patch(v._id, { active: !v.active }, v.active ? "Hidden on the Live Reviews page." : "Visible on the Live Reviews page.")}
                  >
                    {v.active ? "Hide" : "Show"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === v._id}
                    onClick={() => {
                      setEditingId(editing ? null : v._id);
                      setEditUrl(v.url);
                      setEditTitle(v.title || "");
                    }}
                  >
                    <FaPencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    disabled={busyId === v._id}
                    onClick={() => void remove(v)}
                  >
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