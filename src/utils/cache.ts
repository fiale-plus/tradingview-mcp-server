/**
 * Simple in-memory cache with TTL
 */

interface CacheEntry {
  data: any;
  expires: number;
}

export class Cache {
  private store = new Map<string, CacheEntry>();
  private ttl: number;

  constructor(ttlSeconds: number = 300) {
    this.ttl = ttlSeconds * 1000;
  }

  get(key: string): any | null {
    if (this.ttl === 0) return null; // Caching disabled

    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() >= entry.expires) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: any): void {
    if (this.ttl === 0) return; // Caching disabled

    this.store.set(key, {
      data,
      expires: Date.now() + this.ttl,
    });
  }

  clear(): void {
    this.store.clear();
  }

  // Periodic cleanup of expired entries
  startCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now >= entry.expires) {
          this.store.delete(key);
        }
      }
    }, intervalMs);
  }
}
