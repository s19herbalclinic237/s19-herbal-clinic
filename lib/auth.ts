import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { connectDb } from "@/lib/db";
import { Session } from "@/lib/models/Session";
import { ResetToken } from "@/lib/models/ResetToken";

export const SESSION_COOKIE = "s19_session";
export const SESSION_DAYS = 30;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "doctor" | "user";
  emailVerified: boolean;
  phone?: string;
  /** Digits-only form of `phone`. Same number, already exposed above; kept so
   *  server-side channels (WhatsApp) can address the user without a re-query. */
  phoneSearch?: string;
  avatar?: string;
  /** YYYY-MM-DD */
  dob?: string;
  gender?: "male" | "female" | "other";
  address?: string;
  emergencyContact?: { name?: string; phone?: string; relation?: string };
  /** Cloudinary URL of the patient's ID document (legacy single field). */
  idCardUrl?: string;
  /** Cloudinary URL of the front of the patient's ID document. */
  idCardFrontUrl?: string;
  /** Cloudinary URL of the back of the patient's ID document. */
  idCardBackUrl?: string;
  /** Medical Record Number (MRN), assigned by the clinic admin. Read-only for patients. */
  mrn?: string;
  /** Patient agreed to WhatsApp notifications (Meta requires recorded consent). */
  whatsappOptIn?: boolean;
  preferredLanguage?: "en" | "fr";
  createdAt: string;
}

const KEY_LEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const [, salt, hash] = parts;
  const calc = scryptSync(password, salt, KEY_LEN).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(calc, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isEmailValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim().toLowerCase());
}

/**
 * Normalizes a phone number into a canonical digits search form used for
 * reliable sign-in lookups (users may type spaces, dashes, parentheses, or a
 * leading "+" differently each time). E.g. "+237 672 595 989" -> "237672595989".
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

/** Loose but sensible check for a phone number entered by a human. Optional
 *  field on registration, so an empty value passes. */
export function isPhoneValid(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 6 && digits.length <= 15;
}

export function passwordPolicyErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Password must be at least 8 characters long.");
  return errors;
}

export async function createSession(userId: string): Promise<string> {
  const conn = await connectDb();
  if (!conn) return "";
  const token = generateToken();
  await Session.create({
    tokenHash: hashToken(token),
    user: userId,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  const conn = await connectDb();
  if (!conn) return;
  await Session.deleteOne({ tokenHash: hashToken(token) }).exec();
}

export async function destroyUserSessions(userId: string): Promise<void> {
  const conn = await connectDb();
  if (!conn) return;
  await Session.deleteMany({ user: userId }).exec();
}

const RESET_TOKEN_MINUTES = 60;

export async function createResetToken(userId: string): Promise<string> {
  const conn = await connectDb();
  if (!conn) return "";
  const token = generateToken();
  await ResetToken.create({
    tokenHash: hashToken(token),
    user: userId,
    used: false,
    expiresAt: new Date(Date.now() + RESET_TOKEN_MINUTES * 60 * 1000),
  });
  return token;
}

/**
 * Validates and consumes a reset token in one step. Returns the user id on
 * success, or null when the token is missing, already used, or expired.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  const conn = await connectDb();
  if (!conn) return null;
  const doc = await ResetToken.findOne({ tokenHash: hashToken(token) });
  if (!doc || doc.used || doc.expiresAt < new Date()) return null;
  await ResetToken.updateOne({ _id: doc._id }, { $set: { used: true } }).exec();
  return String(doc.user);
}