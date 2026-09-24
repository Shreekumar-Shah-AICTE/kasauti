import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import { SourceViewer } from '@/components/report/SourceViewer';
import type { ResolvedFinding, ReviewReason, Verdict } from '@/core/verdict/types';
import type { ReportRow } from '@/lib/report';

interface VerdictStyle {
  readonly label: string;
  readonly mark: string;
  readonly className: string | undefined;
}

/**
 * Each verdict gets a label, a shape and a colour. The label and the shape carry the meaning
 * on their own, so the report still works in greyscale or with colour blindness.
 */
const VERDICTS: Readonly<Record<Verdict, VerdictStyle>> = {
  backed: { label: 'You were right', mark: '\u2713', className: styles.backed },
  contradicted: {
    label: 'The document says otherwise',
    mark: '\u2715',
    className: styles.contradicted,
  },
  silent: { label: 'The document never says', mark: '\u2014', className: styles.silent },
  needs_review: { label: 'Check this yourself', mark: '?', className: styles.review },
};

/** Why code refused to trust the model here. Shown so the gap is never silent. */
const REVIEW_REASONS: Readonly<Record<ReviewReason, string>> = {
  quote_missing: 'The model gave no quote to support this, so it was not accepted.',
  quote_unverified: 'The quote the model gave could not be found in your document, so it was rejected.',
  too_few_search_terms: 'The model did not show enough searching to claim your document is silent.',
  offline_mode: 'The model was unavailable, so nothing was checked against your document.',
};

function ReviewNote({ finding }: { readonly finding: ResolvedFinding }): ReactNode {
  if (finding.reviewReason === null) {
    return null;
  }
  return <p className={styles.reviewNote}>{REVIEW_REASONS[finding.reviewReason]}</p>;
}

function SilentNote({ finding }: { readonly finding: ResolvedFinding }): ReactNode {
  if (finding.verdict !== 'silent' || finding.searchedTerms.length === 0) {
    return null;
  }
  return <p className={styles.counter}>Searched your document for: {finding.searchedTerms.join(', ')}</p>;
}

/** One belief, its verdict, and the evidence behind it. */
export function VerdictCard({ row }: { readonly row: ReportRow }): ReactNode {
  const verdict = VERDICTS[row.finding.verdict];
  const className = [styles.card, verdict.className]
    .filter((name): name is string => name !== undefined)
    .join(' ');
  return (
    <li className={className}>
      <h3 className={styles.cardHeading}>
        <span aria-hidden="true" className={styles.mark}>
          {verdict.mark}
        </span>
        {verdict.label}
      </h3>
      <p className={styles.said}>
        {row.kind === 'promise' ? 'You were told: ' : 'You said: '}
        <q>{row.belief}</q>
      </p>
      <p>{row.finding.explanation}</p>
      {row.finding.evidence === null ? null : <SourceViewer evidence={row.finding.evidence} />}
      <SilentNote finding={row.finding} />
      <ReviewNote finding={row.finding} />
    </li>
  );
}
