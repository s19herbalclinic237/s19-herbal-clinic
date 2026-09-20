"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/account/badges";
import {
  FaArrowRotateLeft,
  FaCloudArrowUp,
  FaImage,
  FaNewspaper,
  FaPencil,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  cover?: string;
  author: string;
  status: "draft" | "published";
  featured: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  titleFr?: string;
  excerptFr?: string;
  bodyFr?: string;
  authorFr?: string;
}

type PostDraft = Omit<BlogPost, "_id" | "publishedAt" | "createdAt" | "updatedAt">;

const emptyDraft: PostDraft = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  cover: "",
  author: "S19 Herbal Clinic",
  status: "draft",
  featured: false,
  titleFr: "",
  excerptFr: "",
  bodyFr: "",
  authorFr: "",
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 120);
}

const statusClasses: Record<string, string> = {
  draft: "border-line-strong bg-cream text-muted",
  published: "border-forest-300 bg-forest-50 text-forest-800",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
};

export function PostsTab() {
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PostDraft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = () => {
    let active = true;
    fetch("/api/admin/posts", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setPosts(Array.isArray(data.posts) ? data.posts : []);
      })
      .catch(() => {
        if (active) setError("Could not load posts.");
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

  const handleStatus = async (p: BlogPost) => {
    const next = p.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/posts/${p._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setPosts((prev) => (prev === null ? prev : prev.map((x) => (x._id === p._id ? { ...x, status: next } : x))));
      notify(next === "published" ? "Post published - live on the blog." : "Moved back to drafts.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const handleFeatured = async (p: BlogPost) => {
    try {
      const res = await fetch(`/api/admin/posts/${p._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !p.featured }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setPosts((prev) => (prev === null ? prev : prev.map((x) => (x._id === p._id ? { ...x, featured: !p.featured } : x))));
      notify("Featured updated.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const handleDelete = async (p: BlogPost) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${p._id}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setPosts((prev) => (prev === null ? prev : prev.filter((x) => x._id !== p._id)));
      notify("Post deleted.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const filtered = posts?.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.title.toLowerCase().includes(q) || p.slug.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Blog Posts</p>
          <p className="text-sm text-muted">Write, edit and publish educational articles.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <FaArrowRotateLeft className="h-3.5 w-3.5" aria-hidden />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditId(null);
              setEditing({ ...emptyDraft });
            }}
          >
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            New post
          </Button>
        </div>
      </div>

      {toast ? (
        <p className="rounded-md border border-forest-200 bg-forest-50 px-3 py-2 text-sm text-forest-800">{toast}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {editing ? (
        <PostForm
          initial={editing}
          existingId={editId}
          busy={busy}
          setBusy={setBusy}
          onCancel={() => {
            setEditing(null);
            setEditId(null);
          }}
          onSaved={(post, id) => {
            const isNew = !(posts ?? []).some((x) => x._id === id);
            setPosts((prev) => {
              if (prev === null) return prev;
              if (!prev.some((x) => x._id === id)) return [post, ...prev];
              return prev.map((x) => (x._id === id ? post : x));
            });
            setEditing(null);
            setEditId(null);
            notify(isNew ? "Post created." : "Post updated.");
          }}
        />
      ) : null}

      <Input placeholder="Search posts…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search posts" />

      {posts === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaNewspaper className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No posts yet. Write your first article.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {(filtered || []).map((p) => (
            <li key={p._id} className="flex flex-wrap items-center gap-3 p-3 sm:px-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                <p className="truncate text-xs text-muted">
                  /blog/{p.slug} · {formatDate(p.updatedAt ?? p.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  statusClasses[p.status] || ""
                }`}
              >
                {statusLabels[p.status]}
              </span>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <input
                  type="checkbox"
                  checked={p.featured}
                  onChange={() => void handleFeatured(p)}
                  className="h-3.5 w-3.5 accent-forest-700"
                />
                Featured
              </label>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleStatus(p)}
                >
                  {p.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${p.title}`}
                  onClick={() => {
                    setEditId(p._id);
                    setEditing({ ...p } as PostDraft);
                  }}
                >
                  <FaPencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${p.title}`}
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => void handleDelete(p)}
                >
                  <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PostForm({
  initial,
  existingId,
  busy,
  setBusy,
  onCancel,
  onSaved,
}: {
  initial: PostDraft;
  existingId: string | null;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onCancel: () => void;
  onSaved: (post: BlogPost, id: string) => void;
}) {
  const [draft, setDraft] = useState<PostDraft>(initial);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inlineUploading, setInlineUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const set = (key: keyof PostDraft, value: string | boolean) => setDraft((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: string };
      if (!res.ok || !data.secure_url) throw new Error(data.error || "Upload failed.");
      set("cover", data.secure_url);
    } catch (e) {
      setFormError((e as Error).message || "Upload failed. Paste an image URL instead.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const insertImageIntoBody = (url: string) => {
    const ta = bodyRef.current;
    const start = ta?.selectionStart ?? draft.body.length;
    const end = ta?.selectionEnd ?? draft.body.length;
    const block = `![Photo](${url})`;
    const before = draft.body.slice(0, start).trimEnd();
    const after = draft.body.slice(end).trimStart();
    const nextBody = [before, block, after].filter((s) => s.length > 0).join("\n\n");
    set("body", nextBody);
    requestAnimationFrame(() => {
      const nextTa = bodyRef.current;
      if (nextTa) {
        nextTa.focus();
        const pos = nextBody.indexOf(block) + block.length;
        nextTa.setSelectionRange(pos, pos);
      }
    });
  };

  const handleInlineUpload = async (file: File) => {
    setInlineUploading(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", credentials: "include", body: formData });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: string };
      if (!res.ok || !data.secure_url) throw new Error(data.error || "Upload failed.");
      insertImageIntoBody(data.secure_url);
    } catch (e) {
      setFormError((e as Error).message || "Upload failed. Paste the image URL instead.");
    } finally {
      setInlineUploading(false);
      if (inlineFileRef.current) inlineFileRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (existingId) {
        const res = await fetch(`/api/admin/posts/${existingId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; post?: BlogPost };
        if (!res.ok) throw new Error(data.error || "Could not save.");
        onSaved(data.post as BlogPost, existingId);
      } else {
        const res = await fetch("/api/admin/posts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string; post?: BlogPost };
        if (!res.ok) throw new Error(data.error || "Could not save.");
        const post = data.post as BlogPost;
        onSaved(post, String(post._id));
      }
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold text-ink">{existingId ? "Edit post" : "New post"}</p>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>

      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2">
          <Input
            value={draft.title}
            onChange={(e) => {
              set("title", e.target.value);
              if (!existingId) set("slug", toSlug(e.target.value));
            }}
            required
            maxLength={160}
          />
        </Field>
        <Field label="Slug" required hint="Auto-generated from the English title.">
          <Input value={draft.slug} onChange={(e) => set("slug", e.target.value)} required maxLength={120} />
        </Field>
        <Field label="Author">
          <Input value={draft.author} onChange={(e) => set("author", e.target.value)} maxLength={80} />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-forest-800">English</p>
          <Field label="Short excerpt" required hint="Shown on the blog list (10-400 characters)." className="sm:col-span-2">
            <Textarea value={draft.excerpt} onChange={(e) => set("excerpt", e.target.value)} required maxLength={400} />
          </Field>
          <Field label="Article text" required className="sm:col-span-2">
            <Textarea
              ref={bodyRef}
              value={draft.body}
              onChange={(e) => set("body", e.target.value)}
              required
              minLength={20}
              maxLength={60000}
              className="min-h-48"
              placeholder="Write the article here. Blank lines between paragraphs are kept when the article is displayed."
            />
          </Field>
        </div>

        <div className="space-y-4 rounded-md border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-forest-800">Français</p>
          <Field label="Titre" required>
            <Input
              value={draft.titleFr || ""}
              onChange={(e) => set("titleFr", e.target.value)}
              required
              maxLength={160}
              placeholder="Titre de l'article en français"
            />
          </Field>
          <Field label="Extrait court" required hint="Affiché dans la liste du blog (10-400 caractères).">
            <Textarea
              value={draft.excerptFr || ""}
              onChange={(e) => set("excerptFr", e.target.value)}
              required
              maxLength={400}
            />
          </Field>
          <Field label="Texte de l'article" required className="sm:col-span-2">
            <Textarea
              value={draft.bodyFr || ""}
              onChange={(e) => set("bodyFr", e.target.value)}
              required
              minLength={20}
              maxLength={60000}
              className="min-h-48"
              placeholder="Écrivez l'article ici. Les lignes vides entre les paragraphes sont conservées à l'affichage."
            />
          </Field>
          <Field label="Auteur">
            <Input
              value={draft.authorFr || ""}
              onChange={(e) => set("authorFr", e.target.value)}
              maxLength={80}
              placeholder="Auteur en français"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          type="button"
          disabled={inlineUploading}
          onClick={() => inlineFileRef.current?.click()}
        >
          {inlineUploading ? (
            <FaCloudArrowUp className="h-4 w-4 animate-bounce" aria-hidden />
          ) : (
            <FaImage className="h-4 w-4" aria-hidden />
          )}
          {inlineUploading ? "Uploading…" : "Insert image into text"}
        </Button>
        <p className="text-xs text-muted">
          Place your cursor where the photo should go, then click the button. Repeat to add more. You can also paste
          any image URL on its own line, e.g. <code className="rounded bg-cream px-1 py-0.5">![Caption](https://…)</code>
        </p>
        <input
          ref={inlineFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleInlineUpload(file);
          }}
        />
      </div>

      {existingId ? null : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={draft.status} onChange={(e) => set("status", e.target.value === "published" ? "published" : "draft")}>
              <option value="draft">Draft</option>
              <option value="published">Publish immediately</option>
            </Select>
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 accent-forest-700"
            />
            Featured article
          </label>
        </div>
      )}

      <Field label="Cover image URL" hint="Or upload a photo below.">
        <div className="flex gap-2">
          <Input value={draft.cover || ""} onChange={(e) => set("cover", e.target.value)} />
          <Button variant="outline" size="md" type="button" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <FaCloudArrowUp className="h-4 w-4 animate-bounce" aria-hidden /> : <FaImage className="h-4 w-4" aria-hidden />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />
        </div>
      </Field>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : existingId ? "Save changes" : "Create post"}
        </Button>
      </div>
    </form>
  );
}