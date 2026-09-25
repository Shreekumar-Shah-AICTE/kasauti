import type { ReactNode } from 'react';

import styles from '@/components/beliefs/beliefs.module.css';
import type { BeliefInput } from '@/core/verdict/types';

interface ExampleChipsProps {
  readonly examples: readonly BeliefInput[];
  readonly full: boolean;
  readonly onAdd: (id: string) => void;
}

/**
 * Beliefs people commonly hold about a sample document. Each one is added only when clicked,
 * so the check always runs on answers the user chose.
 */
export function ExampleChips({ examples, full, onAdd }: ExampleChipsProps): ReactNode {
  if (examples.length === 0) {
    return null;
  }
  return (
    <section className={styles.examples} aria-labelledby="examples-heading">
      <h3 id="examples-heading">Not sure what to check? Add a common belief</h3>
      <ul className={styles.chips}>
        {examples.map((example) => (
          <li key={example.id}>
            <button
              type="button"
              className={styles.chip}
              disabled={full}
              onClick={() => {
                onAdd(example.id);
              }}
            >
              <span aria-hidden="true">+ </span>
              {example.kind === 'promise' ? 'Told: ' : ''}
              {example.text}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
