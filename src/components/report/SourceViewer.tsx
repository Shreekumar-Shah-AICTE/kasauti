import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { Evidence } from '@/core/verdict/types';

/** How the quote was matched, in words a non-engineer can act on. */
const TIER_NOTES: Readonly<Record<Evidence['tier'], string>> = {
  exact: 'Found word for word in your document.',
  normalized: 'Found in your document, ignoring spacing and punctuation.',
  fuzzy: 'Found as a very close match in your document.',
};

/**
 * Shows the document's own words. The quote is sliced out of the uploaded text by code after
 * the model names it, so what appears here can never be something the model invented.
 */
export function SourceViewer({ evidence }: { readonly evidence: Evidence }): ReactNode {
  return (
    <figure className={styles.source}>
      <blockquote className={styles.quote}>{evidence.text}</blockquote>
      <figcaption className={styles.sourceMeta}>
        Page {evidence.page}
        {evidence.clause === null ? '' : `, clause ${evidence.clause}`}
        <span className={styles.tier}>{TIER_NOTES[evidence.tier]}</span>
      </figcaption>
    </figure>
  );
}
