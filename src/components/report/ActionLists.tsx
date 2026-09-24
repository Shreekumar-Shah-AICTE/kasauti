import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { WritingItem } from '@/lib/report';

const REASON_NOTES: Readonly<Record<WritingItem['reason'], string>> = {
  promise: 'you were told this, but the document does not say it',
  silent: 'your document never addresses this',
};

/**
 * The list that makes the report useful after you close the tab: everything spoken but not
 * written, and everything the document simply never covers.
 */
export function WritingList({ items }: { readonly items: readonly WritingItem[] }): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="writing-heading">
      <h2 id="writing-heading">Ask for this in writing</h2>
      <p className={styles.help}>
        Send these to the other side and ask for them to be added to the document itself.
      </p>
      <ul className={styles.beliefList}>
        {items.map((item) => (
          <li key={item.id} className={styles.beliefItem}>
            <q>{item.text}</q> — {REASON_NOTES[item.reason]}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Specific questions worth paying a professional for, generated from the unresolved items. */
export function QuestionList({ questions }: { readonly questions: readonly string[] }): ReactNode {
  if (questions.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="questions-heading">
      <h2 id="questions-heading">Worth asking a lawyer</h2>
      <ol className={styles.beliefList}>
        {questions.map((question) => (
          <li key={question} className={styles.beliefItem}>
            {question}
          </li>
        ))}
      </ol>
    </section>
  );
}
