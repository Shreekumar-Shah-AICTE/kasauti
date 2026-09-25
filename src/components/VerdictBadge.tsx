import type { ReactNode } from 'react';

import styles from '@/components/verdict.module.css';
import type { Verdict } from '@/core/verdict/types';
import { cx } from '@/lib/cx';

interface VerdictMeta {
  readonly label: string;
  readonly mark: string;
  readonly tone: string | undefined;
  /** One line on what the verdict means, used by the legend. */
  readonly meaning: string;
}

/**
 * Each verdict gets a label, a symbol and a colour. The label and the symbol carry the meaning on
 * their own, so the report still reads correctly in greyscale or with colour blindness.
 */
export const VERDICTS: Readonly<Record<Verdict, VerdictMeta>> = {
  contradicted: {
    label: 'The document says otherwise',
    mark: '\u2715',
    tone: styles.contradicted,
    meaning: 'Your belief conflicts with a clause. You will see the exact words.',
  },
  silent: {
    label: 'The document never says',
    mark: '\u2014',
    tone: styles.silent,
    meaning: 'Nothing in the text settles it. Get it in writing before you sign.',
  },
  backed: {
    label: 'You were right',
    mark: '\u2713',
    tone: styles.backed,
    meaning: 'A clause supports your belief, quoted with its page.',
  },
  needs_review: {
    label: 'Check this yourself',
    mark: '?',
    tone: styles.review,
    meaning: 'The AI could not back its answer with a quote, so code refused to trust it.',
  },
};

/** Verdicts in the order the product explains them. */
export const VERDICT_ORDER: readonly Verdict[] = ['contradicted', 'silent', 'backed', 'needs_review'];

/** A verdict as a pill: symbol, then words. Colour is only ever a third signal. */
export function VerdictBadge({
  verdict,
  suffix,
}: {
  readonly verdict: Verdict;
  readonly suffix?: string;
}): ReactNode {
  const meta = VERDICTS[verdict];
  return (
    <span className={cx(styles.badge, meta.tone)}>
      <span className={styles.mark} aria-hidden="true">
        {meta.mark}
      </span>
      {meta.label}
      {suffix}
    </span>
  );
}
