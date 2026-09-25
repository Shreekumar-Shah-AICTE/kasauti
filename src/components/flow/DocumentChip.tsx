import type { ReactNode } from 'react';

import styles from '@/components/flow/flow.module.css';
import { documentStats } from '@/lib/documentView';

function plural(count: number, word: string): string {
  return `${count.toLocaleString('en-IN')} ${word}${count === 1 ? '' : 's'}`;
}

/** Confirms which document is loaded, so a wrong upload is caught before any checking. */
export function DocumentChip({
  name,
  pages,
}: {
  readonly name: string;
  readonly pages: readonly string[];
}): ReactNode {
  const stats = documentStats(pages);
  return (
    <p className={styles.docChip}>
      <span aria-hidden="true">{'\u{1F4C4}'}</span>
      <span className={styles.docName}>{name}</span>
      <span>
        {plural(stats.pages, 'page')} {'\u00B7'} {plural(stats.words, 'word')}
      </span>
    </p>
  );
}
