import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { Step } from '@/lib/checkerState';

const STEPS: readonly { readonly id: Step; readonly label: string }[] = [
  { id: 'document', label: 'Document' },
  { id: 'role', label: 'You' },
  { id: 'beliefs', label: 'Your beliefs' },
  { id: 'report', label: 'Report' },
];

/** Shows where the user is, so a four-step flow never feels open-ended. */
export function Stepper({ step }: { readonly step: Step }): ReactNode {
  const current = STEPS.findIndex((item) => item.id === step);
  return (
    <nav aria-label="Progress">
      <ol className={styles.stepper}>
        {STEPS.map((item, index) => (
          <li
            key={item.id}
            className={item.id === step ? styles.stepCurrent : styles.stepItem}
            aria-current={item.id === step ? 'step' : undefined}
          >
            {index < current ? '\u2713 ' : ''}
            {item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
