import type { z } from 'zod';

import { CLIENT } from '@/core/constants';
import type { Role } from '@/core/probes/fallbackBank';
import type { BeliefInput } from '@/core/verdict/types';
import {
  ApiErrorSchema,
  type CheckOutcomeResponse,
  CheckOutcomeSchema,
  type ProbeOutcomeResponse,
  ProbeOutcomeSchema,
} from '@/lib/contracts';

/** A failed request, already reduced to something worth showing a person. */
export interface ApiFailure {
  readonly code: string;
  readonly message: string;
}

export type ApiResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: ApiFailure };

/** Minimal fetch shape, injected so tests never touch the network. */
export type Fetcher = (input: string, init: RequestInit) => Promise<Response>;

const OFFLINE: ApiFailure = {
  code: 'network',
  message: 'Could not reach the server. Check your connection and try again.',
};

const TIMED_OUT: ApiFailure = {
  code: 'timeout',
  message: 'The check is taking too long. Please try again in a moment.',
};

const UNREADABLE: ApiFailure = {
  code: 'bad_response',
  message: 'The server sent something unexpected. Please try again.',
};

function toFailure(body: unknown): ApiFailure {
  const parsed = ApiErrorSchema.safeParse(body);
  return parsed.success ? { code: parsed.data.error.code, message: parsed.data.error.message } : UNREADABLE;
}

async function readBody(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    return null;
  }
}

async function postJson<T>(
  path: string,
  body: unknown,
  options: { readonly schema: z.ZodType<T>; readonly fetcher: Fetcher },
): Promise<ApiResult<T>> {
  // A hung connection must not leave the user on a spinner forever.
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, CLIENT.requestTimeoutMs);
  let response: Response;
  try {
    response = await options.fetcher(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    return { ok: false, error: controller.signal.aborted ? TIMED_OUT : OFFLINE };
  } finally {
    clearTimeout(timer);
  }
  const payload = await readBody(response);
  if (!response.ok) {
    return { ok: false, error: toFailure(payload) };
  }
  const parsed = options.schema.safeParse(payload);
  return parsed.success ? { ok: true, value: parsed.data } : { ok: false, error: UNREADABLE };
}

/**
 * Asks the server for teach-back probe questions.
 *
 * @param input - Role and page texts.
 * @param fetcher - Injected fetch.
 * @returns Probes, or a displayable failure. Complexity: one request.
 */
export function requestProbes(
  input: { readonly role: Role; readonly pages: readonly string[] },
  fetcher: Fetcher,
): Promise<ApiResult<ProbeOutcomeResponse>> {
  return postJson('/api/probes', input, { schema: ProbeOutcomeSchema, fetcher });
}

/**
 * Checks beliefs against the document.
 *
 * @param input - Page texts and beliefs.
 * @param fetcher - Injected fetch.
 * @returns Findings, or a displayable failure. Complexity: one request.
 */
export function requestCheck(
  input: { readonly pages: readonly string[]; readonly beliefs: readonly BeliefInput[] },
  fetcher: Fetcher,
): Promise<ApiResult<CheckOutcomeResponse>> {
  return postJson('/api/check', input, { schema: CheckOutcomeSchema, fetcher });
}
