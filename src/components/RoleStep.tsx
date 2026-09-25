'use client';

import type { ReactNode } from 'react';

import checker from '@/components/checker.module.css';
import { DocumentChip } from '@/components/flow/DocumentChip';
import styles from '@/components/flow/flow.module.css';
import { StepNav } from '@/components/flow/StepNav';
import { ROLE_META } from '@/components/roles';
import { type Role, ROLES } from '@/core/probes/fallbackBank';

interface RoleStepProps {
  readonly role: Role | null;
  readonly busy: boolean;
  readonly documentName: string;
  readonly pages: readonly string[];
  readonly onChoose: (role: Role) => void;
  readonly onContinue: () => void;
  readonly onBack: () => void;
}

function RoleCard({
  role,
  checked,
  onChoose,
}: {
  readonly role: Role;
  readonly checked: boolean;
  readonly onChoose: (role: Role) => void;
}): ReactNode {
  const meta = ROLE_META[role];
  return (
    <label className={styles.roleCard} htmlFor={`role-${role}`}>
      <input
        type="radio"
        id={`role-${role}`}
        className="visually-hidden"
        name="role"
        value={role}
        checked={checked}
        onChange={() => {
          onChoose(role);
        }}
      />
      <span className={styles.roleIcon} aria-hidden="true">
        {meta.icon}
      </span>
      <span className={styles.roleLabel}>{meta.label}</span>
      <span className={styles.roleHint}>{meta.hint}</span>
    </label>
  );
}

/**
 * Asks who the reader is. The role decides which beliefs are worth probing, so a wrong
 * answer here quietly weakens everything after it.
 */
export function RoleStep(props: RoleStepProps): ReactNode {
  return (
    <section aria-labelledby="role-heading" className={checker.stage}>
      <h2 id="role-heading">Which of these are you about to sign?</h2>
      <DocumentChip name={props.documentName} pages={props.pages} />
      <fieldset className={styles.roles}>
        <legend className={styles.legendTitle}>
          Your situation decides which questions Gemini asks about this document.
        </legend>
        {ROLES.map((role) => (
          <RoleCard key={role} role={role} checked={props.role === role} onChoose={props.onChoose} />
        ))}
      </fieldset>
      <StepNav
        backLabel="Back"
        nextLabel={props.busy ? 'Reading the document\u2026' : 'Next: your beliefs'}
        nextDisabled={props.role === null || props.busy}
        onBack={props.onBack}
        onNext={props.onContinue}
      />
    </section>
  );
}
