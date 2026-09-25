import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';

interface StepNavProps {
  readonly backLabel: string;
  readonly nextLabel: string;
  readonly nextDisabled: boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
}

/** Back and forward for a step. One component, so every step moves the same way. */
export function StepNav(props: StepNavProps): ReactNode {
  return (
    <div className={styles.nav}>
      <button type="button" className="btn btn-secondary" onClick={props.onBack}>
        <span aria-hidden="true">{'\u2190'}</span> {props.backLabel}
      </button>
      <button type="button" className="btn btn-primary" disabled={props.nextDisabled} onClick={props.onNext}>
        {props.nextLabel} <span aria-hidden="true">{'\u2192'}</span>
      </button>
    </div>
  );
}
