import { describe, expect, it } from 'vitest';

import { itemsToText } from '@/lib/pdf/layout';

function item(str: string, y: number, height = 10): unknown {
  return { str, transform: [1, 0, 0, 1, 0, y], height };
}

describe('itemsToText', () => {
  it('joins wrapped lines of one paragraph with a space', () => {
    expect(itemsToText([item('The deposit shall', 700), item('be refunded.', 688)])).toBe(
      'The deposit shall be refunded.',
    );
  });

  it('keeps a blank line where the vertical gap marks a new paragraph', () => {
    const text = itemsToText([item('7. Refund.', 700), item('8. Deductions.', 660)]);
    expect(text).toBe('7. Refund.\n\n8. Deductions.');
  });

  it('ignores whitespace-only fragments and items that are not text', () => {
    expect(itemsToText([item('One', 700), item('  ', 400), null, 42, item('two', 700)])).toBe('One two');
  });

  it('treats a missing transform or height as no layout information', () => {
    expect(
      itemsToText([
        { str: 'A', transform: 'bad' },
        { str: 'B', height: 0 },
      ]),
    ).toBe('A B');
  });

  it('collapses runs of spaces inside fragments', () => {
    expect(itemsToText([item('Rs.   24,000', 700)])).toBe('Rs. 24,000');
  });
});
