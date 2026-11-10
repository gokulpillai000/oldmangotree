/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 * Tracks attempts per IP to prevent brute-force attacks and endpoint abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up stale IP records every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleRecords(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const threshold = now - windowMs;
  for (const [key, record] of rateLimitStore.entries()) {
    const valid = record.timestamps.filter((ts) => ts > threshold);
    if (valid.length === 0) {
      rateLimitStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Check if a request identified by `key` has exceeded `maxRequests` in `windowSeconds`.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  purgeStaleRecords(windowMs);

  const record = rateLimitStore.get(key) || { timestamps: [] };
  const cutoff = now - windowMs;

  // Filter out timestamps outside the active sliding window
  const activeTimestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (activeTimestamps.length >= maxRequests) {
    const oldestTimestamp = activeTimestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  const remaining = Math.max(0, maxRequests - activeTimestamps.length);
  return {
    allowed: true,
    remaining,
    resetSeconds: windowSeconds,
  };
}

/**
 * Extract client IP address from Next.js request headers.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}
