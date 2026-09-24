import type { EvidenceTier } from '@/core/evidence/verifyQuote';

/** Final verdict shown to the user. Only code can produce `needs_review`. */
export type Verdict = 'backed' | 'contradicted' | 'silent' | 'needs_review';

/** Verdicts the model is allowed to propose. */
export type ModelVerdict = Exclude<Verdict, 'needs_review'>;

/** One belief check as proposed by the model, before any verification. */
export interface ModelFinding {
  readonly beliefId: string;
  readonly verdict: ModelVerdict;
  /** Verbatim quote the model claims supports its verdict; `null` for silent findings. */
  readonly quote: string | null;
  /** Terms the model says it searched for; required evidence of effort for `silent`. */
  readonly searchedTerms: readonly string[];
  /** One plain-language sentence on what this means for the user. */
  readonly explanation: string;
}

/** A quote that code has located in the document, with a code-computed page and clause. */
export interface Evidence {
  readonly tier: Exclude<EvidenceTier, 'unverified'>;
  /** The document's own text at the matched span (never the model's paraphrase). */
  readonly text: string;
  readonly start: number;
  readonly end: number;
  readonly page: number;
  readonly clause: string | null;
}

/** Why a finding was downgraded to `needs_review`. */
export type ReviewReason = 'quote_missing' | 'quote_unverified' | 'too_few_search_terms';

/** A finding after the deterministic verdict policy has been applied. */
export interface ResolvedFinding {
  readonly beliefId: string;
  readonly verdict: Verdict;
  readonly evidence: Evidence | null;
  readonly explanation: string;
  readonly searchedTerms: readonly string[];
  readonly reviewReason: ReviewReason | null;
}
