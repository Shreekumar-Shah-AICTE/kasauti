'use client';

import type { ReactNode } from 'react';

import { BeliefCard } from '@/components/beliefs/BeliefCard';
import styles from '@/components/beliefs/beliefs.module.css';
import { ExampleChips } from '@/components/beliefs/ExampleChips';
import checker from '@/components/checker.module.css';
import { StepNav } from '@/components/flow/StepNav';
import { LIMITS } from '@/core/constants';
import type { BeliefInput } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';

interface BeliefStepProps {
  readonly drafts: readonly BeliefDraft[];
  readonly examples: readonly BeliefInput[];
  readonly offline: boolean;
  readonly busy: boolean;
  readonly canCheck: boolean;
  readonly onChange: (id: string, text: string) => void;
  readonly onAddPromise: () => void;
  readonly onAddExample: (id: string) => void;
  readonly onRemovePromise: (id: string) => void;
  readonly onCheck: () => void;
  readonly onBack: () => void;
}

/** Says where the questions came from, so the AI's part is visible rather than assumed. */
function SourceBanner({ offline }: { readonly offline: boolean }): ReactNode {
  if (offline) {
    return (
      <p className={checker.banner}>
        The model is unavailable, so these are standard questions for your situation rather than questions
        written for your document.
      </p>
    );
  }
  return (
    <p className={checker.liveBanner}>
      <strong>Gemini wrote these questions for this document.</strong> Answer them from memory, then add
      anything you were told out loud.
    </p>
  );
}

/** Question numbers count only questions, so an added promise never shifts them. */
function questionNumbers(drafts: readonly BeliefDraft[]): number[] {
  let count = 0;
  return drafts.map((draft) => (draft.kind === 'belief' ? ++count : 0));
}

function DraftList(props: Pick<BeliefStepProps, 'drafts' | 'onChange' | 'onRemovePromise'>): ReactNode {
  const numbers = questionNumbers(props.drafts);
  return (
    <ul className={styles.list}>
      {props.drafts.map((draft, index) => (
        <BeliefCard
          key={draft.id}
          draft={draft}
          number={numbers[index] ?? 0}
          onChange={props.onChange}
          onRemove={props.onRemovePromise}
        />
      ))}
    </ul>
  );
}

/**
 * Step three: the teach-back. The user answers in their own words before seeing anything the
 * document says, which is the only way to catch a belief they did not know was wrong.
 */
export function BeliefStep(props: BeliefStepProps): ReactNode {
  const full = props.drafts.length >= LIMITS.maxBeliefs;
  return (
    <section aria-labelledby="beliefs-heading" className={checker.stage}>
      <h2 id="beliefs-heading">In your words, what does it say?</h2>
      <p className={checker.help}>
        Guessing is fine. A wrong answer here is exactly what this tool is looking for.
      </p>
      <SourceBanner offline={props.offline} />
      <DraftList drafts={props.drafts} onChange={props.onChange} onRemovePromise={props.onRemovePromise} />
      <div className={styles.addRow}>
        <button type="button" className="btn btn-secondary" disabled={full} onClick={props.onAddPromise}>
          <span aria-hidden="true">+</span> Add something you were told
        </button>
        <span className={checker.meta}>
          {props.drafts.length} of {LIMITS.maxBeliefs} beliefs
        </span>
      </div>
      <ExampleChips examples={props.examples} full={full} onAdd={props.onAddExample} />
      <StepNav
        backLabel="Back"
        nextLabel={props.busy ? 'Checking\u2026' : 'Check against the document'}
        nextDisabled={!props.canCheck}
        onBack={props.onBack}
        onNext={props.onCheck}
      />
    </section>
  );
}
