import { describe, expect, it } from 'vitest';

import { findFuzzyWindow, tokenizeWords, wordSimilarity } from '@/core/evidence/fuzzy';
import { indexDocument, verifyQuote } from '@/core/evidence/verifyQuote';

const DOC = [
  '9. Security Deposit. The Tenant shall pay a deposit of Rs 60,000.',
  'At the end of the tenancy one month\u2019s rent shall be deducted towards painting and cleaning charges.',
  '10. Lock-in. Neither party may terminate within the first eleven months.',
].join('\n');
const indexed = indexDocument(DOC);

describe('verifyQuote tiers', () => {
  it.each([
    ['exact', 'shall pay a deposit of Rs 60,000', 'exact'],
    ['exact with edge ellipsis', '\u2026shall pay a deposit of Rs 60,000...', 'exact'],
    ['normalized: case + curly quote', "ONE MONTH'S RENT shall be deducted", 'normalized'],
    ['normalized: whitespace', 'terminate   within\nthe first eleven months', 'normalized'],
    [
      'fuzzy: one word changed',
      'one month s rent shall be deducted towards painting and cleaning costs',
      'fuzzy',
    ],
    ['unverified: invented text', 'maintenance charges are included in the rent', 'unverified'],
    ['unverified: empty', '   ', 'unverified'],
    ['unverified: too long', 'x'.repeat(601), 'unverified'],
    ['unverified: short fuzzy', 'deposit refundable', 'unverified'],
  ])('%s', (_name, quote, tier) => {
    expect(verifyQuote(indexed, quote).tier).toBe(tier);
  });

  it('returns original-text spans for exact matches', () => {
    const quote = 'shall pay a deposit';
    const match = verifyQuote(indexed, quote);
    expect(match).toMatchObject({ start: DOC.indexOf(quote), end: DOC.indexOf(quote) + quote.length });
  });

  it('maps normalized matches back to the original text', () => {
    const match = verifyQuote(indexed, 'FIRST ELEVEN MONTHS');
    expect(match.tier).toBe('normalized');
    if (match.tier !== 'unverified') {
      expect(DOC.slice(match.start, match.end)).toBe('first eleven months');
    }
  });

  it('maps fuzzy matches back to the original text with a similarity score', () => {
    const match = verifyQuote(indexed, 'month s rent shall be deducted towards painting and cleaning costs');
    expect(match.tier).toBe('fuzzy');
    if (match.tier !== 'unverified') {
      expect(DOC.slice(match.start, match.end)).toMatch(/^month.s rent shall be deducted/);
      expect(match.similarity).toBeGreaterThanOrEqual(0.9);
    }
  });
});

describe('fuzzy helpers', () => {
  it('tokenizes with spans', () => {
    expect(tokenizeWords('ab cd')).toEqual([
      { text: 'ab', start: 0, end: 2 },
      { text: 'cd', start: 3, end: 5 },
    ]);
  });

  it.each([
    [[], [], 1],
    [['a', 'b'], ['a', 'b'], 1],
    [['a', 'b'], ['a', 'c'], 0.5],
    [['a'], [], 0],
  ])('wordSimilarity(%j, %j) = %d', (a, b, expected) => {
    expect(wordSimilarity(a, b)).toBeCloseTo(expected);
  });

  it('returns null when the document is shorter than the quote', () => {
    expect(findFuzzyWindow(tokenizeWords('a b'), ['a', 'b', 'c'])).toBeNull();
  });

  it('prefers the most similar window', () => {
    const words = tokenizeWords('x a b c d e f g h i j y a b c d e f g h i z');
    const hit = findFuzzyWindow(words, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'z']);
    expect(hit?.firstWord).toBe(12);
    expect(hit?.similarity).toBe(1);
  });

  it('keeps an earlier perfect window over a later weaker one', () => {
    const words = tokenizeWords('x a b c d e f g h i z y a b c d e f g h i j');
    const hit = findFuzzyWindow(words, ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'z']);
    expect(hit?.firstWord).toBe(1);
    expect(hit?.similarity).toBe(1);
  });

  it('handles repeated quote words', () => {
    const words = tokenizeWords('the rent the rent the deposit the rent the rent the');
    const hit = findFuzzyWindow(words, [
      'the',
      'rent',
      'the',
      'rent',
      'the',
      'rent',
      'the',
      'rent',
      'the',
      'rent',
    ]);
    expect(hit).not.toBeNull();
  });
});
