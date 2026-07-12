/**
 * In-memory TTL cache with in-flight request deduplication.
 *
 * Why it exists: Alchemy and CoinGecko are both called on free tiers, so
 * every upstream request is cached (portfolio responses ~60s, token
 * metadata ~24h, prices ~60s) and concurrent requests for the same key
 * share a single upstream call instead of stampeding.
 *
 * Scope: per-serverless-instance memory. That is the right size for a
 * portfolio demo; a production deployment would swap this for Redis/KV
 * behind the same interface.
 */

type Entry = { value: unknown; expiresAt: number };

const MAX_ENTRIES = 1000;

class TtlCache {
  private store = new Map<string, Entry>();
  private inFlight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value as T;
  }

  set(key: string, value: unknown, ttlMs: number): void {
    // Map preserves insertion order, so the first key is the oldest write.
    if (!this.store.has(key) && this.store.size >= MAX_ENTRIES) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  async getOrSet<T>(
    key: string,
    ttlMs: number,
    fn: () => Promise<T>,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const pending = this.inFlight.get(key);
    if (pending) return pending as Promise<T>;

    const promise = fn()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });
    this.inFlight.set(key, promise);
    return promise;
  }
}

// Survive Next.js dev-server hot reloads by stashing the instance globally.
const globalScope = globalThis as unknown as { __ttlCache?: TtlCache };
export const cache = (globalScope.__ttlCache ??= new TtlCache());

export const TTL = {
  PORTFOLIO: 60_000,
  PRICES: 60_000,
  TOKEN_METADATA: 24 * 60 * 60 * 1000,
} as const;
