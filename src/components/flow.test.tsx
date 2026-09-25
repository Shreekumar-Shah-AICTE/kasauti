/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CheckerApp } from '@/components/CheckerApp';
import type { ResolvedFinding } from '@/core/verdict/types';
import { RENT_AGREEMENT } from '@/samples/rentAgreement';

const QUOTE =
  'the licence fee for the unexpired portion of the lock-in period shall become immediately payable';

/** Escapes a belief's own text so it can be matched as an accessible name. */
function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/** The first sample belief comes back backed with a verified quote; the rest come back silent. */
function findings(): ResolvedFinding[] {
  return RENT_AGREEMENT.beliefs.map((belief, index) =>
    index === 0
      ? {
          beliefId: belief.id,
          verdict: 'backed',
          evidence: { tier: 'exact', text: QUOTE, start: 10, end: 20, page: 1, clause: 'Clause 5' },
          explanation: 'Your document says this in so many words.',
          searchedTerms: ['lock-in'],
          reviewReason: null,
        }
      : {
          beliefId: belief.id,
          verdict: 'silent',
          evidence: null,
          explanation: 'Your document never addresses this.',
          searchedTerms: ['deposit', 'refund'],
          reviewReason: null,
        },
  );
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

/** Stands in for the API routes, so the flow is exercised without a server or a model. */
function stubServer(): void {
  vi.stubGlobal('fetch', (input: string): Promise<Response> => {
    if (input === '/api/probes') {
      return Promise.resolve(json({ probes: [], mode: 'live' }));
    }
    return Promise.resolve(json({ findings: findings(), mode: 'live' }));
  });
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('the whole flow', () => {
  it('walks a sample document through to a report with verified evidence', async () => {
    stubServer();
    const user = userEvent.setup();
    render(<CheckerApp />);

    await user.click(screen.getByRole('button', { name: /Rent agreement/ }));
    expect(screen.getByRole('heading', { name: /about to sign/ })).toBeDefined();

    await user.click(screen.getByRole('button', { name: /Next: your beliefs/ }));

    const example = RENT_AGREEMENT.beliefs[0];
    if (example === undefined) {
      throw new Error('missing example');
    }
    await user.click(screen.getByRole('button', { name: new RegExp(escapeForRegExp(example.text)) }));
    await user.click(screen.getByRole('button', { name: /Check against the document/ }));

    expect(screen.getByRole('heading', { name: /What the document actually says/ })).toBeDefined();
    expect(screen.getAllByText(QUOTE)).toHaveLength(2);
    expect(screen.getAllByText(/Page 1/).length).toBeGreaterThan(0);
    expect(screen.getByRole('complementary', { name: /Your document/ })).toBeDefined();
    expect(screen.getByRole('heading', { name: /Ask for this in writing/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Copy report/ })).toBeDefined();
    expect(screen.queryByText(/nothing here was checked/)).toBeNull();
  });

  it('shows a plain-language error when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new Error('offline')));
    const user = userEvent.setup();
    render(<CheckerApp />);

    await user.click(screen.getByRole('button', { name: /Rent agreement/ }));
    await user.click(screen.getByRole('button', { name: /Next: your beliefs/ }));

    expect(screen.getByRole('alert').textContent).toContain('Could not reach the server');
  });
});
