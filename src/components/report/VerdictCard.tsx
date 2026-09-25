import type { ReactNode } from 'react';

import styles from '@/components/report/report.module.css';
import { SourceViewer } from '@/components/report/SourceViewer';
import { VerdictBadge } from '@/components/VerdictBadge';
import type { ResolvedFinding, ReviewReason } from '@/core/verdict/types';
import { cx } from '@/lib/cx';
import type { ReportRow } from '@/lib/report';

/** Why code refused to trust the model here. Shown so the gap is never silent. */
const REVIEW_REASONS: Readonly<Record<ReviewReason, string>> = {
  quote_missing: 'The model gave no quote to support this, so it was not accepted.',
  quote_unverified: 'The quote the model gave could not be found in your document, so it was rejected.',
  too_few_search_terms: 'The model did not show enough searching to claim your document is silent.',
  offline_mode: 'The model was unavailable, so nothing was checked against your document.',
};

function Notes({ finding }: { readonly finding: ResolvedFinding }): ReactNode {
  const searched = finding.verdict === 'silent' && finding.searchedTerms.length > 0;
  return (
    <>
      {searched ? (
        <p className={styles.note}>Searched your document for: {finding.searchedTerms.join(', ')}</p>
      ) : null}
      {finding.reviewReason === null ? null : (
        <p className={styles.warn}>{REVIEW_REASONS[finding.reviewReason]}</p>
      )}
    </>
  );
}

interface VerdictCardProps {
  readonly row: ReportRow;
  readonly selected: boolean;
  readonly onShow: (beliefId: string) => void;
}

/** One belief, its verdict, and the evidence behind it. */
export function VerdictCard({ row, selected, onShow }: VerdictCardProps): ReactNode {
  const { finding } = row;
  return (
    <li className={cx(styles.card, selected && styles.selected)}>
      <h3 className={styles.cardHeading}>
        <VerdictBadge verdict={finding.verdict} />
        <span className={styles.kind}>
          {row.kind === 'promise' ? 'Something you were told' : 'Your belief'}
        </span>
      </h3>
      <p className={styles.said}>
        <q>{row.belief}</q>
      </p>
      <p className={styles.explain}>{finding.explanation}</p>
      {finding.evidence === null ? null : (
        <SourceViewer
          evidence={finding.evidence}
          onShow={() => {
            onShow(finding.beliefId);
          }}
        />
      )}
      <Notes finding={finding} />
    </li>
  );
}
