import type { ReactNode } from 'react';

import styles from '@/components/report/report.module.css';
import type { Evidence } from '@/core/verdict/types';
import { cx } from '@/lib/cx';

/** How the quote was matched, in words a non-engineer can act on. */
const TIER_NOTES: Readonly<Record<Evidence['tier'], string>> = {
  exact: 'Found word for word in your document.',
  normalized: 'Found in your document, ignoring spacing and punctuation.',
  fuzzy: 'Found as a very close match in your document.',
};

/**
 * "Page 2, Clause 9": where the quote sits, computed by code from its offset. Clause labels
 * already carry their own wording, so they are used exactly as the document numbers them.
 */
export function locationOf(evidence: Evidence): string {
  const clause = evidence.clause === null ? '' : `, ${evidence.clause}`;
  return `Page ${String(evidence.page)}${clause}`;
}

interface SourceViewerProps {
  readonly evidence: Evidence;
  readonly onShow: () => void;
}

/**
 * Shows the document's own words. The quote is sliced out of the uploaded text by code after
 * the model names it, so what appears here can never be something the model invented.
 */
export function SourceViewer({ evidence, onShow }: SourceViewerProps): ReactNode {
  return (
    <figure className={styles.source}>
      <blockquote className={styles.quote}>{evidence.text}</blockquote>
      <figcaption className={styles.sourceMeta}>
        <span>
          <span className={styles.where}>{locationOf(evidence)}</span> {'\u00B7'} {TIER_NOTES[evidence.tier]}
        </span>
        <button
          type="button"
          className={cx('btn btn-quiet', styles.show)}
          aria-controls="document-panel"
          onClick={onShow}
        >
          Show in document<span className="visually-hidden"> ({locationOf(evidence)})</span>
        </button>
      </figcaption>
    </figure>
  );
}
