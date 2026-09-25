'use client';

import { type ReactNode, useReducer } from 'react';

import { BeliefStep } from '@/components/BeliefStep';
import styles from '@/components/checker.module.css';
import { DocumentStep } from '@/components/DocumentStep';
import { ProgressPanel } from '@/components/flow/ProgressPanel';
import { ReportStep } from '@/components/ReportStep';
import { RoleStep } from '@/components/RoleStep';
import { Stepper } from '@/components/Stepper';
import type { Role } from '@/core/probes/fallbackBank';
import { requestCheck, requestProbes } from '@/lib/api';
import {
  canCheck,
  type CheckerAction,
  checkerReducer,
  type CheckerState,
  INITIAL_STATE,
  toBeliefs,
  unusedExamples,
} from '@/lib/checkerState';
import { cx } from '@/lib/cx';

type Dispatch = (action: CheckerAction) => void;

function browserFetch(input: string, init: RequestInit): Promise<Response> {
  return fetch(input, init);
}

async function loadProbes(dispatch: Dispatch, pages: readonly string[], role: Role): Promise<void> {
  dispatch({ type: 'busy' });
  const result = await requestProbes({ role, pages }, browserFetch);
  if (result.ok) {
    dispatch({ type: 'probesLoaded', probes: result.value.probes, mode: result.value.mode });
    return;
  }
  dispatch({ type: 'failed', message: result.error.message });
}

async function runCheck(dispatch: Dispatch, state: CheckerState): Promise<void> {
  dispatch({ type: 'busy' });
  const result = await requestCheck({ pages: state.pages, beliefs: toBeliefs(state.drafts) }, browserFetch);
  if (result.ok) {
    dispatch({ type: 'checkLoaded', findings: result.value.findings, mode: result.value.mode });
    return;
  }
  dispatch({ type: 'failed', message: result.error.message });
}

interface PaneProps {
  readonly state: CheckerState;
  readonly dispatch: Dispatch;
}

function DocumentPane({ dispatch }: { readonly dispatch: Dispatch }): ReactNode {
  return (
    <DocumentStep
      onDocument={(name, pages) => {
        dispatch({ type: 'documentLoaded', name, pages });
      }}
      onSample={(sample) => {
        dispatch({
          type: 'sampleLoaded',
          name: sample.title,
          pages: sample.pages,
          role: sample.role,
          beliefs: sample.beliefs,
        });
      }}
    />
  );
}

function RolePane({ state, dispatch }: PaneProps): ReactNode {
  return (
    <RoleStep
      role={state.role}
      busy={state.busy}
      documentName={state.documentName}
      pages={state.pages}
      onChoose={(role) => {
        dispatch({ type: 'roleChosen', role });
      }}
      onContinue={() => {
        if (state.role !== null) {
          void loadProbes(dispatch, state.pages, state.role);
        }
      }}
      onBack={() => {
        dispatch({ type: 'restart' });
      }}
    />
  );
}

function BeliefPane({ state, dispatch }: PaneProps): ReactNode {
  return (
    <BeliefStep
      drafts={state.drafts}
      examples={unusedExamples(state)}
      offline={state.mode === 'offline'}
      busy={state.busy}
      canCheck={canCheck(state)}
      onChange={(id, text) => {
        dispatch({ type: 'draftChanged', id, text });
      }}
      onAddPromise={() => {
        dispatch({ type: 'promiseAdded' });
      }}
      onAddExample={(id) => {
        dispatch({ type: 'exampleAdded', id });
      }}
      onRemovePromise={(id) => {
        dispatch({ type: 'promiseRemoved', id });
      }}
      onCheck={() => {
        void runCheck(dispatch, state);
      }}
      onBack={() => {
        dispatch({ type: 'back', step: 'role' });
      }}
    />
  );
}

function ReportPane({ state, dispatch }: PaneProps): ReactNode {
  return (
    <ReportStep
      findings={state.findings}
      drafts={state.drafts}
      offline={state.mode === 'offline'}
      documentName={state.documentName}
      pages={state.pages}
      onBack={() => {
        dispatch({ type: 'back', step: 'beliefs' });
      }}
      onRestart={() => {
        dispatch({ type: 'restart' });
      }}
    />
  );
}

function StepPane({ state, dispatch }: PaneProps): ReactNode {
  switch (state.step) {
    case 'document':
      return <DocumentPane dispatch={dispatch} />;
    case 'role':
      return <RolePane state={state} dispatch={dispatch} />;
    case 'beliefs':
      return <BeliefPane state={state} dispatch={dispatch} />;
    case 'report':
      return <ReportPane state={state} dispatch={dispatch} />;
  }
}

/** The whole flow. All decisions live in `checkerReducer`; this only wires it to the DOM. */
export function CheckerApp(): ReactNode {
  const [state, dispatch] = useReducer(checkerReducer, INITIAL_STATE);
  return (
    <>
      <Stepper step={state.step} />
      <div role="status">
        <ProgressPanel step={state.step} busy={state.busy} />
      </div>
      {state.error === null ? null : (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      <div className={cx(styles.stage, state.step === 'report' && styles.wide)}>
        <StepPane state={state} dispatch={dispatch} />
      </div>
    </>
  );
}
