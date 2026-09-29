"use client";

import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { useLocale } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n";
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

const RELATION_KEYS: Record<string, TranslationKey> = {
  child: "dash.family.relation.child",
  spouse: "dash.family.relation.spouse",
  parent: "dash.family.relation.parent",
  sibling: "dash.family.relation.sibling",
  other: "dash.family.relation.other",
};

const GENDER_KEYS: Record<string, TranslationKey> = {
  male: "dash.family.male",
  female: "dash.family.female",
  other: "dash.family.other",
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
  const { t } = useLocale();
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
      toast.error(t("dash.family.nameRequired"));
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
      if (!res.ok) throw new Error(data.error || t("dash.family.saveError"));
      const member: FamilyMemberView = initial
        ? { ...initial, ...payload, _id: initial._id }
        : data.member;
      onSave(member);
      toast.success(initial ? t("dash.family.updated") : t("dash.family.added"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.family.saveError"));
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
          {initial ? t("dash.family.editTitle") : t("dash.family.addTitle")}
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
        <Field label={t("dash.family.fullName")} required>
          <Input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder={t("dash.family.namePh")}
            maxLength={80}
          />
        </Field>
        <Field label={t("dash.family.dob")}>
          <Input
            type="date"
            value={form.dob}
            onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
          />
        </Field>
        <Field label={t("dash.family.gender")}>
          <Select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
          >
            <option value="">{t("dash.family.genderUndisclosed")}</option>
            <option value="male">{t("dash.family.male")}</option>
            <option value="female">{t("dash.family.female")}</option>
            <option value="other">{t("dash.family.other")}</option>
          </Select>
        </Field>
        <Field label={t("dash.family.relationship")} required>
          <Select
            value={form.relation}
            onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
          >
            {Object.entries(RELATION_KEYS).map(([value, key]) => (
              <option key={value} value={value}>
                {t(key)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label={t("dash.family.notesLabel")}>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={t("dash.family.notesPh")}
              maxLength={300}
            />
          </Field>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving
            ? t("dash.family.saving")
            : initial
              ? t("dash.family.saveChanges")
              : t("dash.family.addMember")}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-muted hover:text-ink"
        >
          {t("dash.family.cancel")}
        </button>
      </div>
    </form>
  );
}

export function FamilyTab() {
  const { t } = useLocale();
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
        if (active) setError(t("dash.family.loadError"));
      });
    return () => {
      active = false;
    };
  };

  useEffect(() => {
    return load();
  }, [t]);

  async function remove(member: FamilyMemberView) {
    if (!window.confirm(t("dash.family.removePrompt", { name: member.name }))) return;
    try {
      const res = await fetch(`/api/family-members/${member._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.family.removeError"));
      setMembers(Array.isArray(data.members) ? data.members : []);
      toast.success(t("dash.family.removed"));
      setEditingId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.family.removeError"));
    }
  }

  const editingMember = editingId ? members?.find((m) => m._id === editingId) || null : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("dash.family.intro")}</p>
        {!showForm && !editingMember ? (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            {t("dash.family.addBtn")}
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
          <p className="mt-3 text-sm text-muted">{t("dash.family.empty")}</p>
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
                  {RELATION_KEYS[m.relation] ? t(RELATION_KEYS[m.relation]) : m.relation}
                  {m.dob ? t("dash.family.born", { date: m.dob }) : ""}
                  {m.gender
                    ? t("dash.family.genderLabel", {
                        gender: GENDER_KEYS[m.gender] ? t(GENDER_KEYS[m.gender]) : m.gender,
                      })
                    : ""}
                  {m.notes ? t("dash.family.notesDetail", { notes: m.notes }) : ""}
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