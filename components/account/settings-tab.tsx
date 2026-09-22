"use client";

import { useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { PasswordInput } from "@/components/ui/password-input";
import { UserAvatar } from "@/components/account/user-avatar";
import { FaArrowRightFromBracket, FaCamera, FaTrashCan } from "react-icons/fa6";

export function SettingsTab() {
  const { user, updateAuthUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update your profile.");
      if (data.user) updateAuthUser(data.user);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update your profile.");
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
      if (!res.ok || !data.user) throw new Error(data.error || "Upload failed.");
      updateAuthUser(data.user);
      toast.success("Photo updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload your photo.");
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
      if (!res.ok) throw new Error(data.error || "Could not remove your photo.");
      if (data.user) updateAuthUser(data.user);
      toast.success("Photo removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords do not match.");
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
      if (!res.ok) throw new Error(data.error || "Could not change your password.");
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(data.message || "Password changed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">Profile photo</h3>
        <p className="mt-1.5 text-xs text-muted">
          A clear portrait helps the clinic recognise you. JPG, PNG, WebP or AVIF up to 4 MB.
        </p>
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
              aria-label="Choose a profile photo"
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
              {uploadingAvatar ? "Uploading..." : user?.avatar ? "Change photo" : "Upload photo"}
            </Button>
            {user?.avatar ? (
              <Button
                type="button"
                variant="ghost"
                disabled={uploadingAvatar}
                onClick={() => void removeAvatar()}
              >
                <FaTrashCan className="h-4 w-4" aria-hidden />
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </form>

      <form onSubmit={saveProfile} className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">Profile</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full Name" required>
            <Input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label="Phone / WhatsApp">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 ..." autoComplete="tel" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Email">
            <Input value={user?.email || ""} disabled className="bg-cream text-muted" />
          </Field>
          <p className="mt-1.5 text-xs text-muted">Your email is your sign-in and cannot be changed here.</p>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save profile"}
          </Button>
        </div>
      </form>

      <form onSubmit={changePassword} className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">Change password</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Current Password" required>
            <PasswordInput required value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </Field>
          <div className="space-y-4">
            <Field label="New Password" required hint="At least 8 characters.">
              <PasswordInput required value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
            </Field>
            <Field label="Confirm New Password" required>
              <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" variant="secondary" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border border-line bg-white p-5">
        <h3 className="text-sm font-bold text-ink">Sign out</h3>
        <p className="mt-1.5 text-xs text-muted">You will need your email and password to sign back in.</p>
        <Button variant="outline" className="mt-4" onClick={() => logout()}>
          <FaArrowRightFromBracket className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  );
}