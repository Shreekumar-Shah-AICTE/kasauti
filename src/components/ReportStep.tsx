'use client';

import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import { QuestionList, WritingList } from '@/components/report/ActionLists';
import { ExportButton } from '@/components/report/ExportButton';
import { ScoreBanner } from '@/components/report/ScoreBanner';
import { VerdictCard } from '@/components/report/VerdictCard';
import type { ResolvedFinding } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';
import { buildReport, exportText } from '@/lib/report';

interface ReportStepProps {
  readonly findings: readonly ResolvedFinding[];
  readonly drafts: readonly BeliefDraft[];
  readonly offline: boolean;
  readonly onBack: () => void;
  readonly onRestart: () => void;
}

function OfflineBanner({ offline }: { readonly offline: boolean }): ReactNode {
  if (!offline) {
    return null;
  }
  return (
    <p className={styles.banner}>
      The model was unavailable, so nothing here was checked against your document. Every item is marked for
      your own review, and the questions below are still worth asking.
    </p>
  );
}

function ReportActions({
  onBack,
  onRestart,
}: {
  readonly onBack: () => void;
  readonly onRestart: () => void;
}): ReactNode {
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.secondary} onClick={onBack}>
        Edit my answers
      </button>
      <button type="button" className={styles.primary} onClick={onRestart}>
        Check another document
      </button>
    </div>
  );
}

/**
 * Step four: the report. Every quote shown here was located in the document by code, not by
 * the model, so a confident-sounding answer can never invent its own evidence.
 */
export function ReportStep(props: ReportStepProps): ReactNode {
  const report = buildReport(props.findings, props.drafts);
  return (
    <section aria-labelledby="report-heading">
      <h2 id="report-heading">What the document actually says</h2>
      <OfflineBanner offline={props.offline} />
      <ScoreBanner score={report.score} />
      <ul className={styles.cardList}>
        {report.rows.map((row) => (
          <VerdictCard key={row.finding.beliefId} row={row} />
        ))}
      </ul>
      <WritingList items={report.writingList} />
      <QuestionList questions={report.questions} />
      <p className={styles.help}>Kasauti gives information, not legal advice.</p>
      <ExportButton text={exportText(report)} />
      <ReportActions onBack={props.onBack} onRestart={props.onRestart} />
    </section>
  );
}
