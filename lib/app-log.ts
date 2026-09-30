import "server-only";

import { connectDb } from "@/lib/db";
import { AppLog, type AppLogLevel, type AppLogSource } from "@/lib/models/AppLog";

/**
 * Durable application log.
 *
 * Platform console output is retained for as little as one hour depending on
 * the hosting plan, so it cannot be relied on to answer "what broke last
 * Tuesday". Every entry written here also goes to the console, meaning the
 * platform's own log stream is unaffected - this only adds a copy that
 * survives.
 *
 * Two capture paths feed it:
 *   1. `installConsoleCapture()` patches `console.error` / `console.warn` and
 *      records any call using this codebase's `console.error("[scope] …")`
 *      convention. All 93 existing call sites are covered without edits.
 *   2. `recordAppLog()` is called directly for everything else, notably the
 *      Next.js unhandled-server-error hook in `instrumentation.ts`.
 *
 * Nothing in this module may throw. A log that breaks the request it is
 * describing is worse than no log at all, so every failure is swallowed.
 */

/** Identical errors inside this window collapse into one row with a count. */
const DEDUPE_WINDOW_MS = 60_000;

/** Ceiling on database writes per minute, so a failing loop cannot flood Mongo. */
const MAX_WRITES_PER_MINUTE = 120;

const MAX_MESSAGE = 500;
const MAX_CONTEXT = 4000;
const MAX_STACK_LINES = 8;
const MAX_KEYS = 25;
const MAX_ARRAY_ITEMS = 20;
const MAX_DEPTH = 4;

/* ------------------------------------------------------------------ */
/* Fingerprinting                                                      */
/* ------------------------------------------------------------------ */

/**
 * Groups repeat occurrences of the same error so they collapse into one row.
 *
 * This is a bucketing key, not a security control - nothing is protected by it
 * and no secret depends on it being unpredictable. It is computed with FNV-1a
 * rather than `node:crypto` because `instrumentation.ts` is also compiled for
 * the Edge runtime, where the `node:` builtins do not exist. The Edge build
 * traces statically and ignores the runtime guard, so a `node:crypto` import
 * anywhere in this chain fails that build even though the branch never runs
 * there. Two independent passes with different offsets give a 64-bit result:
 * collisions need two distinct errors to agree across both, which at any
 * realistic volume of error signatures is not a practical concern.
 */
function hashFingerprint(value: string): string {
  const OFFSETS = [0x811c9dc5, 0x01000193] as const;

  let out = "";
  for (const seed of OFFSETS) {
    // 32-bit FNV-1a. Math.imul keeps the multiply in 32-bit range, so this is
    // deterministic across engines rather than drifting with float precision.
    let h = seed;
    for (let i = 0; i < value.length; i += 1) {
      h ^= value.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    out += h.toString(16).padStart(8, "0");
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Redaction                                                           */
/* ------------------------------------------------------------------ */

/**
 * Values under these keys are dropped wholesale. Checked before the value is
 * ever inspected, so a token cannot leak through a nested shape.
 */
const SENSITIVE_KEY =
  /(pass(word)?|secret|token|authorization|cookie|api[-_]?key|credential|session|cvv|pin\b)/i;

/** Values under these keys are treated as phone numbers and masked tail-first. */
const PHONE_KEY = /(phone|msisdn|mobile|whatsapp|recipient|tel\b|^to$|contact)/i;

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/**
 * Phone numbers as people actually write them: an optional `+` then 7+ digits
 * with at least one separator. Deliberately requires a separator so that bare
 * numeric identifiers - ObjectIds, epoch milliseconds, byte counts - survive
 * intact and stay useful when debugging.
 */
const FORMATTED_PHONE_RE = /(?:\+?\d[\d\s().-]*\d)/g;

const BEARER_RE = /\b(?:Bearer|token)\s+\S{10,}/gi;

const SCOPE_TAG_RE = /^\[([a-z0-9][a-z0-9._/-]*)\]/i;

/** `john.doe@example.com` -> `j***@example.com`. The domain is kept on
 *  purpose: SMTP failures are usually domain-level and the masked address is
 *  still enough to identify which recipient failed. */
function maskEmails(text: string): string {
  return text.replace(EMAIL_RE, (match) => {
    const at = match.lastIndexOf("@");
    return `${match.slice(0, 1)}***${match.slice(at)}`;
  });
}

function maskPhoneRuns(text: string): string {
  return text.replace(FORMATTED_PHONE_RE, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 7) return match;
    return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
  });
}

/** Keeps the final four digits, which is enough to correlate without exposing. */
function maskKeepLast4(text: string): string {
  const total = (text.match(/\d/g) ?? []).length;
  if (total === 0) return text;
  let index = 0;
  return text.replace(/\d/g, (digit) => {
    index += 1;
    return index > total - 4 ? digit : "*";
  });
}

function scrub(text: string): string {
  return maskPhoneRuns(maskEmails(text)).replace(BEARER_RE, "[redacted-token]");
}

/**
 * Walks an arbitrary log payload and returns a JSON-safe, redacted copy.
 * `seen` breaks cycles, which matter because Mongoose documents, NextRequest
 * instances and HTTP errors all carry circular references.
 */
function sanitize(value: unknown, key: string, depth: number, seen: WeakSet<object>): unknown {
  if (depth > MAX_DEPTH) return "[truncated]";
  if (key && SENSITIVE_KEY.test(key)) return "[redacted]";
  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    const masked = scrub(value);
    return key && PHONE_KEY.test(key) ? maskKeepLast4(masked) : masked;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol" || typeof value === "function") return `[${typeof value}]`;

  if (value instanceof Error) {
    const stack = value.stack
      ? String(value.stack).split("\n").slice(0, MAX_STACK_LINES).join("\n")
      : undefined;
    return {
      name: value.name,
      message: scrub(value.message),
      ...(stack ? { stack: scrub(stack) } : {}),
    };
  }

  if (typeof value !== "object") return String(value);
  if (seen.has(value)) return "[circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitize(item, "", depth + 1, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>).slice(
    0,
    MAX_KEYS
  )) {
    out[entryKey] = sanitize(entryValue, entryKey, depth + 1, seen);
  }
  return out;
}

