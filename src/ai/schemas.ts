import { z } from 'zod';

import { AI, LIMITS } from '@/core/constants';

/** One probe question as returned by the model. */
export const ProbeSchema = z.object({
  id: z.string().min(1).max(AI.maxIdChars),
  topic: z.string().min(1).max(AI.maxTopicChars),
  question: z.string().min(1).max(AI.maxQuestionChars),
});

/** Model reply for the probe step. */
export const ProbeResponseSchema = z.object({
  probes: z.array(ProbeSchema).min(1).max(AI.maxProbes),
});

/** One belief check proposed by the model. `needs_review` is deliberately not allowed here. */
export const FindingSchema = z.object({
  beliefId: z.string().min(1).max(AI.maxIdChars),
  verdict: z.enum(['backed', 'contradicted', 'silent']),
  quote: z.string().max(LIMITS.maxQuoteChars).nullable(),
  searchedTerms: z.array(z.string().max(AI.maxTermChars)).max(AI.maxSearchTerms),
  explanation: z.string().min(1).max(AI.maxExplanationChars),
});

/** Model reply for the batched check step. */
export const CheckResponseSchema = z.object({
  findings: z.array(FindingSchema).max(LIMITS.maxBeliefs),
});

export type ProbeResponse = z.infer<typeof ProbeResponseSchema>;
export type CheckResponse = z.infer<typeof CheckResponseSchema>;

/**
 * Converts a zod schema to the JSON Schema sent as the model's structured-output contract.
 * The same zod schema later validates the reply, so contract and validation cannot drift.
 *
 * @returns A JSON Schema object without the `$schema` meta key. Complexity: O(schema size).
 */
export function toModelSchema(schema: z.ZodType): Record<string, unknown> {
  return Object.fromEntries(Object.entries(z.toJSONSchema(schema)).filter(([key]) => key !== '$schema'));
}

/** Precomputed structured-output contracts. */
export const PROBE_JSON_SCHEMA = toModelSchema(ProbeResponseSchema);
export const CHECK_JSON_SCHEMA = toModelSchema(CheckResponseSchema);
