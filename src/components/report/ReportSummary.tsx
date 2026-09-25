import type { ReactNode } from 'react';

import styles from '@/components/report/report.module.css';
import { VERDICT_ORDER, VerdictBadge } from '@/components/VerdictBadge';
import type { UnderstandingScore, VerdictTally } from '@/core/verdict/score';
import { cx } from '@/lib/cx';

/** The ring is drawn on a circle of circumference 100, so a percentage is its own dash length. */
const RING_RADIUS = 15.915;
const FULL = 100;

function ScoreRing({ score }: { readonly score: UnderstandingScore }): ReactNode {
  const percent = score.assessed === 0 ? 0 : Math.round((score.correct / score.assessed) * FULL);
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
        <circle className={styles.ringTrack} cx="18" cy="18" r={RING_RADIUS} />
        <circle
          className={styles.ringValue}
          cx="18"
          cy="18"
          r={RING_RADIUS}
          strokeDasharray={`${String(percent)} ${String(FULL - percent)}`}
        />
      </svg>
      <span className={styles.ringText} aria-hidden="true">
        {score.correct}/{score.assessed}
      </span>
    </div>
  );
}

function scoreLine(score: UnderstandingScore): string {
  if (score.assessed === 0) {
    return 'Your document did not settle any of your beliefs either way. Every item below is worth raising before you sign.';
  }
  return `Your document backed ${String(score.correct)} of the ${String(score.assessed)} beliefs it could settle. The rest are the ones worth acting on.`;
}

/**
 * The headline: how many beliefs held up, and a count per verdict. It counts beliefs the
 * document answered, and says so plainly, so it is never mistaken for a risk rating.
 */
export function ReportSummary({
  score,
  tally,
}: {
  readonly score: UnderstandingScore;
  readonly tally: VerdictTally;
}): ReactNode {
  return (
    <div className={cx('panel', styles.summary)}>
      <ScoreRing score={score} />
      <div>
        <p className={styles.scoreLine}>{scoreLine(score)}</p>
        <ul className={styles.tally} aria-label="Verdict counts">
          {VERDICT_ORDER.filter((verdict) => tally[verdict] > 0).map((verdict) => (
            <li key={verdict}>
              <VerdictBadge verdict={verdict} suffix={`: ${String(tally[verdict])}`} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
