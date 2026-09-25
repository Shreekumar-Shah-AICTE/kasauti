import type { ReactNode } from 'react';

import styles from '@/components/document/document.module.css';
import { ROLE_META } from '@/components/roles';
import { type SampleDocument, SAMPLES } from '@/samples';

/**
 * The fastest way to see the product: synthetic documents with the traps real signers meet.
 * Choosing one loads the document only; the beliefs are still yours to type or pick.
 */
export function SampleList({ onSample }: { readonly onSample: (sample: SampleDocument) => void }): ReactNode {
  return (
    <ul className={styles.samples}>
      {SAMPLES.map((sample) => (
        <li key={sample.id}>
          <button
            type="button"
            className={styles.sample}
            onClick={() => {
              onSample(sample);
            }}
          >
            <span className={styles.icon} aria-hidden="true">
              {ROLE_META[sample.role].icon}
            </span>
            <span>
              <span className={styles.sampleTitle}>{sample.title}</span>
              <span className={styles.sampleSummary}>{sample.summary}</span>
            </span>
            <span className={styles.go} aria-hidden="true">
              Try it {'\u2192'}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
