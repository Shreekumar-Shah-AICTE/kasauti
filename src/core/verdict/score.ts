import type { Verdict } from '@/core/verdict/types';

/** Number of findings per verdict. */
export type VerdictTally = Readonly<Record<Verdict, number>>;

/** "You were right on `correct` of `assessed` beliefs." Needs-review findings are excluded. */
export interface UnderstandingScore {
  readonly correct: number;
  readonly assessed: number;
}

/**
 * Counts findings per verdict.
 *
 * @param findings - Any list of objects with a verdict.
 * @returns A tally with every verdict present (zero when absent). Complexity: O(f).
 */
export function tallyVerdicts(findings: readonly { readonly verdict: Verdict }[]): VerdictTally {
  const tally: Record<Verdict, number> = { backed: 0, contradicted: 0, silent: 0, needs_review: 0 };
  for (const finding of findings) {
    tally[finding.verdict] += 1;
  }
  return tally;
}

/**
 * Computes the understanding score. A belief counts as understood only when the document
 * backs it; contradicted and silent beliefs are the gaps worth acting on. Findings code could
 * not verify are left out rather than guessed.
 *
 * @param tally - Output of {@link tallyVerdicts}.
 * @returns Correct and assessed counts. Complexity: O(1).
 */
export function understandingScore(tally: VerdictTally): UnderstandingScore {
  return { correct: tally.backed, assessed: tally.backed + tally.contradicted + tally.silent };
}
