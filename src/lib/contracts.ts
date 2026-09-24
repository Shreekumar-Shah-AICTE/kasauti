import { z } from 'zod';

/**
 * Schemas for what the API returns. The browser re-validates every response instead of
 * trusting its shape, so a bad deploy surfaces as a clear error rather than a blank screen
 * or an unsafe cast.
 */

const ModeSchema = z.enum(['live', 'offline']);

const ProbeSchema = z.object({
  id: z.string(),
  topic: z.string(),
  question: z.string(),
});

const EvidenceSchema = z.object({
  tier: z.enum(['exact', 'normalized', 'fuzzy']),
  text: z.string(),
  start: z.number(),
  end: z.number(),
  page: z.number(),
  clause: z.string().nullable(),
});

const FindingSchema = z.object({
  beliefId: z.string(),
  verdict: z.enum(['backed', 'contradicted', 'silent', 'needs_review']),
  evidence: EvidenceSchema.nullable(),
  explanation: z.string(),
  searchedTerms: z.array(z.string()),
  reviewReason: z
    .enum(['quote_missing', 'quote_unverified', 'too_few_search_terms', 'offline_mode'])
    .nullable(),
});

/** Response of `POST /api/probes`. */
export const ProbeOutcomeSchema = z.object({ mode: ModeSchema, probes: z.array(ProbeSchema) });

/** Response of `POST /api/check`. */
export const CheckOutcomeSchema = z.object({ mode: ModeSchema, findings: z.array(FindingSchema) });

/** Error envelope produced by `src/server/errors.ts`. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.array(z.string()),
  }),
});

/** Whether results came from the model or the deterministic fallback. */
export type Mode = z.infer<typeof ModeSchema>;

export type ProbeOutcomeResponse = z.infer<typeof ProbeOutcomeSchema>;
export type CheckOutcomeResponse = z.infer<typeof CheckOutcomeSchema>;
