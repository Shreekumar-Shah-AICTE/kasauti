'use client';

import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { ResolvedFinding, Verdict } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';

const VERDICT_LABELS: Readonly<Record<Verdict, string>> = {
  backed: 'The document backs this',
  contradicted: 'The document contradicts this',
  silent: 'The document is silent on this',
  needs_review: 'Needs your own review',
};

interface ReportStepProps {
  readonly findings: readonly ResolvedFinding[];
  readonly drafts: readonly BeliefDraft[];
  readonly offline: boolean;
  readonly onBack: () => void;
  readonly onRestart: () => void;
}

function FindingCard({
  finding,
  belief,
}: {
  readonly finding: ResolvedFinding;
  readonly belief: string;
}): ReactNode {
  return (
    <li className={styles.beliefItem}>
      <h3>{VERDICT_LABELS[finding.verdict]}</h3>
      <p className={styles.prompt}>You said: {belief}</p>
      <p>{finding.explanation}</p>
      {finding.evidence === null ? null : (
        <blockquote>
          <p>{finding.evidence.text}</p>
          <footer>
            Page {finding.evidence.page}
            {finding.evidence.clause === null ? '' : `, clause ${finding.evidence.clause}`}
          </footer>
        </blockquote>
      )}
      {finding.verdict === 'silent' && finding.searchedTerms.length > 0 ? (
        <p className={styles.counter}>Searched for: {finding.searchedTerms.join(', ')}</p>
      ) : null}
    </li>
  );
}

/**
 * Step four: the report. Every quote shown here was located in the document by code, not by
 * the model, so a confident-sounding answer can never invent its own evidence.
 */
export function ReportStep(props: ReportStepProps): ReactNode {
  const beliefText = new Map(props.drafts.map((draft) => [draft.id, draft.text.trim()]));
  return (
    <section aria-labelledby="report-heading">
      <h2 id="report-heading">What the document actually says</h2>
      {props.offline ? (
        <p className={styles.banner}>
          The model was unavailable, so nothing here was checked against your document. Every item is marked
          for your own review.
        </p>
      ) : null}
      <ul className={styles.beliefList}>
        {props.findings.map((finding) => (
          <FindingCard
            key={finding.beliefId}
            finding={finding}
            belief={beliefText.get(finding.beliefId) ?? finding.beliefId}
          />
        ))}
      </ul>
      <p className={styles.help}>Kasauti gives information, not legal advice.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={props.onBack}>
          Edit my answers
        </button>
        <button type="button" className={styles.primary} onClick={props.onRestart}>
          Check another document
        </button>
      </div>
    </section>
  );
}
