import { describe, expect, it } from 'vitest';

import { clauseAtOffset, splitClauses } from '@/core/text/clauseSplit';
import { normalizeForMatch } from '@/core/text/normalize';
import { joinPages, pageAtOffset } from '@/core/text/pageMap';

describe('normalizeForMatch', () => {
  it.each([
    ['  Hello,   WORLD!  ', 'hello world'],
    ['one month\u2019s rent', 'one month s rent'],
    ['\u20B9 22,000', 'rs 22 000'],
    ['Line\nbreak\tand\u2014dash', 'line break and dash'],
    ['', ''],
    ['...', ''],
    ['\u0130stanbul', 'i\u0307stanbul'],
  ])('normalises %j to %j', (input, expected) => {
    expect(normalizeForMatch(input).text).toBe(expected);
  });

  it('keeps one original offset per normalised character', () => {
    const input = 'Ab,  cD';
    const result = normalizeForMatch(input);
    expect(result.offsets).toHaveLength(result.text.length);
    expect(result.offsets).toEqual([0, 1, 5, 5, 6]);
  });
});

describe('joinPages / pageAtOffset', () => {
  const doc = joinPages(['page one', 'page two', 'three']);

  it('joins pages with a separator and records starts', () => {
    expect(doc.text).toBe('page one\n\npage two\n\nthree');
    expect(doc.pageStarts).toEqual([0, 10, 20]);
  });

  it.each([
    [0, 1],
    [7, 1],
    [10, 2],
    [19, 2],
    [20, 3],
    [999, 3],
    [-5, 1],
  ])('offset %i is on page %i', (offset, page) => {
    expect(pageAtOffset(doc, offset)).toBe(page);
  });

  it('treats an empty document as page 1', () => {
    expect(pageAtOffset(joinPages([]), 0)).toBe(1);
  });
});

describe('splitClauses / clauseAtOffset', () => {
  const text = [
    'RENT AGREEMENT',
    '1. Rent is Rs 20,000.',
    'Clause 9: Deposit. One month is deducted.',
    '  4.2) Sub clause.',
    'Section 12 - Notice.',
    'In 2026 the parties agree.',
  ].join('\n');
  const clauses = splitClauses(text);

  it('finds numbered headings in several styles', () => {
    expect(clauses.map((clause) => clause.label)).toEqual([
      'Clause 1',
      'Clause 9',
      'Clause 4.2',
      'Clause 12',
    ]);
  });

  it('makes each clause end where the next begins', () => {
    expect(clauses[0]?.end).toBe(clauses[1]?.start);
    expect(clauses.at(-1)?.end).toBe(text.length);
  });

  it('locates the clause containing an offset', () => {
    expect(clauseAtOffset(clauses, text.indexOf('deducted'))).toBe('Clause 9');
    expect(clauseAtOffset(clauses, 0)).toBeNull();
  });

  it('returns no clauses for unnumbered text', () => {
    expect(splitClauses('Just prose with 12 numbers inside.')).toEqual([]);
  });
});
