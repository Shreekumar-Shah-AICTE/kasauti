import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import type { Step } from '@/lib/checkerState';

/** What is happening during each model call, said plainly so the wait explains the product. */
const STAGES: Partial<Readonly<Record<Step, { readonly title: string; readonly detail: string }>>> = {
  role: {
    title: 'Reading your document\u2026',
    detail: 'Gemini is writing three questions about the parts of this document that matter for you.',
  },
  beliefs: {
    title: 'Checking every belief against your document\u2026',
    detail:
      'One Gemini call reads all your beliefs against the text. Then code searches your document for every quote it gives, computes the page, and rejects any quote it cannot find.',
  },
};

/**
 * Progress for a model call. It lives inside an always-mounted `role="status"` region, so
 * screen readers announce the stage when it appears.
 */
export function ProgressPanel({ step, busy }: { readonly step: Step; readonly busy: boolean }): ReactNode {
  const stage = STAGES[step];
  if (!busy || stage === undefined) {
    return null;
  }
  return (
    <div className={styles.progress}>
      <span className={styles.spinner} aria-hidden="true" />
      <div>
        <p className={styles.progressTitle}>{stage.title}</p>
        <p className={styles.help}>{stage.detail}</p>
      </div>
    </div>
  );
}
