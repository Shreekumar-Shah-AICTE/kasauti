import type { ReactNode } from 'react';

import { CopyButton } from '@/components/report/CopyButton';
import styles from '@/components/report/report.module.css';
import { type WritingItem, writingRequest } from '@/lib/report';

const REASON_NOTES: Readonly<Record<WritingItem['reason'], string>> = {
  promise: 'You were told this, but the document does not confirm it.',
  silent: 'Your document never addresses this.',
};

/**
 * The list that makes the report useful after you close the tab: everything spoken but not
 * written, and everything the document never covers, with a message ready to send.
 */
export function WritingList({ items }: { readonly items: readonly WritingItem[] }): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="panel" aria-labelledby="writing-heading">
      <h3 id="writing-heading">Ask for this in writing</h3>
      <p className={styles.note}>Ask the other side to add these to the document before you sign.</p>
      <ol className={styles.items}>
        {items.map((item) => (
          <li key={item.id}>
            <q>{item.text}</q>
            <span className={styles.why}>{REASON_NOTES[item.reason]}</span>
          </li>
        ))}
      </ol>
      <div className={styles.bar}>
        <CopyButton text={writingRequest(items)} label="Copy a message asking for this" />
      </div>
    </section>
  );
}

/** Specific questions worth paying a professional for, generated from the unresolved items. */
export function QuestionList({ questions }: { readonly questions: readonly string[] }): ReactNode {
  if (questions.length === 0) {
    return null;
  }
  return (
    <section className="panel" aria-labelledby="questions-heading">
      <h3 id="questions-heading">Worth asking a lawyer</h3>
      <p className={styles.note}>
        Each question points at the clause it is about, so a consultation starts faster.
      </p>
      <ol className={styles.items}>
        {questions.map((question) => (
          <li key={question}>{question}</li>
        ))}
      </ol>
    </section>
  );
}
