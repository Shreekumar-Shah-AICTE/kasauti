import { VERDICT_POLICY } from '@/core/constants';
import { indexDocument, type IndexedDocument, verifyQuote } from '@/core/evidence/verifyQuote';
import { type Clause, clauseAtOffset, splitClauses } from '@/core/text/clauseSplit';
import { joinPages, pageAtOffset, type PagedDocument } from '@/core/text/pageMap';
import type { Evidence, ModelFinding, ResolvedFinding, ReviewReason } from '@/core/verdict/types';

/** Everything needed to verify many quotes against one document, built once per request. */
export interface EvidenceContext {
  readonly paged: PagedDocument;
  readonly indexed: IndexedDocument;
  readonly clauses: readonly Clause[];
}

/**
 * Joins, indexes and clause-splits a document once so every finding can reuse the work.
 *
 * @param pages - Page texts in reading order.
 * @returns The shared evidence context. Complexity: O(n) in total characters.
 */
export function buildEvidenceContext(pages: readonly string[]): EvidenceContext {
  const paged = joinPages(pages);
  return { paged, indexed: indexDocument(paged.text), clauses: splitClauses(paged.text) };
}

/**
 * Verifies a quote and, if found, attaches the page and clause computed by code.
 *
 * @param context - Output of {@link buildEvidenceContext}.
 * @param quote - Quote proposed by the model.
 * @returns Located evidence, or `null` when the quote cannot be found in the document.
 * Complexity: dominated by `verifyQuote`.
 */
export function locateEvidence(context: EvidenceContext, quote: string): Evidence | null {
  const match = verifyQuote(context.indexed, quote);
  if (match.tier === 'unverified') {
    return null;
  }
  return {
    tier: match.tier,
    text: context.paged.text.slice(match.start, match.end),
    start: match.start,
    end: match.end,
    page: pageAtOffset(context.paged, match.start),
    clause: clauseAtOffset(context.clauses, match.start),
  };
}

function toReview(finding: ModelFinding, reason: ReviewReason): ResolvedFinding {
  return {
    beliefId: finding.beliefId,
    verdict: 'needs_review',
    evidence: null,
    explanation: finding.explanation,
    searchedTerms: finding.searchedTerms,
    reviewReason: reason,
  };
}

function countDistinctTerms(terms: readonly string[]): number {
  const cleaned = terms.map((term) => term.trim().toLowerCase()).filter((term) => term.length > 0);
  return new Set(cleaned).size;
}

function resolveSilent(finding: ModelFinding): ResolvedFinding {
  if (countDistinctTerms(finding.searchedTerms) < VERDICT_POLICY.minSilentSearchTerms) {
    return toReview(finding, 'too_few_search_terms');
  }
  return { ...toReview(finding, 'too_few_search_terms'), verdict: 'silent', reviewReason: null };
}

/**
 * Applies the trust policy to one model finding. The model proposes; this function decides:
 * - `backed` / `contradicted` without a verifiable quote → `needs_review`
 * - `silent` with fewer than the required distinct search terms → `needs_review`
 * - verified evidence always carries a code-computed page and clause
 *
 * @param context - Output of {@link buildEvidenceContext}.
 * @param finding - The model's proposal.
 * @returns The resolved finding. Complexity: dominated by `verifyQuote`.
 */
export function resolveFinding(context: EvidenceContext, finding: ModelFinding): ResolvedFinding {
  if (finding.verdict === 'silent') {
    return resolveSilent(finding);
  }
  if (finding.quote === null || finding.quote.trim().length === 0) {
    return toReview(finding, 'quote_missing');
  }
  const evidence = locateEvidence(context, finding.quote);
  if (evidence === null) {
    return toReview(finding, 'quote_unverified');
  }
  return { ...toReview(finding, 'quote_unverified'), verdict: finding.verdict, evidence, reviewReason: null };
}
