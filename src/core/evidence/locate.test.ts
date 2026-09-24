import { describe, expect, it } from 'vitest';

import { extractKeywords, rankPassages } from '@/core/evidence/locate';

const DOC = [
  '9. The deposit of Rs 60,000 is refundable after deducting painting charges.',
  '10. The lock-in period is eleven months; the notice period is one month.',
  '11. Electricity bills are paid by the tenant.',
].join('\n');

describe('extractKeywords', () => {
  it('drops stopwords and short words, lower-cases the rest', () => {
    expect([...extractKeywords('The Deposit is REFUNDABLE for you')]).toEqual(['deposit', 'refundable']);
  });

  it('returns an empty set for text without words', () => {
    expect(extractKeywords('... ;; !!').size).toBe(0);
  });
});

describe('rankPassages', () => {
  it('ranks the best-overlapping span first', () => {
    const [best] = rankPassages(DOC, 'Is my deposit refundable?', 3);
    expect(best && DOC.slice(best.start, best.end)).toContain('deposit of Rs 60,000');
  });

  it('keeps document order for ties and respects the limit', () => {
    const passages = rankPassages(DOC, 'period', 5);
    expect(passages).toHaveLength(2);
    expect(passages[0]?.start).toBeLessThan(passages[1]?.start ?? 0);
    expect(rankPassages(DOC, 'period', 1)).toHaveLength(1);
  });

  it('returns nothing when no keyword matches', () => {
    expect(rankPassages(DOC, 'stock options', 3)).toEqual([]);
  });
});
