import { createGeminiGenerate } from '@/ai/gemini';
import { AI, MS_PER_MINUTE, SERVER } from '@/core/constants';
import type { EndpointDeps } from '@/server/endpoints';
import { createRateLimiter } from '@/server/rateLimit';

/**
 * Builds production dependencies. A missing or blank key means offline mode: the app still
 * works end to end with deterministic probes and keyword evidence, clearly labelled.
 *
 * @param apiKey - Server-only `GEMINI_API_KEY`; never exposed to the browser.
 * @returns Endpoint dependencies with one shared rate limiter. Complexity: O(1).
 */
export function createServerDeps(apiKey: string | undefined): EndpointDeps {
  const key = apiKey?.trim() ?? '';
  return {
    ai: { generate: key === '' ? null : createGeminiGenerate(key), timeoutMs: AI.timeoutMs },
    allow: createRateLimiter({
      capacity: SERVER.rateLimitBurst,
      refillPerMs: SERVER.rateLimitPerMinute / MS_PER_MINUTE,
      maxClients: SERVER.rateLimitMaxClients,
      now: () => Date.now(),
    }),
  };
}
