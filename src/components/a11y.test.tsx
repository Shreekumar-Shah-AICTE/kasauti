/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { CheckerApp } from '@/components/CheckerApp';

/**
 * Runs axe-core against the rendered DOM and returns the rule ids that failed.
 * Colour contrast is excluded only because jsdom cannot compute layout or colours;
 * the palette is contrast-checked by hand (see README accessibility notes).
 */
async function violations(container: HTMLElement): Promise<string[]> {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false } },
  });
  return result.violations.map((violation) => violation.id);
}

afterEach(() => {
  cleanup();
});

describe('accessibility (axe-core)', () => {
  it('has no violations on the first screen', async () => {
    const { container } = render(<CheckerApp />);
    expect(await violations(container)).toEqual([]);
  });

  it('has no violations after a sample document is chosen', async () => {
    const user = userEvent.setup();
    const { container } = render(<CheckerApp />);
    const [sample] = screen.getAllByRole('button', { name: /rent agreement/i });
    if (sample === undefined) {
      throw new Error('rent agreement sample button not rendered');
    }
    await user.click(sample);
    expect(await violations(container)).toEqual([]);
  });
});
