import { describe, expect, it } from 'vitest';

import { countOf, valueAt } from '@/core/collections';

describe('valueAt', () => {
  it('returns in-range elements, including falsy ones', () => {
    expect(valueAt([0, 5], 0)).toBe(0);
    expect(valueAt('ab', 1)).toBe('b');
  });

  it.each([-1, 2, 99])('throws RangeError for out-of-range index %i', (index) => {
    expect(() => valueAt([1, 2], index)).toThrow(RangeError);
  });
});

describe('countOf', () => {
  it('reads stored counts and defaults missing keys to zero', () => {
    const counts = new Map([['rent', 2]]);
    expect(countOf(counts, 'rent')).toBe(2);
    expect(countOf(counts, 'deposit')).toBe(0);
  });
});
