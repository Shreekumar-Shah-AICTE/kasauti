import { describe, expect, it } from 'vitest';

import { UI } from '@/core/constants';
import type { Evidence } from '@/core/verdict/types';
import { cx } from '@/lib/cx';
import { documentStats, pageView } from '@/lib/documentView';

const PAGES = [
  'Clause 8. One month rent is deducted towards painting.',
  'Clause 9. Minor repairs are yours.',
];

function evidence(override: Partial<Evidence> = {}): Evidence {
  return {
    tier: 'exact',
    text: 'Minor repairs are yours.',
    start: 0,
    end: 0,
    page: 2,
    clause: 'Clause 9',
    ...override,
  };
}

describe('cx', () => {
  it('keeps real class names and drops everything else', () => {
    expect(cx('card', false, null, undefined, '', 'selected')).toBe('card selected');
  });
});

describe('documentStats', () => {
  it('counts pages and words', () => {
    expect(documentStats(PAGES)).toEqual({ pages: 2, words: 15 });
  });

  it('reports no words for an empty document', () => {
    expect(documentStats([''])).toEqual({ pages: 1, words: 0 });
  });
});

describe('pageView', () => {
  it('uses the computed offset, so a repeated phrase is marked in the right place', () => {
    const pages = ['Rent is payable. Rent is payable.'];
    const second = 17;
    const view = pageView(pages, evidence({ text: 'Rent is payable.', page: 1, start: second }));
    expect(view).toMatchObject({ page: 1, totalPages: 1, before: 'Rent is payable. ', after: '' });
  });

  it('falls back to searching the page when the offset does not line up', () => {
    const view = pageView(PAGES, evidence({ start: 0 }));
    expect(view?.match).toBe('Minor repairs are yours.');
    expect(view?.before).toBe('Clause 9. ');
  });

  it('shows the whole page with no highlight when the quote is not on it', () => {
    const view = pageView(PAGES, evidence({ text: 'never written anywhere' }));
    expect(view?.match).toBe('');
    expect(view?.before).toBe(PAGES[1]);
    expect(view?.clippedStart).toBe(false);
  });

  it('treats an empty quote as unplaceable', () => {
    expect(pageView(PAGES, evidence({ text: '' }))?.match).toBe('');
  });

  it('clips long pages on both sides of the quote', () => {
    const filler = 'x '.repeat(UI.contextChars);
    const long = `${filler}TARGET${filler}`;
    const view = pageView([long], evidence({ text: 'TARGET', page: 1, start: filler.length }));
    expect(view?.clippedStart).toBe(true);
    expect(view?.clippedEnd).toBe(true);
    expect(view?.before.length).toBe(UI.contextChars);
  });

  it('returns null when the page does not exist', () => {
    expect(pageView(PAGES, evidence({ page: 9 }))).toBeNull();
  });
});
