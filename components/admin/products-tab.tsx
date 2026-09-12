"use client";

import { useEffect, useRef, useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { formatFcfa } from "@/lib/utils";
import {
  FaArrowRotateLeft,
  FaBoxOpen,
  FaCloudArrowUp,
  FaImage,
  FaPencil,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";

interface AdminProduct {
  _id: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  price: number;
  unit?: string;
  shortDescription: string;
  description: string;
  usage?: string;
  ingredients?: string;
  badge?: string;
  image: string;
  featured: boolean;
  stock: number;
  active: boolean;
}

type ProductDraft = Omit<AdminProduct, "_id">;

const emptyDraft: ProductDraft = {
  name: "",
  slug: "",
  category: "",
  categorySlug: "",
  price: 0,
  unit: "",
  shortDescription: "",
  description: "",
  usage: "",
  ingredients: "",
  badge: "",
  image: "/s19-assets/products/placeholder.png",
  featured: false,
  stock: 0,
  active: true,
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

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...init });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error((data.error as string | undefined) || `Request failed (${res.status})`);
  }
  return data;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function ProductsTab() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<ProductDraft | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = () => {
    let active = true;
    fetchJson("/api/admin/products")
      .then((data) => {
        if (!active) return;
        setProducts(asArray<AdminProduct>(data.products));
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = async (p: AdminProduct, key: "featured" | "active") => {
    try {
      const data = await fetchJson(`/api/admin/products/${p._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: !p[key] }),
      });
      if (data.product) {
        const updated = data.product as AdminProduct;
        setProducts((prev) =>
          prev === null ? prev : prev.map((x) => (x._id === p._id ? { ...x, [key]: updated[key] } : x))
        );
      }
      notify(key === "featured" ? "Featured updated." : "Visibility updated.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const handleDelete = async (p: AdminProduct) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await fetchJson(`/api/admin/products/${p._id}`, { method: "DELETE" });
      setProducts((prev) => (prev === null ? prev : prev.filter((x) => x._id !== p._id)));
      notify("Product deleted.");
    } catch (e) {
      notify((e as Error).message);
    }
  };

  const filtered = products?.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.slug.includes(q);
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink">Manage Products</p>
          <p className="text-sm text-muted">Featured products appear in the home catalog.</p>
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
            Add product
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
        <ProductForm
          initial={editing}
          existingId={editId}
          busy={busy}
          setBusy={setBusy}
          onCancel={() => {
            setEditing(null);
            setEditId(null);
          }}
          onSaved={(product, id) => {
            const isNew = !(products ?? []).some((x) => x._id === id);
            setProducts((prev) => {
              if (prev === null) return prev;
              if (!prev.some((x) => x._id === id)) return [...prev, product];
              return prev.map((x) => (x._id === id ? product : x));
            });
            setEditing(null);
            setEditId(null);
            notify(isNew ? "Product created." : "Product updated.");
          }}
        />
      ) : null}

      <div className="flex items-center gap-2">
        <Input
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
      </div>

      {products === null ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : filtered && filtered.length === 0 ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaBoxOpen className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">No products match.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {(filtered || []).map((p) => (
            <li key={p._id} className="flex flex-wrap items-center gap-3 p-3 sm:px-4">
              <img
                src={p.image}
                alt={p.name}
                className="h-11 w-11 shrink-0 rounded-md border border-line bg-cream object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {p.name}
                  {!p.active ? <span className="ml-2 text-xs font-medium text-muted">(hidden)</span> : null}
                </p>
                <p className="truncate text-xs text-muted">
                  {p.category} · {p.price === 0 ? "Contact for pricing" : formatFcfa(p.price)}
                  {p.stock !== undefined && p.price !== 0 ? ` · stock ${p.stock}` : ""}
                </p>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <input
                  type="checkbox"
                  checked={p.featured}
                  onChange={() => handleToggle(p, "featured")}
                  className="h-3.5 w-3.5 accent-forest-700"
                />
                Featured
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={() => handleToggle(p, "active")}
                  className="h-3.5 w-3.5 accent-forest-700"
                />
                Visible
              </label>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Edit ${p.name}`}
                  onClick={() => {
                    setEditId(p._id);
                    setEditing({ ...p } as ProductDraft);
                  }}
                >
                  <FaPencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${p.name}`}
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(p)}
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

function ProductForm({
  initial,
  existingId,
  busy,
  setBusy,
  onCancel,
  onSaved,
}: {
  initial: ProductDraft;
  existingId: string | null;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onCancel: () => void;
  onSaved: (product: AdminProduct, id: string) => void;
}) {
  const [draft, setDraft] = useState<ProductDraft>(initial);
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof ProductDraft, value: string | number | boolean) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setFormError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: string };
      if (!res.ok || !data.secure_url) {
        throw new Error(data.error || "Upload failed.");
      }
      set("image", data.secure_url);
    } catch (e) {
      setFormError((e as Error).message || "Upload failed. Paste an image URL instead.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      if (existingId) {
        const data = await fetchJson(`/api/admin/products/${existingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        onSaved(data.product as AdminProduct, existingId);
      } else {
        const data = await fetchJson("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft),
        });
        const created = data.product as AdminProduct;
        onSaved(created, String(created._id));
      }
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-forest-200 bg-forest-50/50 p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base font-semibold text-ink">
          {existingId ? "Edit product" : "New product"}
        </p>
        <Button variant="ghost" size="sm" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>

      {formError ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required className="sm:col-span-2">
          <Input
            value={draft.name}
            onChange={(e) => {
              set("name", e.target.value);
              if (!existingId) set("slug", toSlug(e.target.value));
            }}
            required
            maxLength={120}
          />
        </Field>
        <Field label="Slug" required hint="Auto-generated from the name.">
          <Input value={draft.slug} onChange={(e) => set("slug", e.target.value)} required maxLength={80} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (FCFA)" hint="0 = contact for pricing.">
            <Input
              type="number"
              min={0}
              step="1"
              value={draft.price}
              onChange={(e) => set("price", Number(e.target.value))}
            />
          </Field>
          <Field label="Unit">
            <Input value={draft.unit || ""} onChange={(e) => set("unit", e.target.value)} placeholder="200 g" />
          </Field>
        </div>
        <Field label="Category" required className="sm:col-span-2">
          <Input
            value={draft.category}
            onChange={(e) => {
              set("category", e.target.value);
              if (!existingId) set("categorySlug", toSlug(e.target.value));
            }}
            required
            list="s19-categories"
          />
        </Field>
      </div>
      <datalist id="s19-categories">
        <option value="Men's Health" />
        <option value="General Wellness" />
        <option value="Digestive Health" />
        <option value="Cold & Flu" />
        <option value="Detox & Cleansing" />
        <option value="Kidney & Urinary" />
        <option value="Herbal Tea Blends" />
        <option value="Extracts & Oils" />
      </datalist>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Short description" required className="sm:col-span-2">
          <Textarea
            value={draft.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            required
            maxLength={300}
          />
        </Field>
        <Field label="Description" required className="sm:col-span-2">
          <Textarea
            value={draft.description}
            onChange={(e) => set("description", e.target.value)}
            required
            maxLength={6000}
          />
        </Field>
        <Field label="Usage">
          <Textarea value={draft.usage || ""} onChange={(e) => set("usage", e.target.value)} maxLength={1000} />
        </Field>
        <Field label="Ingredients">
          <Textarea
            value={draft.ingredients || ""}
            onChange={(e) => set("ingredients", e.target.value)}
            maxLength={1000}
          />
        </Field>
        <Field label="Badge">
          <Input value={draft.badge || ""} onChange={(e) => set("badge", e.target.value)} placeholder="Bestseller" />
        </Field>
        <Field label="Stock">
          <Input
            type="number"
            min={0}
            step="1"
            value={draft.stock}
            onChange={(e) => set("stock", Math.max(0, Math.floor(Number(e.target.value))))}
          />
        </Field>
      </div>

      <Field label="Image URL" hint="Or upload a photo below.">
        <div className="flex gap-2">
          <Input value={draft.image} onChange={(e) => set("image", e.target.value)} />
          <Button
            variant="outline"
            size="md"
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <FaCloudArrowUp className="h-4 w-4 animate-bounce" aria-hidden />
            ) : (
              <FaImage className="h-4 w-4" aria-hidden />
            )}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleUpload(file);
              }
            }}
          />
        </div>
      </Field>

      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2 font-medium text-ink">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4 accent-forest-700"
          />
          Featured on home catalog
        </label>
        <label className="flex items-center gap-2 font-medium text-ink">
          <input
            type="checkbox"
            checked={draft.active}
            onChange={(e) => set("active", e.target.checked)}
            className="h-4 w-4 accent-forest-700"
          />
          Visible in shop
        </label>
      </div>

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button variant="outline" type="button" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving…" : existingId ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}