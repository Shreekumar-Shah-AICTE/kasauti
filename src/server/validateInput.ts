import { z } from 'zod';

import { AI, LIMITS, SERVER } from '@/core/constants';
import { ROLES } from '@/core/probes/fallbackBank';
import { ApiError } from '@/server/errors';

const LETTER = /\p{L}/gu;

function countLetters(text: string): number {
  return text.match(LETTER)?.length ?? 0;
}

function totalChars(pages: readonly string[]): number {
  return pages.reduce((sum, page) => sum + page.length, 0);
}

function hasMeaningfulText(text: string): boolean {
  return countLetters(text) >= SERVER.minMeaningfulLetters;
}

const PagesSchema = z
  .array(z.string())
  .min(1)
  .max(LIMITS.maxPages)
  .refine((pages) => totalChars(pages) <= LIMITS.maxDocumentChars, { message: 'document_too_long' })
  .refine((pages) => pages.some(hasMeaningfulText), { message: 'document_empty' });

const BeliefSchema = z.strictObject({
  id: z.string().min(1).max(AI.maxIdChars),
  kind: z.enum(['belief', 'promise']),
  text: z.string().trim().max(SERVER.maxBeliefChars).refine(hasMeaningfulText, { message: 'belief_empty' }),
});

const BeliefsSchema = z
  .array(BeliefSchema)
  .min(1)
  .max(LIMITS.maxBeliefs)
  .refine((beliefs) => new Set(beliefs.map((belief) => belief.id)).size === beliefs.length, {
    message: 'duplicate_ids',
  });

/** Body of `POST /api/probes`. Roles are an allowlist; pages are page-tagged plain text. */
export const ProbeRequestSchema = z.strictObject({ role: z.enum(ROLES), pages: PagesSchema });

/** Body of `POST /api/check`: the document plus up to {@link LIMITS.maxBeliefs} beliefs. */
export const CheckRequestSchema = z.strictObject({ pages: PagesSchema, beliefs: BeliefsSchema });

export type ProbeRequest = z.infer<typeof ProbeRequestSchema>;
export type CheckRequest = z.infer<typeof CheckRequestSchema>;

function fieldPaths(error: z.ZodError): string[] {
  const paths = error.issues.map((issue) =>
    issue.path.length === 0 ? 'body' : issue.path.map(String).join('.'),
  );
  return [...new Set(paths)];
}

/**
 * Validates an untrusted request body against a schema.
 *
 * @param schema - The endpoint's request schema.
 * @param raw - Parsed JSON from the client.
 * @returns The typed, validated input.
 * @throws {ApiError} `invalid_input` listing only the failing field paths (never their values).
 * Complexity: O(n) in the body size.
 */
export function parseRequest<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError('invalid_input', fieldPaths(result.error));
  }
  return result.data;
}
