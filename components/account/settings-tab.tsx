"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { UserAvatar } from "@/components/account/user-avatar";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  FaArrowRightFromBracket,
  FaCamera,
  FaFileCirclePlus,
  FaFileLines,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";

export function SettingsTab() {
  const { t } = useLocale();
  const { user, updateAuthUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dob, setDob] = useState(user?.dob || "");
  const [gender, setGender] = useState(user?.gender || "");
  const [address, setAddress] = useState(user?.address || "");
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContact?.name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContact?.phone || "");
  const [emergencyRelation, setEmergencyRelation] = useState(user?.emergencyContact?.relation || "");
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn ?? false);
  const [notifLanguage, setNotifLanguage] = useState<"en" | "fr">(user?.preferredLanguage || "en");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  // WhatsApp needs a number to send to, so the toggle stays off until one is saved.
  const canOptIn = Boolean(phone.trim() || user?.phone);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!gender.trim()) {
      toast.error(t("dash.settings.genderRequired"));
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          dob,
          gender: gender || undefined,
          address,
          emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relation: emergencyRelation,
          },
          whatsappOptIn,
          preferredLanguage: notifLanguage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.settings.profileError"));
      if (data.user) updateAuthUser(data.user);
      toast.success(t("dash.settings.profileUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.settings.profileError"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.user) throw new Error(data.error || t("dash.settings.uploadFailed"));
      updateAuthUser(data.user);
      toast.success(t("dash.settings.photoUpdated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.settings.photoError"));
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.settings.photoRemoveError"));
      if (data.user) updateAuthUser(data.user);
      toast.success(t("dash.settings.photoRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.settings.photoRemoveError"));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function uploadIdCard(file: File, side: "front" | "back") {
    setUploadingId(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("side", side);
      const res = await fetch("/api/auth/id-card", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.user) throw new Error(data.error || t("dash.settings.uploadFailed"));
      updateAuthUser(data.user);
      toast.success(side === "back" ? t("dash.settings.idBackSaved") : t("dash.settings.idFrontSaved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.settings.idError"));
    } finally {
      setUploadingId(false);
    }
  }

  async function removeIdCard(field: "idCardFrontUrl" | "idCardBackUrl") {
    setUploadingId(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.settings.idRemoveError"));
      if (data.user) updateAuthUser(data.user);
      toast.success(t("dash.settings.idRemoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.settings.idRemoveError"));
    } finally {
      setUploadingId(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error(t("dash.settings.passwordMismatch"));
      return;
    }
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("dash.settings.passwordError"));
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(data.message || t("dash.settings.passwordChanged"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("dash.settings.passwordError"));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">{t("dash.settings.profilePhoto")}</h3>
        <p className="mt-1.5 text-xs text-muted">{t("dash.settings.photoHint")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <UserAvatar
            user={user}
            className="h-20 w-20 border-2 border-gold-400"
            textClassName="font-display text-2xl font-bold text-gold-300"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              aria-label={t("dash.settings.choosePhoto")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              <FaCamera className="h-4 w-4" aria-hidden />
              {uploadingAvatar
                ? t("dash.settings.uploading")
                : user?.avatar
                  ? t("dash.settings.changePhoto")
                  : t("dash.settings.uploadPhoto")}
            </Button>
            {user?.avatar ? (
              <Button
                type="button"
                variant="ghost"
                disabled={uploadingAvatar}
                onClick={() => void removeAvatar()}
              >
                <FaTrashCan className="h-4 w-4" aria-hidden />
                {t("dash.settings.remove")}
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      <form onSubmit={saveProfile} className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">{t("dash.settings.profile")}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-lg border border-forest-100 bg-forest-50/60 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
              {t("dash.settings.mrn")}
            </p>
            {user?.mrn ? (
              <p className="mt-1 font-display text-xl font-semibold tracking-wider text-ink">{user.mrn}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">{t("dash.settings.mrnMissing")}</p>
            )}
            <p className="mt-1 text-[11px] text-muted">{t("dash.settings.mrnNote")}</p>
          </div>
          <Field label={t("dash.settings.fullName")} required>
            <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label={t("dash.settings.phone")}>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("dash.settings.phonePh")}
              autoComplete="tel"
            />
          </Field>
          <Field label={t("dash.settings.dob")}>
            <Input
              type="date"
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDob(e.target.value)}
            />
          </Field>
          <Field label={t("dash.settings.gender")} required>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              required
            >
              <option value="" disabled>
                {t("dash.settings.genderSelect")}
              </option>
              <option value="male">{t("dash.settings.genderMale")}</option>
              <option value="female">{t("dash.settings.genderFemale")}</option>
              <option value="other">{t("dash.settings.genderOther")}</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label={t("dash.settings.address")}>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("dash.settings.addressPh")}
                maxLength={250}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-forest-100 pt-5">
          <h4 className="text-xs font-bold text-ink">{t("dash.settings.emergency")}</h4>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Field label={t("dash.settings.emergencyName")}>
              <Input
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder={t("dash.settings.fullName")}
                maxLength={100}
              />
            </Field>
            <Field label={t("dash.settings.emergencyPhone")}>
              <Input
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder={t("dash.settings.phonePh")}
                maxLength={30}
              />
            </Field>
            <Field label={t("dash.settings.emergencyRelation")}>
              <Input
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                placeholder={t("dash.settings.emergencyRelationPh")}
                maxLength={50}
              />
            </Field>
          </div>
        </div>

        <div className="mt-6 border-t border-forest-100 pt-5">
          <h4 className="text-xs font-bold text-ink">{t("dash.settings.notifications")}</h4>
          <label
            className={`mt-3 flex items-start gap-3 rounded-lg border border-line bg-cream/40 px-4 py-3 ${
              canOptIn ? "cursor-pointer" : "opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={whatsappOptIn}
              disabled={!canOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-forest-800"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-ink">{t("dash.settings.waOptIn")}</span>
              <span className="mt-1 block text-xs text-muted">
                {canOptIn ? t("dash.settings.waOptInHelp") : t("dash.settings.waNeedsPhone")}
              </span>
            </span>
          </label>
          <div className="mt-4 max-w-xs">
            <Field label={t("dash.settings.notifLanguage")}>
              <select
                value={notifLanguage}
                onChange={(e) => setNotifLanguage(e.target.value as "en" | "fr")}
                className="w-full rounded-md border border-line-strong bg-white px-3 py-2 text-sm text-ink focus:border-forest-500 focus:outline-none focus:ring-2 focus:ring-forest-500/20"
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </Field>
            <p className="mt-1.5 text-xs text-muted">{t("dash.settings.notifLanguageHelp")}</p>
          </div>
        </div>

        <div className="mt-6">
          <Field label={t("dash.settings.email")}>
            <Input value={user?.email || ""} disabled className="bg-cream text-muted" />
          </Field>
          <p className="mt-1.5 text-xs text-muted">{t("dash.settings.emailLocked")}</p>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? t("dash.settings.saving") : t("dash.settings.saveProfile")}
          </Button>
        </div>
      </form>

      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="rounded-lg border border-line bg-white p-5"
      >
        <h3 className="text-sm font-bold text-ink">{t("dash.settings.idDocument")}</h3>
        <p className="mt-1.5 text-xs text-muted">{t("dash.settings.idHint")}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <IdSlot
            label={t("dash.settings.idFront")}
            savedUrl={user?.idCardFrontUrl}
            uploading={uploadingId}
            onUpload={(file) => void uploadIdCard(file, "front")}
            onRemove={() => void removeIdCard("idCardFrontUrl")}
          />
          <IdSlot
            label={t("dash.settings.idBack")}
            savedUrl={user?.idCardBackUrl}
            uploading={uploadingId}
            onUpload={(file) => void uploadIdCard(file, "back")}
            onRemove={() => void removeIdCard("idCardBackUrl")}
          />
        </div>
      </form>

      <form onSubmit={changePassword} className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">{t("dash.settings.changePassword")}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label={t("dash.settings.currentPassword")} required>
            <PasswordInput required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <div className="space-y-4">
            <Field label={t("dash.settings.newPassword")} required hint={t("dash.settings.passwordHint")}>
              <PasswordInput required value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label={t("dash.settings.confirmPassword")} required>
              <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" variant="secondary" disabled={savingPassword}>
            {savingPassword ? t("dash.settings.updating") : t("dash.settings.updatePassword")}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">{t("dash.settings.signOutTitle")}</h3>
        <p className="mt-1.5 text-xs text-muted">{t("dash.settings.signOutNote")}</p>
        <Button variant="outline" className="mt-4" onClick={() => logout()}>
          <FaArrowRightFromBracket className="h-4 w-4" aria-hidden />
          {t("dash.settings.signOut")}
        </Button>
      </div>
    </div>
  );
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|avif)(\?.*)?$/i.test(url);
}

function IdSlot({
  label,
  savedUrl,
  uploading,
  onUpload,
  onRemove,
}: {
  label: string;
  savedUrl?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<{ file: File; preview: string } | null>(null);

  // Release the object URL when the preview is dismissed.
  useEffect(() => {
    return () => {
      if (pending) URL.revokeObjectURL(pending.preview);
    };
  }, [pending]);

  function chooseFile(file: File) {
    if (pending) URL.revokeObjectURL(pending.preview);
    setPending({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-lg border border-line-strong bg-cream/40 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-ink">{label}</p>

      {pending ? (
        <div className="mt-3">
          {pending.preview ? (
            // Preview before anything is saved.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pending.preview}
              alt={t("dash.settings.idPreview", { side: label })}
              className="max-h-44 w-full rounded-md border border-line bg-white object-contain"
            />
          ) : (
            <p className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs text-muted">
              <FaFileLines className="h-4 w-4 shrink-0 text-forest-700" aria-hidden />
              <span className="truncate">{pending.file.name}</span>
              <span className="shrink-0">(PDF)</span>
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" disabled={uploading} onClick={() => { const f = pending.file; setPending(null); onUpload(f); }}>
              <FaFileCirclePlus className="h-3.5 w-3.5" aria-hidden />
              {uploading ? t("dash.settings.saving") : t("dash.settings.uploadSave")}
            </Button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line-strong bg-white px-3 text-xs font-semibold text-muted hover:text-ink"
            >
              <FaXmark className="h-3 w-3" aria-hidden />
              {t("dash.settings.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          {savedUrl ? (
            <div className="space-y-2">
              {isImageUrl(savedUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={savedUrl}
                  alt={t("dash.settings.idSaved", { side: label })}
                  className="max-h-44 w-full rounded-md border border-line bg-white object-contain"
                />
              ) : (
                <a
                  href={savedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-forest-800 transition-colors hover:border-forest-400"
                >
                  <FaFileLines className="h-4 w-4 shrink-0 text-forest-700" aria-hidden />
                  <span className="truncate">{t("dash.settings.viewPdf")}</span>
                </a>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
                  <FaCamera className="h-3.5 w-3.5" aria-hidden />
                  {t("dash.settings.replace")}
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={uploading} onClick={onRemove}>
                  <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                  {t("dash.settings.remove")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
                className="hidden"
                aria-label={t("dash.settings.chooseSide", { side: label })}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) chooseFile(file);
                }}
              />
              <Button type="button" variant="secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
                <FaFileCirclePlus className="h-4 w-4" aria-hidden />
                {uploading ? t("dash.settings.uploading") : t("dash.settings.chooseFile")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}