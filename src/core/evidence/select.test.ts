import { describe, expect, it } from 'vitest';

import { type ModelView, OMISSION_MARKER, selectForModel } from '@/core/evidence/select';
import { splitClauses } from '@/core/text/clauseSplit';
import { excerptPages } from '@/core/text/excerpt';

const CLAUSED = [
  'RENT AGREEMENT between the parties.',
  '1. Rent is Rs 20,000 per month.',
  '2. The deposit is refundable after deducting painting charges.',
  '3. Electricity bills are paid by the tenant.',
].join('\n');

function select(
  text: string,
  budget: number,
  queries: readonly string[] = ['deposit refundable'],
): ModelView {
  return selectForModel({ text, clauses: splitClauses(text), queries, budget });
}

describe('selectForModel', () => {
  it('sends a short document whole', () => {
    expect(select(CLAUSED, CLAUSED.length)).toEqual({ text: CLAUSED, trimmed: false });
  });

  it('keeps the clauses that share keywords with the beliefs first, in document order', () => {
    const view = select(CLAUSED, 70);
    expect(view.trimmed).toBe(true);
    expect(view.text).toContain('2. The deposit is refundable');
    expect(view.text).not.toContain('Electricity');
  });

  it('fills the remaining budget with other clauses and marks only real gaps', () => {
    const view = select(CLAUSED, 76, ['electricity']);
    expect(view.text).toBe(
      `1. Rent is Rs 20,000 per month.\n${OMISSION_MARKER}3. Electricity bills are paid by the tenant.`,
    );
  });

  it('joins neighbouring clauses without a marker', () => {
    const view = select(CLAUSED, CLAUSED.length - 1);
    expect(view.text).not.toContain(OMISSION_MARKER);
    expect(view.text).not.toContain('Electricity');
  });

  it('falls back to lines when the document has no numbered clauses', () => {
    const text = 'Rent is due monthly.\nThe deposit is refundable.\nPets are not allowed.';
    const view = select(text, 30);
    expect(view.text).toBe('The deposit is refundable.');
  });

  it('handles a document that starts with its first clause', () => {
    const text = '1. The deposit is refundable.\n2. Pets are not allowed here at all.';
    expect(select(text, 31).text).toBe('1. The deposit is refundable.\n');
  });
});

describe('excerptPages', () => {
  it('keeps leading pages and cuts the last one to the budget', () => {
    expect(excerptPages(['abcd', 'efgh', 'ijkl'], 6)).toEqual(['abcd', 'ef']);
  });

  it('returns every page when the budget is large enough', () => {
    expect(excerptPages(['ab', 'cd'], 10)).toEqual(['ab', 'cd']);
  });
});
