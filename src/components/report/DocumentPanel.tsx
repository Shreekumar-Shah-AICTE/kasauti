'use client';

import { type ReactNode, useEffect, useRef } from 'react';

import styles from '@/components/report/report.module.css';
import { locationOf } from '@/components/report/SourceViewer';
import type { Evidence } from '@/core/verdict/types';
import { cx } from '@/lib/cx';
import { type PageView, pageView } from '@/lib/documentView';

interface DocumentPanelProps {
  readonly documentName: string;
  readonly pages: readonly string[];
  readonly evidence: Evidence | null;
  /** Changes each time the user asks to see a quote, so focus moves even to the same one. */
  readonly focusKey: number;
}

function EmptyPanel(): ReactNode {
  return (
    <p className={styles.note}>
      No quote to show yet. When a belief is backed or contradicted, its exact words appear here, highlighted
      on their page.
    </p>
  );
}

function PageText({ view, focusKey }: { readonly view: PageView; readonly focusKey: number }): ReactNode {
  const markRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focusKey > 0) {
      markRef.current?.focus();
      markRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [focusKey]);
  return (
    <p className={styles.page}>
      {view.clippedStart ? '\u2026 ' : null}
      {view.before}
      {view.match.length > 0 ? (
        <mark ref={markRef} tabIndex={-1}>
          {view.match}
        </mark>
      ) : null}
      {view.after}
      {view.clippedEnd ? ' \u2026' : null}
    </p>
  );
}

/**
 * The document beside the verdicts. The highlighted words are placed by the offset code
 * computed during verification, so the user sees the quote in its real surroundings.
 */
export function DocumentPanel({ documentName, pages, evidence, focusKey }: DocumentPanelProps): ReactNode {
  const view = evidence === null ? null : pageView(pages, evidence);
  const where = evidence === null ? '' : locationOf(evidence);
  return (
    <aside id="document-panel" className={cx('panel', styles.doc)} aria-labelledby="document-panel-heading">
      <div className={styles.docHead}>
        <h3 id="document-panel-heading">Your document</h3>
        <span className={styles.note}>
          {documentName}
          {view === null ? '' : ` \u00B7 page ${String(view.page)} of ${String(view.totalPages)}`}
        </span>
      </div>
      <p className="visually-hidden" aria-live="polite">
        {view === null ? '' : `Showing ${where} in your document.`}
      </p>
      {view === null ? <EmptyPanel /> : <PageText view={view} focusKey={focusKey} />}
    </aside>
  );
}
