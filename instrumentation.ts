import { installConsoleCapture, recordAppLog, scrubLogText } from "@/lib/app-log";

/**
 * Next.js instrumentation.
 *
 * Two jobs:
 *
 *   1. `register()` puts the durable console capture in place once per server
 *      instance, so every existing `console.error("[scope] …")` call in the
 *      codebase is recorded in the database as well as on the platform.
 *
 *   2. `onRequestError()` stores unhandled server errors - the ones Next.js
 *      catches on the way to a 500 - along with the route that produced them.
 *      These are the authoritative record for framework-level failures, which
 *      is why the console capture deliberately ignores the platform's own
 *      internal logging: capturing both would record every framework error
 *      twice.
 *
 * ## Why this must stay Edge-safe
 *
 * Next.js builds an Edge variant of instrumentation alongside the Node one and
 * the bundler resolves imports statically - it does *not* respect the
 * `NEXT_RUNTIME` guard below. So although the guard means this code never runs
 * on Edge, everything it imports is still compiled for Edge, and a single
 * Node-only import (`node:crypto`) fails that build.
 *
 * `lib/app-log.ts` is therefore written without Node builtins: its fingerprint
 * uses FNV-1a rather than `node:crypto`. The fingerprint is a bucketing key,
 * not a security control, so a non-cryptographic hash is the right tool. If you
 * add a `node:` import here or anywhere it reaches, expect `next build` to fail
 * with "A Node.js module is loaded ... not supported in the Edge Runtime".
 *
 * If a genuinely Node-only dependency is ever needed, the framework's
 * documented escape hatch is a runtime-guarded `require()` into a separate
 * file - though note that Turbopack traces `require()` too, so the guard alone
 * does not keep the import out of the Edge bundle.
 */

interface RequestErrorContext {
  routerKind?: string;
  routeType?: string;
  renderSource?: string;
}

export function register(): void {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    installConsoleCapture();
  } catch {
    // Observability must not be the reason a request fails.
  }
}

export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context?: RequestErrorContext
): Promise<void> {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    const err = error instanceof Error ? error : undefined;
    const digest =
      err && "digest" in err && typeof (err as { digest?: unknown }).digest === "string"
        ? (err as { digest: string }).digest
        : undefined;

    await recordAppLog({
      level: "error",
      source: "request",
      scope: `request:${context?.routeType ?? "unknown"}`,
      message: err?.message
        ? scrubLogText(err.message).slice(0, 500)
        : `Unhandled server error: ${scrubLogText(String(error)).slice(0, 400)}`,
      // Request headers are deliberately omitted: they carry the session
      // cookie and would put live credentials in a log that gets emailed.
      route: request?.path,
      method: request?.method,
      digest,
    });
  } catch {
    // Runs while the framework is already handling a failure. A second
    // exception here would replace the original error with a less useful one.
  }
}
