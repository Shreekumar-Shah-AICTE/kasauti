import type { ApiResult } from '@/lib/api';

/** Results the memo may keep: only answers the model actually produced are worth reusing. */
interface Reusable {
  readonly mode: 'live' | 'offline';
}

/** Reuses a request's result when the same input is sent again in this tab. */
export type RequestMemo<T> = (key: string, run: () => Promise<ApiResult<T>>) => Promise<ApiResult<T>>;

/**
 * Creates a small in-tab memo for one endpoint's results. Going back to edit an answer and
 * checking the same beliefs again, or revisiting a role, then costs no request and no model
 * call. Failures and offline results are never kept, so a retry can still reach the model.
 *
 * @param maxEntries - Results kept before the oldest is dropped (bounds memory).
 * @returns The memo. Complexity: O(1) per lookup, O(maxEntries) memory.
 */
export function createRequestMemo<T extends Reusable>(maxEntries: number): RequestMemo<T> {
  const results = new Map<string, ApiResult<T>>();
  return async (key, run) => {
    const hit = results.get(key);
    if (hit !== undefined) {
      return hit;
    }
    const result = await run();
    if (result.ok && result.value.mode === 'live') {
      results.set(key, result);
      const oldest = results.keys().next();
      if (results.size > maxEntries && oldest.done !== true) {
        results.delete(oldest.value);
      }
    }
    return result;
  };
}
