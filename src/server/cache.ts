import { createHash } from 'node:crypto';

/** Bounded result cache keyed by a content hash. */
export interface ResultCache<T> {
  readonly get: (key: string) => T | undefined;
  readonly set: (key: string, value: T) => void;
}

/** Cache size, freshness and clock. `now` is injected so tests control time. */
export interface CacheOptions {
  /** Entries kept before the least recently used is evicted (bounds memory). */
  readonly maxEntries: number;
  /** Milliseconds an entry stays fresh; stale entries are dropped on read. */
  readonly ttlMs: number;
  readonly now: () => number;
}

interface Entry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

/**
 * Creates an in-memory LRU cache with a time-to-live, so re-checking the same document and
 * beliefs costs no model call while stale answers still expire. Only a hash is used as the key;
 * the document itself is never stored as a key.
 *
 * @param options - Size bound, time-to-live and clock.
 * @returns The cache. Complexity: O(1) per operation, O(maxEntries) memory.
 */
export function createCache<T>(options: CacheOptions): ResultCache<T> {
  const entries = new Map<string, Entry<T>>();
  return {
    get: (key) => {
      const entry = entries.get(key);
      if (entry === undefined) {
        return undefined;
      }
      entries.delete(key);
      if (entry.expiresAt <= options.now()) {
        return undefined;
      }
      // Re-inserting moves the key to the end, so Map order tracks recency.
      entries.set(key, entry);
      return entry.value;
    },
    set: (key, value) => {
      entries.delete(key);
      entries.set(key, { value, expiresAt: options.now() + options.ttlMs });
      const oldest = entries.keys().next();
      if (entries.size > options.maxEntries && oldest.done !== true) {
        entries.delete(oldest.value);
      }
    },
  };
}

/**
 * Hashes a validated request into a stable cache key.
 *
 * @param value - JSON-serialisable input.
 * @returns A SHA-256 hex digest. Complexity: O(n) in the serialised size.
 */
export function hashKey(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
