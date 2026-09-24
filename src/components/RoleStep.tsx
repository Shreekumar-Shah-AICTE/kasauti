'use client';

import type { ReactNode } from 'react';

import styles from '@/components/checker.module.css';
import { type Role, ROLES } from '@/core/probes/fallbackBank';

/** What each role means in plain words, so the choice is obvious without legal knowledge. */
const ROLE_LABELS: Readonly<Record<Role, string>> = {
  tenant: 'Renting a home',
  employee: 'Taking a job',
  freelancer: 'Freelance or contract work',
  consumer: 'Buying a product or service',
};

interface RoleStepProps {
  readonly role: Role | null;
  readonly busy: boolean;
  readonly onChoose: (role: Role) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

/**
 * Asks who the reader is. The role decides which beliefs are worth probing, so a wrong
 * answer here quietly weakens everything after it.
 */
export function RoleStep(props: RoleStepProps): ReactNode {
  return (
    <section aria-labelledby="role-heading">
      <h2 id="role-heading">Which of these are you about to sign?</h2>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Your situation</legend>
        {ROLES.map((role) => (
          <label key={role} className={styles.choice} htmlFor={`role-${role}`}>
            <input
              type="radio"
              id={`role-${role}`}
              name="role"
              value={role}
              checked={props.role === role}
              onChange={() => {
                props.onChoose(role);
              }}
            />
            <span>{ROLE_LABELS[role]}</span>
          </label>
        ))}
      </fieldset>
      <div className={styles.actions}>
        <button type="button" className={styles.secondary} onClick={props.onBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.primary}
          disabled={props.role === null || props.busy}
          onClick={props.onContinue}
        >
          {props.busy ? 'Reading the document…' : 'Next: your beliefs'}
        </button>
      </div>
    </section>
  );
}
