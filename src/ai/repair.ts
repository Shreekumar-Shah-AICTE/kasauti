import { z } from 'zod';

import { AI } from '@/core/constants';

/** Outcome of parsing a model reply against its schema. */
export type ParseResult<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly issue: string };

const FENCE = '```';

/** Removes a Markdown code fence some models wrap around JSON. Linear, no regex. */
function stripFences(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith(FENCE)) {
    return trimmed;
  }
  const firstBreak = trimmed.indexOf('\n');
  const body = firstBreak < 0 ? '' : trimmed.slice(firstBreak + 1);
  return body.endsWith(FENCE) ? body.slice(0, -FENCE.length).trim() : body.trim();
}

function parseJson(text: string): { readonly ok: true; readonly data: unknown } | { readonly ok: false } {
  try {
    const data: unknown = JSON.parse(stripFences(text));
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

/**
 * Parses and validates a model reply. Never throws.
 *
 * @param text - Raw model output.
 * @param schema - The zod schema the reply must satisfy.
 * @returns The typed value, or a short human-readable issue for the repair prompt.
 * Complexity: O(n) in the reply length.
 */
export function parseStructured<T>(text: string, schema: z.ZodType<T>): ParseResult<T> {
  const json = parseJson(text);
  if (!json.ok) {
    return { ok: false, issue: 'The reply was not valid JSON.' };
  }
  const parsed = schema.safeParse(json.data);
  if (parsed.success) {
    return { ok: true, value: parsed.data };
  }
  return { ok: false, issue: z.prettifyError(parsed.error).slice(0, AI.maxIssueChars) };
}

/**
 * Builds the one-shot repair turn: the original request, the invalid reply and what was wrong.
 *
 * @returns The repair user message. Complexity: O(n).
 */
export function buildRepairPrompt(originalUser: string, previousReply: string, issue: string): string {
  return [
    originalUser,
    '<previous_reply>',
    previousReply.slice(0, AI.maxEchoChars),
    '</previous_reply>',
    `Your previous reply did not match the required JSON schema: ${issue}`,
    'Reply again with only valid JSON that matches the schema.',
  ].join('\n');
}
