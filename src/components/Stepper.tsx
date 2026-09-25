import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { Step } from '@/lib/checkerState';
import { cx } from '@/lib/cx';

const STEPS: readonly { readonly id: Step; readonly label: string }[] = [
  { id: 'document', label: 'Document' },
  { id: 'role', label: 'You' },
  { id: 'beliefs', label: 'Your beliefs' },
  { id: 'report', label: 'Report' },
];

type StepState = 'done' | 'current' | 'todo';

function stateOf(index: number, current: number): StepState {
  if (index < current) {
    return 'done';
  }
  return index === current ? 'current' : 'todo';
}

/** Shows where the user is, so a four-step flow never feels open-ended. */
export function Stepper({ step }: { readonly step: Step }): ReactNode {
  const current = STEPS.findIndex((item) => item.id === step);
  return (
    <nav aria-label="Progress">
      <ol className={styles.stepper}>
        {STEPS.map((item, index) => {
          const state = stateOf(index, current);
          return (
            <li
              key={item.id}
              className={cx(styles.step, state !== 'todo' && styles[state])}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className={styles.dot} aria-hidden="true">
                {state === 'done' ? '\u2713' : index + 1}
              </span>
              <span className={styles.stepLabel}>
                {item.label}
                {state === 'done' ? <span className="visually-hidden"> (done)</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
