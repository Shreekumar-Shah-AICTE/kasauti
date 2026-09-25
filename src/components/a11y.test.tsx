/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { afterEach, describe, expect, it } from 'vitest';

import { CheckerApp } from '@/components/CheckerApp';
import { ReportStep } from '@/components/ReportStep';
import type { ResolvedFinding } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';

const PAGES = ['Clause 5. The deposit is refundable within forty-five days of vacating.'];

/** One finding of every verdict, so the report renders each badge, note and warning. */
function reportFindings(): ResolvedFinding[] {
  return [
    {
      beliefId: 'a',
      verdict: 'backed',
      evidence: {
        tier: 'exact',
        text: 'The deposit is refundable',
        start: 10,
        end: 35,
        page: 1,
        clause: 'Clause 5',
      },
      explanation: 'Your document says this.',
      searchedTerms: ['deposit'],
      reviewReason: null,
    },
    {
      beliefId: 'b',
      verdict: 'silent',
      evidence: null,
      explanation: 'Your document never addresses this.',
      searchedTerms: ['parking'],
      reviewReason: null,
    },
    {
      beliefId: 'c',
      verdict: 'needs_review',
      evidence: null,
      explanation: 'This could not be settled.',
      searchedTerms: [],
      reviewReason: 'quote_unverified',
    },
  ];
}

function reportDrafts(): BeliefDraft[] {
  return [
    { id: 'a', kind: 'belief', prompt: 'Deposit?', text: 'I get the deposit back' },
    { id: 'b', kind: 'belief', prompt: 'Parking?', text: 'Parking is included' },
    { id: 'c', kind: 'promise', prompt: 'Told?', text: 'The broker said rent will not rise' },
  ];
}

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

  it('has no violations on the report, including the document panel', async () => {
    const { container } = render(
      <ReportStep
        findings={reportFindings()}
        drafts={reportDrafts()}
        offline={false}
        documentName="Rent agreement"
        pages={PAGES}
        onBack={() => undefined}
        onRestart={() => undefined}
      />,
    );
    expect(await violations(container)).toEqual([]);
  });
});
