import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

type MemoryEntry = {
  count: number;
  resetAt: number;
};

type Dimension = string | undefined;

export interface RateLimitRule {
  /** Logical route name, for example `auth-login` or `contact-create`. */
  scope: string;
  limit: number;
  windowMs: number;
  /** Additional dimensions such as normalized email or account id. */
  dimensions?: Dimension[];
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  /** True when the shared Upstash Redis REST backend was used. */
  shared: boolean;
}

const globalWithRateLimit = global as typeof globalThis & {
  __s19RateLimits?: Map<string, MemoryEntry>;
};

const memory = globalWithRateLimit.__s19RateLimits ?? new Map<string, MemoryEntry>();
globalWithRateLimit.__s19RateLimits = memory;

let lastMemorySweep = 0;

function sweepMemory(now: number): void {
  if (now - lastMemorySweep < 60_000) return;
  lastMemorySweep = now;
  for (const [key, entry] of memory) {
    if (entry.resetAt <= now) memory.delete(key);
  }
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwarded = forwardedFor?.split(",")[0]?.trim();
  return (
    forwarded ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

function redisConfig(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function checkShared(
  redis: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  // One Lua operation makes increment + first-use expiry atomic. Keys are
  // hashed before reaching Redis, so emails/account ids are not exposed there.
  const script = [
    "local n = redis.call('INCR', KEYS[1])",
    "if n == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end",
    "local ttl = redis.call('PTTL', KEYS[1])",
    "return {n, ttl}",
  ].join(";");
  const response = await fetch(redis.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redis.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["EVAL", script, "1", key, String(windowMs)]),
    cache: "no-store",
    signal: AbortSignal.timeout(3_000),
  });
  if (!response.ok) {
    throw new Error(`Shared rate-limit request failed with ${response.status}`);
  }
  const payload = (await response.json()) as { result?: [number, number] };
  if (!Array.isArray(payload.result) || payload.result.length !== 2) {
    throw new Error("Shared rate-limit response was invalid");
  }
  const count = Number(payload.result[0]);
  const ttlMs = Math.max(0, Number(payload.result[1]));
  const resetAt = Date.now() + ttlMs;
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
    shared: true,
  };
}

function checkMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepMemory(now);
  const current = memory.get(key);
  const entry =
    current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };
  entry.count += 1;
  memory.set(key, entry);
  return {
    allowed: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    shared: false,
  };
}

/**
 * Applies every dimension and returns the most restrictive result. The request
 * IP is always included. In a multi-instance/serverless deployment configure
 * Upstash Redis; the in-memory fallback is only per-process and is not a
 * sufficient distributed control.
 */
export async function rateLimitRequest(
  request: Request,
  rule: RateLimitRule
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  const dimensions = [`ip:${ip}`, ...(rule.dimensions ?? [])]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().toLowerCase());
  const uniqueDimensions = [...new Set(dimensions)];
  const redis = redisConfig();
  const results: RateLimitResult[] = [];

  for (const dimension of uniqueDimensions) {
    const key = `s19:rl:${rule.scope}:${digest(dimension)}`;
    if (redis) {
      try {
        results.push(await checkShared(redis, key, rule.limit, rule.windowMs));
        continue;
      } catch (error) {
        // A control-plane outage must not silently remove the limit. Fall back
        // to this process while emitting an operator-visible signal.
        console.error("[rate-limit] shared backend unavailable:", error);
      }
    }
    results.push(checkMemory(key, rule.limit, rule.windowMs));
  }

  const denied = results.find((result) => !result.allowed);
  if (denied) return denied;
  return results.reduce((strictest, result) =>
    result.remaining < strictest.remaining ? result : strictest
  );
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
