import { createHash } from 'node:crypto';

/** Bounded result cache keyed by a content hash. */
export interface ResultCache<T> {
  readonly get: (key: string) => T | undefined;
  readonly set: (key: string, value: T) => void;
}

/**
 * Creates an in-memory LRU cache so re-checking the same document and beliefs costs no
 * model call. Only a hash is used as the key; the document itself is never stored as a key.
 *
 * @param maxEntries - Entries kept before the least recently used is evicted.
 * @returns The cache. Complexity: O(1) per operation.
 */
export function createCache<T>(maxEntries: number): ResultCache<T> {
  const entries = new Map<string, T>();
  return {
    get: (key) => {
      const value = entries.get(key);
      if (value !== undefined) {
        entries.delete(key);
        entries.set(key, value);
      }
      return value;
    },
    set: (key, value) => {
      entries.delete(key);
      entries.set(key, value);
      const oldest = entries.keys().next();
      if (entries.size > maxEntries && oldest.done !== true) {
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
