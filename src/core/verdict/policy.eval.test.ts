import { describe, expect, it } from 'vitest';

import { buildEvidenceContext, resolveFinding } from '@/core/verdict/policy';
import type { ModelFinding, ResolvedFinding, ReviewReason, Verdict } from '@/core/verdict/types';

/**
 * Evaluation table for the project's central claim: the model proposes, code decides.
 *
 * Each case is a model reply a real Gemini call could plausibly produce — including dishonest
 * ones — paired with the verdict the user must end up seeing. If a future prompt change makes
 * the model more confident, these cases still hold the line.
 */
const PAGES = [
  '5. Rent. The rent is payable on the first day of each month.\n' +
    '9. Security deposit. One month rent shall be deducted towards painting on vacating.',
  '14. Notice. Either party may end this agreement with two months written notice.',
];

interface EvalCase {
  readonly name: string;
  readonly reply: ModelFinding;
  readonly verdict: Verdict;
  readonly reviewReason: ReviewReason | null;
  readonly hasEvidence: boolean;
}

const CASES: readonly EvalCase[] = [
  {
    name: 'honest contradiction with a word-for-word quote is trusted',
    reply: {
      beliefId: 'deposit',
      verdict: 'contradicted',
      quote: 'One month rent shall be deducted towards painting on vacating.',
      searchedTerms: ['deposit', 'painting'],
      explanation: 'Your document allows a painting deduction.',
    },
    verdict: 'contradicted',
    reviewReason: null,
    hasEvidence: true,
  },
  {
    name: 'quote with different spacing and casing still verifies',
    reply: {
      beliefId: 'notice',
      verdict: 'backed',
      quote: 'either party may END this   agreement with two months written notice',
      searchedTerms: ['notice'],
      explanation: 'Two months notice is written into your document.',
    },
    verdict: 'backed',
    reviewReason: null,
    hasEvidence: true,
  },
  {
    name: 'invented quote is rejected, however confident the explanation sounds',
    reply: {
      beliefId: 'deposit',
      verdict: 'backed',
      quote: 'The security deposit shall be refunded in full within seven days.',
      searchedTerms: ['deposit', 'refund'],
      explanation: 'Your deposit is fully refundable.',
    },
    verdict: 'needs_review',
    reviewReason: 'quote_unverified',
    hasEvidence: false,
  },
  {
    name: 'a verdict with no quote at all is rejected',
    reply: {
      beliefId: 'parking',
      verdict: 'backed',
      quote: null,
      searchedTerms: ['parking'],
      explanation: 'Parking is included.',
    },
    verdict: 'needs_review',
    reviewReason: 'quote_missing',
    hasEvidence: false,
  },
  {
    name: 'a blank quote counts as no quote',
    reply: {
      beliefId: 'parking',
      verdict: 'contradicted',
      quote: '   ',
      searchedTerms: ['parking'],
      explanation: 'Parking is excluded.',
    },
    verdict: 'needs_review',
    reviewReason: 'quote_missing',
    hasEvidence: false,
  },
  {
    name: 'silence claimed after real searching is accepted',
    reply: {
      beliefId: 'parking',
      verdict: 'silent',
      quote: null,
      searchedTerms: ['parking', 'vehicle', 'garage'],
      explanation: 'Your document never mentions parking.',
    },
    verdict: 'silent',
    reviewReason: null,
    hasEvidence: false,
  },
  {
    name: 'lazy silence with one search term is downgraded',
    reply: {
      beliefId: 'parking',
      verdict: 'silent',
      quote: null,
      searchedTerms: ['parking'],
      explanation: 'Your document never mentions parking.',
    },
    verdict: 'needs_review',
    reviewReason: 'too_few_search_terms',
    hasEvidence: false,
  },
  {
    name: 'repeating one term in different cases does not count as searching twice',
    reply: {
      beliefId: 'parking',
      verdict: 'silent',
      quote: null,
      searchedTerms: ['Parking', 'parking ', ' PARKING'],
      explanation: 'Your document never mentions parking.',
    },
    verdict: 'needs_review',
    reviewReason: 'too_few_search_terms',
    hasEvidence: false,
  },
];

describe('verdict policy evaluation', () => {
  const context = buildEvidenceContext(PAGES);
  const resolve = (reply: ModelFinding): ResolvedFinding => resolveFinding(context, reply);

  it.each(CASES)('$name', (testCase) => {
    const resolved = resolve(testCase.reply);
    expect(resolved.verdict).toBe(testCase.verdict);
    expect(resolved.reviewReason).toBe(testCase.reviewReason);
    expect(resolved.evidence !== null).toBe(testCase.hasEvidence);
  });

  it('never invents evidence text: quotes are sliced from the document itself', () => {
    const resolved = resolve({
      beliefId: 'notice',
      verdict: 'backed',
      quote: 'either party may END this   agreement with two months written notice',
      searchedTerms: ['notice'],
      explanation: 'Two months notice is written into your document.',
    });
    expect(resolved.evidence?.text).toBe(
      'Either party may end this agreement with two months written notice',
    );
  });

  it('attaches a page and clause computed by code, not by the model', () => {
    const resolved = resolve({
      beliefId: 'notice',
      verdict: 'backed',
      quote: 'two months written notice',
      searchedTerms: ['notice'],
      explanation: 'Two months notice is written into your document.',
    });
    expect(resolved.evidence?.page).toBe(2);
    expect(resolved.evidence?.clause).toBe('Clause 14');
  });
});
