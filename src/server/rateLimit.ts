/** Token-bucket settings. `now` is injected so tests control time. */
export interface RateLimitOptions {
  /** Requests a client may burst before throttling. */
  readonly capacity: number;
  /** Tokens regained per millisecond. */
  readonly refillPerMs: number;
  /** Clients tracked before the least recently seen is evicted (bounds memory). */
  readonly maxClients: number;
  readonly now: () => number;
}

/** Returns `true` when the request identified by `key` may proceed. */
export type RateLimiter = (key: string) => boolean;

interface Bucket {
  readonly tokens: number;
  readonly updatedAt: number;
}

function refill(bucket: Bucket | undefined, now: number, options: RateLimitOptions): Bucket {
  if (bucket === undefined) {
    return { tokens: options.capacity, updatedAt: now };
  }
  const elapsed = Math.max(0, now - bucket.updatedAt);
  return {
    tokens: Math.min(options.capacity, bucket.tokens + elapsed * options.refillPerMs),
    updatedAt: now,
  };
}

function evictOldest(buckets: Map<string, Bucket>, maxClients: number): void {
  // Map iterates in insertion order, so the first keys are the least recently seen.
  for (const key of buckets.keys()) {
    if (buckets.size <= maxClients) {
      return;
    }
    buckets.delete(key);
  }
}

/**
 * Creates an in-memory, per-instance token-bucket limiter. On serverless platforms each
 * instance keeps its own buckets; that trade-off is documented in RISKS.md.
 *
 * @param options - Capacity, refill rate, memory bound and clock.
 * @returns A limiter function. Complexity: O(1) per call, O(maxClients) memory.
 */
export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const buckets = new Map<string, Bucket>();
  return (key) => {
    const now = options.now();
    const bucket = refill(buckets.get(key), now, options);
    const allowed = bucket.tokens >= 1;
    // Delete then set so Map order tracks recency, which makes eviction LRU.
    buckets.delete(key);
    buckets.set(key, { tokens: allowed ? bucket.tokens - 1 : bucket.tokens, updatedAt: now });
    evictOldest(buckets, options.maxClients);
    return allowed;
  };
}

/**
 * Identifies the caller for rate limiting. On Vercel `x-forwarded-for` is set by the platform,
 * so its first entry is the real client address.
 *
 * @param request - Incoming request.
 * @returns A best-effort client key. Complexity: O(header length).
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  if (forwarded !== '') {
    return forwarded;
  }
  return request.headers.get('x-real-ip')?.trim() ?? 'anonymous';
}
