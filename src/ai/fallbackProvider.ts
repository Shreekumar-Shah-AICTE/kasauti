import { LOCATE } from '@/core/constants';
import { extractKeywords, type Passage, rankPassages } from '@/core/evidence/locate';
import { clauseAtOffset } from '@/core/text/clauseSplit';
import { pageAtOffset } from '@/core/text/pageMap';
import type { EvidenceContext } from '@/core/verdict/policy';
import type { BeliefInput, Evidence, ResolvedFinding } from '@/core/verdict/types';

const FOUND =
  'Offline check: this is the passage most likely to cover what you wrote. Read it and decide for yourself.';
const NOT_FOUND =
  'Offline check: no passage used your words. Read the document, or try again when AI is available.';

function toEvidence(context: EvidenceContext, passage: Passage): Evidence {
  const raw = context.paged.text.slice(passage.start, passage.end);
  const start = passage.start + (raw.length - raw.trimStart().length);
  const text = raw.trim();
  return {
    tier: 'exact',
    text,
    start,
    end: start + text.length,
    page: pageAtOffset(context.paged, start),
    clause: clauseAtOffset(context.clauses, start),
  };
}

/**
 * Deterministic stand-in for the model on one belief: points to the most relevant passage
 * and marks the finding `needs_review` so it is never mistaken for a real verdict.
 *
 * @param context - Output of `buildEvidenceContext`.
 * @param belief - The belief to locate.
 * @returns An honest offline finding. Complexity: O(n + s log s).
 */
export function offlineFinding(context: EvidenceContext, belief: BeliefInput): ResolvedFinding {
  const [best] = rankPassages(context.paged.text, belief.text, LOCATE.offlinePassages);
  return {
    beliefId: belief.id,
    verdict: 'needs_review',
    evidence: best === undefined ? null : toEvidence(context, best),
    explanation: best === undefined ? NOT_FOUND : FOUND,
    searchedTerms: [...extractKeywords(belief.text)],
    reviewReason: 'offline_mode',
  };
}

/**
 * Offline findings for every belief.
 *
 * @returns One finding per belief, in input order. Complexity: O(b · n).
 */
export function offlineFindings(
  context: EvidenceContext,
  beliefs: readonly BeliefInput[],
): ResolvedFinding[] {
  return beliefs.map((belief) => offlineFinding(context, belief));
}
