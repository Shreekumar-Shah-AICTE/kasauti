'use client';

import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import { LIMITS, SERVER } from '@/core/constants';
import type { BeliefDraft } from '@/lib/checkerState';

interface BeliefCardProps {
  readonly draft: BeliefDraft;
  readonly onChange: (id: string, text: string) => void;
  readonly onRemove: (id: string) => void;
}

function BeliefCard({ draft, onChange, onRemove }: BeliefCardProps): ReactNode {
  return (
    <li className={styles.beliefItem}>
      <label className={styles.prompt} htmlFor={`draft-${draft.id}`}>
        {draft.prompt}
      </label>
      {draft.kind === 'promise' ? <span className={styles.kind}>Told, not written</span> : null}
      <textarea
        id={`draft-${draft.id}`}
        className={styles.textarea}
        rows={2}
        maxLength={SERVER.maxBeliefChars}
        value={draft.text}
        onChange={(event) => {
          onChange(draft.id, event.target.value);
        }}
      />
      {draft.kind === 'promise' ? (
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            onRemove(draft.id);
          }}
        >
          Remove this one
        </button>
      ) : null}
    </li>
  );
}

interface FooterProps {
  readonly count: number;
  readonly busy: boolean;
  readonly canCheck: boolean;
  readonly onAddPromise: () => void;
  readonly onCheck: () => void;
  readonly onBack: () => void;
}

function BeliefFooter(props: FooterProps): ReactNode {
  return (
    <>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.secondary}
          disabled={props.count >= LIMITS.maxBeliefs}
          onClick={props.onAddPromise}
        >
          Add something you were told
        </button>
        <span className={styles.counter}>
          {props.count} of {LIMITS.maxBeliefs}
        </span>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={props.onBack}>
          Back
        </button>
        <button type="button" className={styles.primary} disabled={!props.canCheck} onClick={props.onCheck}>
          {props.busy ? 'Checking…' : 'Check against the document'}
        </button>
      </div>
    </>
  );
}

interface BeliefStepProps {
  readonly drafts: readonly BeliefDraft[];
  readonly offline: boolean;
  readonly busy: boolean;
  readonly canCheck: boolean;
  readonly onChange: (id: string, text: string) => void;
  readonly onAddPromise: () => void;
  readonly onRemovePromise: (id: string) => void;
  readonly onCheck: () => void;
  readonly onBack: () => void;
}

/**
 * Step three: the teach-back. The user answers in their own words before seeing anything the
 * document says, which is the only way to catch a belief they did not know was wrong.
 */
export function BeliefStep(props: BeliefStepProps): ReactNode {
  return (
    <section aria-labelledby="beliefs-heading">
      <h2 id="beliefs-heading">In your words, what does it say?</h2>
      <p className={styles.help}>
        Answer from memory. Guessing is fine — a wrong answer here is exactly what this tool is looking for.
      </p>
      {props.offline ? (
        <p className={styles.banner}>
          The model is unavailable, so these are standard questions for your situation rather than questions
          written for your document.
        </p>
      ) : null}
      <ul className={styles.beliefList}>
        {props.drafts.map((draft) => (
          <BeliefCard
            key={draft.id}
            draft={draft}
            onChange={props.onChange}
            onRemove={props.onRemovePromise}
          />
        ))}
      </ul>
      <BeliefFooter
        count={props.drafts.length}
        busy={props.busy}
        canCheck={props.canCheck}
        onAddPromise={props.onAddPromise}
        onCheck={props.onCheck}
        onBack={props.onBack}
      />
    </section>
  );
}
