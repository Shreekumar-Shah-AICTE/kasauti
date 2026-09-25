'use client';

import { type ReactNode, useState } from 'react';

import styles from '@/components/checker.module.css';
import { QuestionList, WritingList } from '@/components/report/ActionLists';
import { DocumentPanel } from '@/components/report/DocumentPanel';
import { ExportButton } from '@/components/report/ExportButton';
import report from '@/components/report/report.module.css';
import { ReportSummary } from '@/components/report/ReportSummary';
import { VerdictCard } from '@/components/report/VerdictCard';
import type { ResolvedFinding } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';
import { buildReport, exportText, type ReportRow } from '@/lib/report';

interface ReportStepProps {
  readonly findings: readonly ResolvedFinding[];
  readonly drafts: readonly BeliefDraft[];
  readonly offline: boolean;
  readonly documentName: string;
  readonly pages: readonly string[];
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

function ReportActions({ onBack, onRestart }: Pick<ReportStepProps, 'onBack' | 'onRestart'>): ReactNode {
  return (
    <div className={styles.nav}>
      <button type="button" className="btn btn-secondary" onClick={onBack}>
        Edit my answers
      </button>
      <button type="button" className="btn btn-primary" onClick={onRestart}>
        Check another document
      </button>
    </div>
  );
}

/** The first row that has a quote, so the document panel opens on real evidence. */
function firstWithEvidence(rows: readonly ReportRow[]): string | null {
  return rows.find((row) => row.finding.evidence !== null)?.finding.beliefId ?? null;
}

interface Selection {
  readonly beliefId: string | null;
  readonly focusKey: number;
}

interface EvidenceGridProps {
  readonly rows: readonly ReportRow[];
  readonly documentName: string;
  readonly pages: readonly string[];
}

/** Verdict cards beside the document; choosing a card's quote highlights it on its page. */
function EvidenceGrid({ rows, documentName, pages }: EvidenceGridProps): ReactNode {
  const [selection, setSelection] = useState<Selection>(() => ({
    beliefId: firstWithEvidence(rows),
    focusKey: 0,
  }));
  const selected = rows.find((row) => row.finding.beliefId === selection.beliefId);
  const show = (beliefId: string): void => {
    setSelection((previous) => ({ beliefId, focusKey: previous.focusKey + 1 }));
  };
  return (
    <div className={report.grid}>
      <ul className={report.cards} aria-label="Your beliefs, checked">
        {rows.map((row) => (
          <VerdictCard
            key={row.finding.beliefId}
            row={row}
            selected={row.finding.beliefId === selection.beliefId}
            onShow={show}
          />
        ))}
      </ul>
      <DocumentPanel
        documentName={documentName}
        pages={pages}
        evidence={selected?.finding.evidence ?? null}
        focusKey={selection.focusKey}
      />
    </div>
  );
}

/**
 * Step four: the report. Every quote shown here was located in the document by code, not by
 * the model, so a confident-sounding answer can never invent its own evidence.
 */
export function ReportStep(props: ReportStepProps): ReactNode {
  const built = buildReport(props.findings, props.drafts);
  return (
    <section aria-labelledby="report-heading">
      <h2 id="report-heading">What the document actually says</h2>
      <p className={styles.help}>Most important first: anything the document contradicts is at the top.</p>
      <OfflineBanner offline={props.offline} />
      <ReportSummary score={built.score} tally={built.tally} />
      <EvidenceGrid rows={built.rows} documentName={props.documentName} pages={props.pages} />
      <div className={report.next}>
        <WritingList items={built.writingList} />
        <QuestionList questions={built.questions} />
      </div>
      <p className={report.notice}>Kasauti gives information, not legal advice.</p>
      <ExportButton text={exportText(built)} />
      <ReportActions onBack={props.onBack} onRestart={props.onRestart} />
    </section>
  );
}