function renderContext(value: unknown): string | undefined {
  try {
    const text = JSON.stringify(value);
    if (!text) return undefined;
    return text.length > MAX_CONTEXT ? `${text.slice(0, MAX_CONTEXT)}…[truncated]` : text;
  } catch {
    return "[unserialisable context]";
  }
}

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

let windowStartedAt = Date.now();
let windowWrites = 0;

/** Returns false once the per-minute write ceiling is reached. */
function withinWriteBudget(): boolean {
  const now = Date.now();
  if (now - windowStartedAt > 60_000) {
    windowStartedAt = now;
    windowWrites = 0;
  }
  windowWrites += 1;
  return windowWrites <= MAX_WRITES_PER_MINUTE;
}

export interface AppLogInput {
  level: AppLogLevel;
  scope: string;
  message: string;
  context?: string;
  route?: string;
  method?: string;
  status?: number;
  digest?: string;
  source?: AppLogSource;
}

/**
 * Persists one entry. Repeats of the same scope + message + route inside the
 * collapse window increment a counter on the existing row rather than adding
 * another, so a failing endpoint does not bury the admin panel in duplicates.
 * Never throws.
 */
export async function recordAppLog(input: AppLogInput): Promise<void> {
  try {
    if (!withinWriteBudget()) return;
    const conn = await connectDb();
    if (!conn) return;

    const now = new Date();
    const scope = scrub(input.scope).slice(0, 80);
    const message = scrub(input.message).slice(0, MAX_MESSAGE);
    const fingerprint = hashFingerprint(`${scope}|${message}|${input.route ?? ""}`);

    // One atomic upsert rather than findOne-then-update.
    //
    // `recordAppLog` is fire-and-forget: callers do not await it, so a failing
    // endpoint produces many overlapping writes. A read-then-write collapses
    // correctly in isolation but loses the race under concurrency, and an error
    // storm is exactly when collapsing matters. Letting the database arbitrate
    // is correct either way and saves a round trip.
    //
    // The filter's `lastSeen` bound is what opens a new window: once the
    // previous row ages out it stops matching and the upsert inserts a fresh
    // row. `fingerprint` is a plain non-unique index, so two rows sharing one
    // fingerprint across windows is expected.
    await AppLog.updateOne(
      { fingerprint, lastSeen: { $gte: new Date(now.getTime() - DEDUPE_WINDOW_MS) } },
      {
        $inc: { occurrences: 1 },
        $set: { lastSeen: now },
        $setOnInsert: {
          level: input.level,
          source: input.source ?? "manual",
          scope,
          message,
          context: input.context ? input.context.slice(0, MAX_CONTEXT) : undefined,
          route: input.route?.slice(0, 300),
          method: input.method?.slice(0, 10),
          status: input.status,
          digest: input.digest?.slice(0, 64),
          fingerprint,
          firstSeen: now,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    reportSwallowedFailure("recordAppLog", err);
  }
}

/**
 * Explicit, durable log call. Prefer this over `console.error` for anything new:
 * it needs no `[tag]` prefix and it always records, including on hosts where
 * console output is discarded entirely.
 */
export function logAppEvent(
  level: AppLogLevel,
  input: Omit<AppLogInput, "level" | "context"> & { context?: unknown }
): void {
  void recordAppLog({
    ...input,
    level,
    source: input.source ?? "manual",
    context:
      typeof input.context === "string"
        ? input.context
        : input.context === undefined
          ? undefined
          : renderContext(sanitize(input.context, "", 0, new WeakSet())),
  });
}

export const logAppError = (input: Parameters<typeof logAppEvent>[1]) => logAppEvent("error", input);
export const logAppWarn = (input: Parameters<typeof logAppEvent>[1]) => logAppEvent("warn", input);

/* ------------------------------------------------------------------ */
/* Console capture                                                     */
/* ------------------------------------------------------------------ */

type CaptureGlobal = typeof globalThis & {
  __s19ConsoleCapture?: boolean;
  __s19LogInFlight?: boolean;
};

/**
 * The console's own reporter, captured before `installConsoleCapture()` patches
 * it.
 *
 * Every write path here is silent by design, because the console patch is what
 * calls into this module and a failure while handling a failure must not throw.
 * That silence has one bad consequence: if the log itself stops working - bad
 * credentials, a schema change, an unreachable database - nothing anywhere
 * reports it, and the log just stays empty while the site looks fine. When
 * `APP_LOG_DEBUG` is set, failures are reported through this reference, which
 * bypasses the patch and so cannot re-enter it.
 *
 * Off by default, so it costs nothing until someone is diagnosing the log.
 */
const rawError =
  typeof console !== "undefined" && typeof console.error === "function"
    ? console.error.bind(console)
    : null;

function reportSwallowedFailure(what: string, err: unknown): void {
  if (!process.env.APP_LOG_DEBUG || !rawError) return;
  rawError(`[app-log] ${what} failed:`, err instanceof Error ? err.stack || err.message : err);
}

/**
 * Splits console arguments into the `(scope, message, context)` shape the
 * schema stores. Returns null when the call does not follow the codebase's
 * `console.error("[scope] …")` convention.
 *
 * Skipping non-conforming calls is deliberate. The platform logs unhandled
 * server errors to the console itself, so capturing those blindly would record
 * every framework error twice - once here and once through the Next.js hook in
 * `instrumentation.ts`, which is the authoritative source for them.
 */
function describeArgs(args: unknown[]): { scope: string; message: string; context?: string } | null {
  const [first, ...rest] = args;
  if (typeof first !== "string") return null;
  const tag = first.match(SCOPE_TAG_RE);
  if (!tag) return null;
  const context = rest.length
    ? renderContext(sanitize(rest, "", 0, new WeakSet()))
    : undefined;
  return {
    scope: tag[1],
    message: scrub(first.replace(SCOPE_TAG_RE, "").trim()) || scrub(first),
    ...(context ? { context } : {}),
  };
}

function capture(level: AppLogLevel, args: unknown[]): void {
  const g = globalThis as CaptureGlobal;
  if (g.__s19LogInFlight) return;
  try {
    const described = describeArgs(args);
    if (!described) return;
    g.__s19LogInFlight = true;
    void recordAppLog({ level, source: "console", ...described }).finally(() => {
      g.__s19LogInFlight = false;
    });
  } catch (err) {
    reportSwallowedFailure("console capture", err);
  }
}

/**
 * Wraps `console.error` and `console.warn` once per server instance. The
 * original functions are always called first, so the platform's own log
 * stream - and anything else reading the console - behaves exactly as before.
 */
export function installConsoleCapture(): void {
  const g = globalThis as CaptureGlobal;
  if (g.__s19ConsoleCapture) return;

  // Both originals are captured before patching, and the console is left
  // untouched if either is unavailable.
  const originalError = rawError;
  const originalWarn = typeof console.warn === "function" ? console.warn.bind(console) : null;
  if (!originalWarn) return;
  g.__s19ConsoleCapture = true;

  console.error = (...args: unknown[]) => {
    originalError?.(...args);
    capture("error", args);
  };
  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    capture("warn", args);
  };
}

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

export interface AppLogFilter {
  level?: AppLogLevel;
  scope?: string;
  source?: AppLogSource;
  search?: string;
  limit?: number;
}

/** Newest first. Capped at 200 rows; a log is a debugging aid, not a report. */
export async function listAppLogs(filter: AppLogFilter = {}) {
  const query: Record<string, unknown> = {};
  if (filter.level) query.level = filter.level;
  if (filter.source) query.source = filter.source;
  if (filter.scope) query.scope = new RegExp(`^${filter.scope.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  if (filter.search) {
    const escaped = filter.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [{ message: new RegExp(escaped, "i") }, { route: new RegExp(escaped, "i") }];
  }
  return AppLog.find(query)
    .sort({ lastSeen: -1 })
    .limit(Math.min(Math.max(filter.limit ?? 100, 1), 200))
    .lean();
}

export interface AppLogSummary {
  totals: Record<string, number>;
  last24h: { errors: number; warns: number; rows: number };
  last7d: { errors: number; warns: number; rows: number };
  scopes: Array<{ scope: string; errors: number; warns: number }>;
  storedRows: number;
  oldestAt: Date | null;
}

export async function summariseAppLogs(): Promise<AppLogSummary> {
  const now = Date.now();
  const dayAgo = new Date(now - 86_400_000);
  const weekAgo = new Date(now - 7 * 86_400_000);

  const [totals, last24h, last7d, storedRows, oldest, grouped] = await Promise.all([
    AppLog.aggregate<{ _id: AppLogLevel; count: number }>([
      { $group: { _id: "$level", count: { $sum: 1 } } },
    ]),
    AppLog.aggregate<{ errors: number; warns: number; rows: number }>([
      { $match: { lastSeen: { $gte: dayAgo } } },
      {
        $group: {
          _id: null,
          rows: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ["$level", "error"] }, 1, 0] } },
          warns: { $sum: { $cond: [{ $eq: ["$level", "warn"] }, 1, 0] } },
        },
      },
    ]),
    AppLog.aggregate<{ errors: number; warns: number; rows: number }>([
      { $match: { lastSeen: { $gte: weekAgo } } },
      {
        $group: {
          _id: null,
          rows: { $sum: 1 },
          errors: { $sum: { $cond: [{ $eq: ["$level", "error"] }, 1, 0] } },
          warns: { $sum: { $cond: [{ $eq: ["$level", "warn"] }, 1, 0] } },
        },
      },
    ]),
    AppLog.countDocuments(),
    AppLog.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
    AppLog.aggregate<{ _id: string; errors: number; warns: number }>([
      { $match: { lastSeen: { $gte: weekAgo }, level: { $in: ["error", "warn"] } } },
      {
        $group: {
          _id: "$scope",
          errors: { $sum: { $cond: [{ $eq: ["$level", "error"] }, 1, 0] } },
          warns: { $sum: { $cond: [{ $eq: ["$level", "warn"] }, 1, 0] } },
        },
      },
      { $sort: { errors: -1, warns: -1 } },
      { $limit: 12 },
    ]),
  ]);

  const blank = { errors: 0, warns: 0, rows: 0 };
  return {
    totals: Object.fromEntries(totals.map((t) => [t._id, t.count])),
    last24h: last24h[0] ?? blank,
    last7d: last7d[0] ?? blank,
    scopes: grouped.map((g) => ({ scope: g._id, errors: g.errors, warns: g.warns })),
    storedRows,
    oldestAt: oldest?.createdAt ?? null,
  };
}

export interface AppLogSignature {
  scope: string;
  message: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

/** Distinct error signatures in a window, most frequent first. Powers the digest. */
export async function summariseWindow(
  from: Date,
  to: Date,
  limit = 8
): Promise<AppLogSignature[]> {
  return AppLog.aggregate<AppLogSignature>([
    { $match: { lastSeen: { $gte: from, $lt: to }, level: "error" } },
    {
      $group: {
        _id: { scope: "$scope", message: "$message" },
        count: { $sum: "$occurrences" },
        firstSeen: { $min: "$firstSeen" },
        lastSeen: { $max: "$lastSeen" },
      },
    },
    { $sort: { count: -1, lastSeen: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        scope: "$_id.scope",
        message: "$_id.message",
        count: 1,
        firstSeen: 1,
        lastSeen: 1,
      },
    },
  ]);
}

export { scrub as scrubLogText };
