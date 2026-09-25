import { describe, expect, it } from 'vitest';

import type { Evidence, ResolvedFinding, Verdict } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';
import { buildReport, exportText, writingRequest } from '@/lib/report';

function evidence(clause: string | null): Evidence {
  return { tier: 'exact', text: 'One month rent is deducted.', start: 0, end: 27, page: 2, clause };
}

function finding(
  beliefId: string,
  verdict: Verdict,
  override: Partial<ResolvedFinding> = {},
): ResolvedFinding {
  return {
    beliefId,
    verdict,
    evidence: null,
    explanation: `Explanation for ${beliefId}.`,
    searchedTerms: ['deposit', 'painting'],
    reviewReason: null,
    ...override,
  };
}

function draft(id: string, text: string, kind: 'belief' | 'promise' = 'belief'): BeliefDraft {
  return { id, kind, prompt: 'Prompt', text };
}

describe('buildReport', () => {
  it('pairs findings with the answers the user wrote', () => {
    const report = buildReport([finding('a', 'backed')], [draft('a', '  Deposit is refundable  ')]);
    expect(report.rows[0]?.belief).toBe('Deposit is refundable');
    expect(report.rows[0]?.kind).toBe('belief');
  });

  it('falls back to the belief id when the answer is missing', () => {
    const report = buildReport([finding('ghost', 'backed')], []);
    expect(report.rows[0]?.belief).toBe('ghost');
    expect(report.rows[0]?.kind).toBe('belief');
  });

  it('scores only the beliefs the document could answer', () => {
    const report = buildReport(
      [
        finding('a', 'backed'),
        finding('b', 'contradicted'),
        finding('c', 'silent'),
        finding('d', 'needs_review'),
      ],
      [],
    );
    expect(report.tally).toEqual({ backed: 1, contradicted: 1, silent: 1, needs_review: 1 });
    expect(report.score).toEqual({ correct: 1, assessed: 3 });
  });

  it('collects spoken promises and silent beliefs into the get-it-in-writing list', () => {
    const report = buildReport(
      [finding('a', 'backed'), finding('b', 'silent'), finding('c', 'backed')],
      [
        draft('a', 'Deposit refundable'),
        draft('b', 'Parking included'),
        draft('c', 'Rent frozen', 'promise'),
      ],
    );
    expect(report.writingList).toEqual([
      { id: 'b', text: 'Parking included', reason: 'silent' },
      { id: 'c', text: 'Rent frozen', reason: 'promise' },
    ]);
  });

  it('names the clause in a contradiction question when evidence has one', () => {
    const withClause = buildReport(
      [finding('a', 'contradicted', { evidence: evidence('Clause 8') })],
      [draft('a', 'Deposit is refundable')],
    );
    expect(withClause.questions[0]).toContain('Clause 8');
  });

  it.each([
    ['no evidence', null],
    ['evidence without a clause number', evidence(null)],
  ])('falls back to a generic clause reference with %s', (_name, value) => {
    const report = buildReport(
      [finding('a', 'contradicted', { evidence: value })],
      [draft('a', 'Deposit is refundable')],
    );
    expect(report.questions[0]).toContain('that clause');
  });

  it('asks about findings it could not verify, and skips settled ones', () => {
    const report = buildReport(
      [finding('a', 'needs_review'), finding('b', 'backed'), finding('c', 'silent')],
      [draft('a', 'Notice is one month')],
    );
    expect(report.questions).toHaveLength(1);
    expect(report.questions[0]).toContain('could not confirm');
  });

  it('caps the lawyer questions at five', () => {
    const many = Array.from({ length: 8 }, (_value, index) => finding(`f${String(index)}`, 'contradicted'));
    expect(buildReport(many, []).questions).toHaveLength(5);
  });
});

describe('row order', () => {
  it('puts contradictions first and confirmations last', () => {
    const report = buildReport(
      [
        finding('a', 'backed'),
        finding('b', 'silent'),
        finding('c', 'contradicted'),
        finding('d', 'needs_review'),
      ],
      [],
    );
    expect(report.rows.map((row) => row.finding.verdict)).toEqual([
      'contradicted',
      'needs_review',
      'silent',
      'backed',
    ]);
  });
});

describe('writingRequest', () => {
  it('is empty when there is nothing to ask for', () => {
    expect(writingRequest([])).toBe('');
  });

  it('numbers every item inside a message the user can send as it is', () => {
    const text = writingRequest([
      { id: 'a', text: 'Parking is included', reason: 'silent' },
      { id: 'b', text: 'Deposit comes back in full', reason: 'promise' },
    ]);
    expect(text).toContain('1. Parking is included');
    expect(text).toContain('2. Deposit comes back in full');
    expect(text).toContain('in writing');
  });
});

describe('exportText', () => {
  it('renders verdicts, quotes, the writing list and the questions', () => {
    const report = buildReport(
      [finding('a', 'contradicted', { evidence: evidence('Clause 8') }), finding('b', 'silent')],
      [draft('a', 'Deposit is refundable'), draft('b', 'Parking included')],
    );
    const text = exportText(report);
    expect(text).toContain('You were right on 0 of 2 beliefs');
    expect(text).toContain('Contradicted by the document: Deposit is refundable');
    expect(text).toContain('Page 2:');
    expect(text).toContain('Get this in writing:');
    expect(text).toContain('- Parking included');
    expect(text).toContain('Questions for a lawyer:');
    expect(text).toContain('not legal advice');
  });

  it('omits empty sections', () => {
    const text = exportText(buildReport([finding('a', 'backed')], [draft('a', 'Deposit refundable')]));
    expect(text).not.toContain('Get this in writing:');
    expect(text).not.toContain('Questions for a lawyer:');
  });
});
