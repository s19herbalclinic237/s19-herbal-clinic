import type { QueryFilter } from "mongoose";
import type { IUser, UserRole } from "@/lib/models/User";

/**
 * Medical Record Numbers and the clinic's user directory.
 *
 * Two rules live here rather than in a route, because two places depend on them
 * and they must not drift:
 *
 *   - what an MRN is allowed to look like, and
 *   - what "search the directory" means.
 *
 * An MRN is the number the clinic uses to pull one patient's file out of a
 * physical drawer. If the format is loose and two patients end up on the same
 * number, the drawer is wrong and nobody notices until a note is filed against
 * the wrong history. So the format is checked, normalised on the way in, and
 * uniqueness is enforced by a sparse unique index on the collection itself
 * rather than only by the check in the route.
 */

/** Loose clinic format: letters, digits and dashes, e.g. "S1900615". */
export const MRN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{1,29}$/;

/** Matches the loosest acceptable length, so an over-long entry gets a clear
 *  "too long" style rejection from the same pattern rather than a second rule. */
export const MRN_MIN_LENGTH = 2;
export const MRN_MAX_LENGTH = 30;

/**
 * Bring whatever was typed into the one form the clinic uses: trimmed,
 * uppercased, with internal whitespace folded into dashes. Two admins typing
 * "s19 00615" and "S19-00615" must not create two records.
 */
export function normalizeMrn(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
}

export type MrnValidation =
  | { ok: true; removing: true; value: "" }
  | { ok: true; removing: false; value: string }
  | { ok: false; error: string };

/**
 * An empty value means "remove the MRN", which is a legitimate admin action and
 * not an error. Anything else must match the clinic format.
 */
export function validateMrn(raw: unknown): MrnValidation {
  const value = normalizeMrn(raw);

  if (value === "") return { ok: true, removing: true, value: "" };

  if (value.length < MRN_MIN_LENGTH) {
    return {
      ok: false,
      error: "That Medical Record Number is too short. Use at least 2 characters, for example S1900615.",
    };
  }
  if (value.length > MRN_MAX_LENGTH) {
    return {
      ok: false,
      error: `That Medical Record Number is too long. Use at most ${MRN_MAX_LENGTH} characters.`,
    };
  }
  if (!MRN_PATTERN.test(value)) {
    return {
      ok: false,
      error: "Enter a valid Medical Record Number (letters, numbers and dashes only).",
    };
  }

  return { ok: true, removing: false, value };
}

/** Regex-safe so a search for "a+b" cannot become a pattern. */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type MrnState = "any" | "assigned" | "unassigned";
export type DirectoryRole = UserRole | "all";

export interface DirectoryFilterInput {
  /** Free text matched against name, email, phone and MRN. */
  query?: string;
  role?: DirectoryRole;
  mrnState?: MrnState;
}

const SEARCH_FIELDS = ["name", "email", "phone", "mrn"] as const;

/**
 * The filter behind the Users directory search box.
 *
 * A blank query matches everything rather than nothing, so an empty box shows
 * the full list instead of a silently empty screen. An unassigned-MRN search is
 * expressed as "the field is absent or empty" because both mean no number has
 * been issued yet, and the clinic will want to find exactly those patients when
 * it starts issuing numbers.
 */
export function buildDirectoryFilter(input: DirectoryFilterInput = {}): QueryFilter<IUser> {
  const clauses: QueryFilter<IUser>[] = [];

  const query = String(input.query ?? "").trim();
  if (query) {
    const rx = new RegExp(escapeRegExp(query), "i");
    clauses.push({ $or: SEARCH_FIELDS.map((field) => ({ [field]: rx }) as QueryFilter<IUser>) });
  }

  const role = input.role ?? "all";
  if (role !== "all") clauses.push({ role });

  if (input.mrnState === "assigned") clauses.push({ mrn: { $exists: true, $nin: ["", null] } });
  if (input.mrnState === "unassigned") clauses.push({ $or: [{ mrn: { $exists: false } }, { mrn: "" }, { mrn: null }] });

  if (clauses.length === 0) return {};

  // More than one clause has to be ANDed together; a single clause can be used
  // on its own so the empty-MRN search does not end up as a confusingly
  // nested $and of one element.
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

export interface DirectoryRowInput {
  _id: unknown;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  mrn?: string;
  dob?: string;
  gender?: string;
  address?: string;
  avatar?: string;
  whatsappOptIn?: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  familyMembers?: Array<{ _id?: unknown; name: string; relation?: string; dob?: string }>;
}

/**
 * The shape the directory list renders. Deliberately flat: this is a phone
 * first screen, so a tile needs an MRN, a name and two facts, not a nested
 * document. Everything else is behind the detail request.
 */
export function toDirectoryRow(user: DirectoryRowInput) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    mrn: user.mrn ?? "",
    dob: user.dob ?? "",
    gender: user.gender ?? "",
    address: user.address ?? "",
    avatar: user.avatar ?? "",
    whatsappOptIn: Boolean(user.whatsappOptIn),
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    familyCount: (user.familyMembers ?? []).length,
  };
}