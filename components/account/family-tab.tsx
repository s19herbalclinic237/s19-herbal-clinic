"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import {
  FaPencil,
  FaPlus,
  FaTrashCan,
  FaUserGroup,
  FaXmark,
} from "react-icons/fa6";

interface FamilyMemberView {
  _id: string;
  name: string;
  dob?: string;
  gender?: "male" | "female" | "other";
  relation: "child" | "spouse" | "parent" | "sibling" | "other";
  notes?: string;
}

const RELATION_LABELS: Record<string, string> = {
  child: "Child",
  spouse: "Spouse",
  parent: "Parent",
  sibling: "Sibling",
  other: "Other",
};

const emptyForm = {
  name: "",
  dob: "",
  gender: "",
  relation: "child",
  notes: "",
};

function FamilyForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: FamilyMemberView | null;
  onSave: (member: FamilyMemberView) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(
    initial
      ? {
          name: initial.name,
          dob: initial.dob || "",
          gender: initial.gender || "",
          relation: initial.relation,
          notes: initial.notes || "",
        }
      : emptyForm
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error("Please provide the family member's name.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      dob: form.dob || undefined,
      gender: form.gender || undefined,
      relation: form.relation,
      notes: form.notes || undefined,
    };
    try {
      setSaving(true);
      const res = await fetch(
        initial ? `/api/family-members/${initial._id}` : "/api/family-members",
        {
          method: initial ? "PATCH" : "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the family member.");
      const member: FamilyMemberView = initial
        ? { ...initial, ...payload, _id: initial._id }
        : data.member;
      onSave(member);
      toast.success(initial ? "Family member updated." : "Family member added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the family member.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-lg border border-forest-200 bg-forest-50/50 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-ink">
          {initial ? "Edit family member" : "Add a family member"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close form"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-line-strong bg-white text-muted hover:text-ink"
        >
          <FaXmark className="h-3 w-3" aria-hidden />
        </button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Ada Tchoupo"
            maxLength={80}
          />
        </Field>
        <Field label="Date of birth">
          <Input
            type="date"
            value={form.dob}
            onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
          />
        </Field>
        <Field label="Gender">
          <Select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Relationship" required>
          <Select
            value={form.relation}
            onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
          >
            {Object.entries(RELATION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes (optional)">
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Allergies, medications, school, anything useful for the clinic"
              maxLength={300}
            />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save changes" : "Add member"}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function FamilyTab() {
  const [members, setMembers] = useState<FamilyMemberView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = () => {
    let active = true;
    fetch("/api/family-members", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        if (data.error) setError(data.error);
        else setMembers(Array.isArray(data.members) ? data.members : []);
      })
      .catch(() => {
        if (active) setError("Could not load your family members.");
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, []);

  async function remove(member: FamilyMemberView) {
    if (!window.confirm(`Remove ${member.name} from your family profile?`)) return;
    try {
      const res = await fetch(`/api/family-members/${member._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove the family member.");
      setMembers(Array.isArray(data.members) ? data.members : []);
      toast.success("Family member removed.");
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the family member.");
    }
  }

  const editingMember = editingId ? members?.find((m) => m._id === editingId) || null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Manage profiles for your children and loved ones so the clinic can care for the whole
          family.
        </p>
        {!showForm && !editingMember ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            Add family member
          </Button>
        ) : null}
      </div>

      {showForm ? (
        <FamilyForm
          initial={null}
          onSave={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : null}

      {editingMember ? (
        <FamilyForm
          initial={editingMember}
          onSave={() => {
            setEditingId(null);
            load();
          }}
          onCancel={() => setEditingId(null)}
        />
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {!members ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-800" />
        </div>
      ) : null}

      {members && members.length === 0 && !showForm ? (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <FaUserGroup className="mx-auto h-7 w-7 text-forest-300" aria-hidden />
          <p className="mt-3 text-sm text-muted">
            No family members yet. Add a child or loved one to book visits and keep their records
            under your account.
          </p>
        </div>
      ) : null}

      {members && members.length > 0 ? (
        <ul className="space-y-2.5">
          {members.map((m) => (
            <li
              key={m._id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-white px-4 py-3.5 sm:px-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest-950 text-xs font-bold text-gold-300">
                {m.name
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("") || "?"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-ink">{m.name}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {RELATION_LABELS[m.relation] || m.relation}
                  {m.dob ? ` · born ${m.dob}` : ""}
                  {m.gender ? ` · ${m.gender}` : ""}
                  {m.notes ? ` · ${m.notes}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingId(m._id)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-line-strong bg-white text-muted transition-colors hover:border-forest-400 hover:text-forest-800"
                  aria-label={`Edit ${m.name}`}
                >
                  <FaPencil className="h-3 w-3" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => void remove(m)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                  aria-label={`Remove ${m.name}`}
                >
                  <FaTrashCan className="h-3 w-3" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}