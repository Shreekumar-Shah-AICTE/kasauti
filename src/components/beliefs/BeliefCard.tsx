import type { ReactNode } from 'react';

import styles from '@/components/beliefs/beliefs.module.css';
import checker from '@/components/checker.module.css';
import { SERVER } from '@/core/constants';
import type { BeliefDraft } from '@/lib/checkerState';
import { cx } from '@/lib/cx';

interface BeliefCardProps {
  readonly draft: BeliefDraft;
  /** 1-based position among the questions, shown as "Question 2". */
  readonly number: number;
  readonly onChange: (id: string, text: string) => void;
  readonly onRemove: (id: string) => void;
}

const PLACEHOLDERS: Readonly<Record<BeliefDraft['kind'], string>> = {
  belief: 'Your answer, in your own words. A guess is fine.',
  promise: 'For example: the landlord said the deposit is fully refundable.',
};

/** One question and the user's answer. Promises are marked, because they need different follow-up. */
export function BeliefCard({ draft, number, onChange, onRemove }: BeliefCardProps): ReactNode {
  const isPromise = draft.kind === 'promise';
  const inputId = `draft-${draft.id}`;
  return (
    <li className={cx(styles.card, isPromise && styles.promise)}>
      <div className={styles.cardTop}>
        <span className={styles.tag}>{isPromise ? 'Told, not written' : `Question ${String(number)}`}</span>
        <button
          type="button"
          className="btn btn-quiet"
          onClick={() => {
            onRemove(draft.id);
          }}
        >
          {isPromise ? 'Remove' : 'Skip'}
          <span className="visually-hidden">: {draft.prompt}</span>
        </button>
      </div>
      <label className={styles.prompt} htmlFor={inputId}>
        {draft.prompt}
      </label>
      <textarea
        id={inputId}
        className={checker.textarea}
        rows={2}
        maxLength={SERVER.maxBeliefChars}
        value={draft.text}
        placeholder={PLACEHOLDERS[draft.kind]}
        onChange={(event) => {
          onChange(draft.id, event.target.value);
        }}
      />
    </li>
  );
}
