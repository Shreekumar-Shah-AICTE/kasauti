import type { z } from 'zod';

import { type AiDeps, checkBeliefs, generateProbes, type Mode } from '@/ai/service';
import { PAGE_SEPARATOR, SERVER } from '@/core/constants';
import { createCache, hashKey } from '@/server/cache';
import { ApiError, errorResponse, NO_STORE } from '@/server/errors';
import { clientKey, type RateLimiter } from '@/server/rateLimit';
import { CheckRequestSchema, parseRequest, ProbeRequestSchema } from '@/server/validateInput';

/** Everything an endpoint needs, injected so tests never touch the network. */
export interface EndpointDeps {
  readonly ai: AiDeps;
  readonly allow: RateLimiter;
}

/** A Next.js route handler. */
export type Handler = (request: Request) => Promise<Response>;

interface EndpointSpec<T, R> {
  readonly schema: z.ZodType<T>;
  readonly run: (input: T) => Promise<R>;
}

const encoder = new TextEncoder();

async function readJson(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > SERVER.maxBodyBytes) {
    throw new ApiError('payload_too_large');
  }
  const body = await request.text();
  if (encoder.encode(body).length > SERVER.maxBodyBytes) {
    throw new ApiError('payload_too_large');
  }
  try {
    const parsed: unknown = JSON.parse(body);
    return parsed;
  } catch {
    throw new ApiError('invalid_json');
  }
}

/**
 * Wraps one API operation with the shared pipeline: rate limit → size cap → JSON parse →
 * zod validation → cache → run → sanitised response. Only live results are cached, so a
 * transient outage never pins a user to offline mode.
 */
function createEndpoint<T, R extends { readonly mode: Mode }>(
  deps: EndpointDeps,
  spec: EndpointSpec<T, R>,
): Handler {
  const cache = createCache<R>(SERVER.cacheEntries);
  return async (request) => {
    try {
      if (!deps.allow(clientKey(request))) {
        throw new ApiError('rate_limited');
      }
      const input = parseRequest(spec.schema, await readJson(request));
      const key = hashKey(input);
      const result = cache.get(key) ?? (await spec.run(input));
      if (result.mode === 'live') {
        cache.set(key, result);
      }
      return Response.json(result, { headers: NO_STORE });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * `POST /api/probes`: role-specific teach-back questions for a document.
 *
 * @param deps - Injected AI dependencies and rate limiter.
 * @returns The route handler. Complexity: at most two model calls per uncached request.
 */
export function createProbesHandler(deps: EndpointDeps): Handler {
  return createEndpoint(deps, {
    schema: ProbeRequestSchema,
    run: (input) =>
      generateProbes(deps.ai, { role: input.role, documentText: input.pages.join(PAGE_SEPARATOR) }),
  });
}

/**
 * `POST /api/check`: checks every belief in one batched model call, then applies the
 * deterministic verdict policy.
 *
 * @param deps - Injected AI dependencies and rate limiter.
 * @returns The route handler. Complexity: at most two model calls per uncached request.
 */
export function createCheckHandler(deps: EndpointDeps): Handler {
  return createEndpoint(deps, {
    schema: CheckRequestSchema,
    run: (input) => checkBeliefs(deps.ai, { pages: input.pages, beliefs: input.beliefs }),
  });
}
