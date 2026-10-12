"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/components/account/badges";
import {
  FaArrowDown,
  FaArrowRotateLeft,
  FaArrowUp,
  FaClipboardList,
  FaPencil,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";

interface AdminService {
  _id: string;
  slug: string;
  title: string;
  short: string;
  detail: string;
  conditions: string[];
  note?: string;
  noteKind?: "important" | "safety";
  order: number;
  status: "draft" | "published";
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  titleFr?: string;
  shortFr?: string;
  detailFr?: string;
  conditionsFr?: string[];
  noteFr?: string;
}

type ServiceDraft = Omit<AdminService, "_id" | "publishedAt" | "createdAt" | "updatedAt">;

const emptyDraft: ServiceDraft = {
  slug: "",
  title: "",
  short: "",
  detail: "",
  conditions: [],
  note: "",
  noteKind: "important",
  order: 0,
  status: "published",
  titleFr: "",
  shortFr: "",
  detailFr: "",
  conditionsFr: [],
  noteFr: "",
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function sortServices(list: AdminService[]): AdminService[] {
  return [...list].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

const statusClasses: Record<string, string> = {
  draft: "border-line-strong bg-cream text-muted",
  published: "border-forest-300 bg-forest-50 text-forest-800",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  published: "Published",
};

export function ServicesTab() {
  const [services, setServices] = useState<AdminService[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ServiceDraft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = () => {
    let active = true;
    fetch("/api/admin/services", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setServices(Array.isArray(data.services) ? data.services : []);
      })
      .catch(() => {
        if (active) setError("Could not load services.");
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

  const handleStatus = async (s: AdminService) => {
    const next = s.status === "published" ? "draft" : "published";
    try {
      const res = await fetch(`/api/admin/services/${s._id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setServices((prev) =>
        prev === null ? prev : prev.map((x) => (x._id === s._id ? { ...x, status: next } : x))
      );
      notify(next === "published" ? "Service published - live on the Services page." : "Moved back to drafts.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const handleDelete = async (s: AdminService) => {
    if (!window.confirm(`Delete "${s.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/services/${s._id}`, { method: "DELETE", credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Delete failed.");
      setServices((prev) => (prev === null ? prev : prev.filter((x) => x._id !== s._id)));
      notify("Service deleted.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const handleMove = async (service: AdminService, direction: -1 | 1) => {
    if (!services) return;
    const sorted = sortServices(services);
    const index = sorted.findIndex((x) => x._id === service._id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sorted.length) return;
    const next = [...sorted];
    [next[index], next[target]] = [next[target], next[index]];
    const changed = next.map((x, i) => ({ id: x._id, order: i })).filter((x, i) => next[i].order !== x.order);
    setBusy(true);
    try {
      await Promise.all(
        changed.map((c) =>
          fetch(`/api/admin/services/${c.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: c.order }),
          })
        )
      );
      setServices(
        next.map((x, i) => ({ ...x, order: i }))
      );
    } catch {
      notify("Could not reorder. Refresh and try again.");
    } finally {
      setBusy(false);
    }
  };

  const filtered = services?.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return s.title.toLowerCase().includes(q) || s.slug.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Services</p>
          <p className="text-sm text-muted">
            Add, edit, reorder, publish or remove the services shown on the public Services page.
          </p>
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
            New service
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
        <ServiceForm
          initial={editing}
          existingId={editId}
          busy={busy}
          setBusy={setBusy}
          onCancel={() => {
            setEditing(null);
            setEditId(null);
          }}
          onSaved={(service, id) => {
            const isNew = !(services ?? []).some((x) => x._id === id);
            setServices((prev) => {
              if (prev === null) return prev;
              if (!prev.some((x) => x._id === id)) return [...prev, service];
              return prev.map((x) => (x._id === id ? service : x));
            });
            setEditing(null);
            setEditId(null);
            notify(isNew ? "Service created." : "Service updated.");
          }}
        />
      ) : null}

      <Input
        placeholder="Search services…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search services"
      />

      {services === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaClipboardList className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No services yet. Add your first service.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {sortServices(filtered || []).map((s, i, arr) => (
            <li key={s._id} className="flex flex-wrap items-center gap-3 p-3 sm:px-4">
              <div className="flex flex-col">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5"
                  aria-label={`Move ${s.title} up`}
                  disabled={busy || !!query.trim() || i === 0}
                  onClick={() => void handleMove(s, -1)}
                >
                  <FaArrowUp className="h-3 w-3" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-1.5"
                  aria-label={`Move ${s.title} down`}
                  disabled={busy || !!query.trim() || i === arr.length - 1}
                  onClick={() => void handleMove(s, 1)}
                >
                  <FaArrowDown className="h-3 w-3" aria-hidden />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  <span className="mr-2 text-muted">{String(s.order + 1).padStart(2, "0")}</span>
                  {s.title}
                </p>
                <p className="truncate text-xs text-muted">
                  /services#{s.slug} · {formatDate(s.updatedAt ?? s.createdAt)}
                </p>
              </div>
              <span
                className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  statusClasses[s.status] || ""
                }`}
              >
                {statusLabels[s.status]}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => void handleStatus(s)}>
                  {s.status === "published" ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${s.title}`}
                  onClick={() => {
                    setEditId(s._id);
                    setEditing({
                      ...s,
                      conditions: s.conditions ?? [],
                      conditionsFr: s.conditionsFr ?? [],
                      note: s.note ?? "",
                      noteFr: s.noteFr ?? "",
                    });
                  }}
                >
                  <FaPencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${s.title}`}
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => void handleDelete(s)}
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

function ServiceForm({
  initial,
  existingId,
  busy,
  setBusy,
  onCancel,
  onSaved,
}: {
  initial: ServiceDraft;
  existingId: string | null;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onCancel: () => void;
  onSaved: (service: AdminService, id: string) => void;
}) {
  const [draft, setDraft] = useState<ServiceDraft>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  const set = <K extends keyof ServiceDraft>(key: K, value: ServiceDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const url = existingId ? `/api/admin/services/${existingId}` : "/api/admin/services";
      const res = await fetch(url, {
        method: existingId ? "PATCH" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; service?: AdminService };
      if (!res.ok) throw new Error(data.error || "Could not save.");
      const service = data.service as AdminService;
      onSaved(service, String(service._id));
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold text-ink">
          {existingId ? "Edit service" : "New service"}
        </p>
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
        <Field label="Slug" required hint="Used for the direct link (e.g. /services#your-slug). Auto-generated from the English title.">
          <Input value={draft.slug} onChange={(e) => set("slug", e.target.value)} required maxLength={80} />
        </Field>
        <Field label="Order" hint="Lower numbers appear first on the Services page.">
          <Input
            type="number"
            value={String(draft.order)}
            onChange={(e) => set("order", Number(e.target.value) || 0)}
            min={0}
          />
        </Field>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-md border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-forest-800">English</p>
          <Field label="Card summary" required hint="Shown at the top of the card (20-600 characters).">
            <Textarea value={draft.short} onChange={(e) => set("short", e.target.value)} required maxLength={600} />
          </Field>
          <Field label="Full description" required className="sm:col-span-2">
            <Textarea
              value={draft.detail}
              onChange={(e) => set("detail", e.target.value)}
              required
              maxLength={4000}
              className="min-h-32"
            />
          </Field>
          <Field label="Supports" required hint="One item per line. These become the chips on the card.">
            <Textarea
              value={draft.conditions.join("\n")}
              onChange={(e) => set("conditions", e.target.value.split("\n"))}
              required
              className="min-h-28"
              placeholder={"Type 2 diabetes\nPre-diabetes\nMetabolic health concerns"}
            />
          </Field>
          <Field label="Boundary-of-care note" hint="Optional. Shown in a highlighted box above the buttons.">
            <Textarea value={draft.note || ""} onChange={(e) => set("note", e.target.value)} maxLength={500} />
          </Field>
          <Field label="Note level">
            <Select
              value={draft.noteKind || "important"}
              onChange={(e) => set("noteKind", e.target.value === "safety" ? "safety" : "important")}
            >
              <option value="important">Important</option>
              <option value="safety">Safety (medication risk)</option>
            </Select>
          </Field>
        </div>

        <div className="space-y-4 rounded-md border border-line bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-forest-800">Français</p>
          <Field label="Titre">
            <Input value={draft.titleFr || ""} onChange={(e) => set("titleFr", e.target.value)} maxLength={160} />
          </Field>
          <Field label="Résumé de la carte" hint="Affiché en haut de la carte (20-600 caractères).">
            <Textarea
              value={draft.shortFr || ""}
              onChange={(e) => set("shortFr", e.target.value)}
              maxLength={600}
            />
          </Field>
          <Field label="Description complète">
            <Textarea
              value={draft.detailFr || ""}
              onChange={(e) => set("detailFr", e.target.value)}
              maxLength={4000}
              className="min-h-32"
            />
          </Field>
          <Field label="Soutient" hint="Un élément par ligne.">
            <Textarea
              value={(draft.conditionsFr || []).join("\n")}
              onChange={(e) => set("conditionsFr", e.target.value.split("\n"))}
              className="min-h-28"
            />
          </Field>
          <Field label="Note de limite de soins" hint="Facultatif.">
            <Textarea value={draft.noteFr || ""} onChange={(e) => set("noteFr", e.target.value)} maxLength={500} />
          </Field>
          <p className="text-xs text-muted">
            Les champs français sont facultatifs ; l&apos;anglais est affiché si vous laissez un champ vide.
          </p>
        </div>
      </div>

      <Field label="Status">
        <Select
          value={draft.status}
          onChange={(e) => set("status", e.target.value === "draft" ? "draft" : "published")}
        >
          <option value="published">Published (visible on the site)</option>
          <option value="draft">Draft (hidden)</option>
        </Select>
      </Field>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : existingId ? "Save changes" : "Create service"}
        </Button>
      </div>
    </form>
  );
}
