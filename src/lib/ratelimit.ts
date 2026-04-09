/**
 * Simple in-process rate limiter for API routes.
 * Uses a sliding window algorithm with a Map-based store.
 *
 * NOTE: In Cloudflare Workers each isolate has its own Map — state is NOT
 * shared across edge nodes. For distributed rate limiting at scale, swap this
 * for Cloudflare KV or Upstash Redis:
 * https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Lazy inline cleanup — runs on every 100th write instead of setInterval
// (setInterval is not reliable across Cloudflare Worker isolate lifecycles)
let writeCount = 0;
function maybeCleanup() {
  if (++writeCount % 100 !== 0) return;
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check and increment rate limit for a given identifier.
 * @param identifier - usually IP address or user ID
 * @param config - rate limit configuration
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 60, windowSecs: 60 }
): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSecs * 1000;
  const key = `${identifier}:${Math.floor(now / windowMs)}`;

  const entry = store.get(key) ?? { count: 0, resetAt: now + windowMs };

  if (entry.count >= config.limit) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: config.limit,
    };
  }

  entry.count++;
  store.set(key, entry);
  maybeCleanup();

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
    limit: config.limit,
  };
}

/**
 * Get the client IP from a Next.js request.
 * Respects common proxy headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers as any);
  return (
    headers.get("cf-connecting-ip") ??        // Cloudflare
    headers.get("x-real-ip") ??               // nginx proxy
    headers.get("x-forwarded-for")?.split(",")[0].trim() ?? // Load balancers
    "unknown"
  );
}

/**
 * Predefined rate limit configs for different endpoint types
 */
export const RATE_LIMITS = {
  /** Standard API: 60 req/min */
  standard: { limit: 60, windowSecs: 60 } satisfies RateLimitConfig,
  /** Strict: auth endpoints, 10 req/min */
  auth: { limit: 10, windowSecs: 60 } satisfies RateLimitConfig,
  /** External API proxies (NREL, Mapbox): 20 req/min */
  external: { limit: 20, windowSecs: 60 } satisfies RateLimitConfig,
  /** Lead purchase: 5 per 10 minutes */
  purchase: { limit: 5, windowSecs: 600 } satisfies RateLimitConfig,
} as const;
