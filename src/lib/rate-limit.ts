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

/**
 * `key` should namespace the caller, e.g. "portfolio:1.2.3.4" — routes get
 * separate budgets so a burst on one can't starve another.
 */
export function isRateLimited(
  key: string,
  maxPerWindow = MAX_REQUESTS_PER_WINDOW,
): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= maxPerWindow) {
    hits.set(key, recent);
    return true;
  }

  recent.push(now);
  if (!hits.has(key) && hits.size >= MAX_TRACKED_IPS) {
    // Drop the oldest-seen key to bound memory.
    const oldest = hits.keys().next().value;
    if (oldest !== undefined) hits.delete(oldest);
  }
  hits.set(key, recent);
  return false;
}
