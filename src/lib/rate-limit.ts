/**
 * Sliding-window per-IP rate limiter (in-memory, per instance).
 *
 * Second line of defense for the free-tier upstream quotas: the TTL cache
 * absorbs repeat lookups, this stops a single client from hammering the
 * API with unique addresses.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30;
const MAX_TRACKED_IPS = 5000;

const globalScope = globalThis as unknown as {
  __rateLimitHits?: Map<string, number[]>;
};
const hits = (globalScope.__rateLimitHits ??= new Map<string, number[]>());

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }

  recent.push(now);
  if (!hits.has(ip) && hits.size >= MAX_TRACKED_IPS) {
    // Drop the oldest-seen IP to bound memory.
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }
  hits.set(ip, recent);
  return false;
}
