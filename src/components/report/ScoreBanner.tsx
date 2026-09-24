import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { UnderstandingScore } from '@/core/verdict/score';

/**
 * The headline number. It counts beliefs the document actually answered, and says so plainly,
 * because a score that looked like a risk rating would be read as legal advice.
 */
export function ScoreBanner({ score }: { readonly score: UnderstandingScore }): ReactNode {
  if (score.assessed === 0) {
    return (
      <p className={styles.banner}>
        Your document did not settle any of your answers either way. Every item below is worth raising before
        you sign.
      </p>
    );
  }
  return (
    <p className={styles.score}>
      Your document backed <strong>{score.correct}</strong> of the <strong>{score.assessed}</strong> answers
      it could settle. The rest are the ones worth acting on.
    </p>
  );
}
