import type { z } from 'zod';

import type { Prompt } from '@/ai/prompts';
import { buildRepairPrompt, parseStructured } from '@/ai/repair';

/** How hard the model should think. `null` omits the setting (for models without it). */
export type Thinking = 'low' | 'medium' | null;

/** Provider-neutral request for one structured generation. */
export interface GenerateRequest {
  readonly model: string;
  readonly thinking: Thinking;
  readonly system: string;
  readonly user: string;
  readonly jsonSchema: Record<string, unknown>;
  readonly signal: AbortSignal;
}

/** Injected text generator. Production uses Gemini; tests use fakes. */
export type GenerateText = (request: GenerateRequest) => Promise<string>;

/** Why a structured call failed. */
export type AiFailure = 'timeout' | 'provider_error' | 'invalid_output';

/** Result of a structured call. `repaired` is true when the one-shot retry was needed. */
export type AiResult<T> =
  | { readonly ok: true; readonly value: T; readonly repaired: boolean }
  | { readonly ok: false; readonly failure: AiFailure };

/** Everything describing one structured call. */
export interface StructuredCall<T> {
  readonly model: string;
  readonly thinking: Thinking;
  readonly prompt: Prompt;
  readonly schema: z.ZodType<T>;
  readonly jsonSchema: Record<string, unknown>;
}

type Attempt =
  | { readonly kind: 'text'; readonly text: string }
  | { readonly kind: 'failure'; readonly failure: AiFailure };

function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(new Error('timeout'));
      },
      { once: true },
    );
  });
}

async function attempt<T>(
  generate: GenerateText,
  request: { readonly call: StructuredCall<T>; readonly user: string },
  timeoutMs: number,
): Promise<Attempt> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  const { call, user } = request;
  try {
    const text = await Promise.race([
      generate({
        model: call.model,
        thinking: call.thinking,
        system: call.prompt.system,
        user,
        jsonSchema: call.jsonSchema,
        signal: controller.signal,
      }),
      rejectOnAbort(controller.signal),
    ]);
    return { kind: 'text', text };
  } catch {
    return { kind: 'failure', failure: controller.signal.aborted ? 'timeout' : 'provider_error' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calls the model for structured JSON, validates it with zod and, if invalid, retries once
 * with a repair prompt. Never throws: every failure becomes a typed result so callers can
 * fall back to offline mode.
 *
 * @param generate - Injected generator.
 * @param call - Model, prompt and schema.
 * @param timeoutMs - Hard timeout per attempt.
 * @returns The validated value or a failure reason. Complexity: at most two model calls.
 */
export async function callStructured<T>(
  generate: GenerateText,
  call: StructuredCall<T>,
  timeoutMs: number,
): Promise<AiResult<T>> {
  const first = await attempt(generate, { call, user: call.prompt.user }, timeoutMs);
  if (first.kind === 'failure') {
    return { ok: false, failure: first.failure };
  }
  const parsed = parseStructured(first.text, call.schema);
  if (parsed.ok) {
    return { ok: true, value: parsed.value, repaired: false };
  }
  const repairUser = buildRepairPrompt(call.prompt.user, first.text, parsed.issue);
  const second = await attempt(generate, { call, user: repairUser }, timeoutMs);
  if (second.kind === 'failure') {
    return { ok: false, failure: second.failure };
  }
  const reparsed = parseStructured(second.text, call.schema);
  return reparsed.ok
    ? { ok: true, value: reparsed.value, repaired: true }
    : { ok: false, failure: 'invalid_output' };
}
