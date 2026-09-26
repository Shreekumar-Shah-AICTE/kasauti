'use client';

import { type ReactNode, useReducer, useState } from 'react';

import { BeliefStep } from '@/components/BeliefStep';
import styles from '@/components/checker.module.css';
import { DocumentStep } from '@/components/DocumentStep';
import { ProgressPanel } from '@/components/flow/ProgressPanel';
import { ReportStep } from '@/components/ReportStep';
import { RoleStep } from '@/components/RoleStep';
import { Stepper } from '@/components/Stepper';
import { AI, CLIENT } from '@/core/constants';
import type { Role } from '@/core/probes/fallbackBank';
import { excerptPages } from '@/core/text/excerpt';
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
import type { CheckOutcomeResponse, ProbeOutcomeResponse } from '@/lib/contracts';
import { cx } from '@/lib/cx';
import { createRequestMemo, type RequestMemo } from '@/lib/requestMemo';

type Dispatch = (action: CheckerAction) => void;

/** Per-tab memos, so sending unchanged input again costs no request. */
interface Memos {
  readonly probes: RequestMemo<ProbeOutcomeResponse>;
  readonly check: RequestMemo<CheckOutcomeResponse>;
}

function createMemos(): Memos {
  return {
    probes: createRequestMemo<ProbeOutcomeResponse>(CLIENT.memoEntries),
    check: createRequestMemo<CheckOutcomeResponse>(CLIENT.memoEntries),
  };
}

function browserFetch(input: string, init: RequestInit): Promise<Response> {
  return fetch(input, init);
}

async function loadProbes(
  dispatch: Dispatch,
  input: { readonly pages: readonly string[]; readonly role: Role },
  memos: Memos,
): Promise<void> {
  dispatch({ type: 'busy' });
  // Only the opening text is read when writing probes, so only that much is uploaded.
  const body = { role: input.role, pages: excerptPages(input.pages, AI.probeExcerptChars) };
  const result = await memos.probes(JSON.stringify(body), () => requestProbes(body, browserFetch));
  if (result.ok) {
    dispatch({ type: 'probesLoaded', probes: result.value.probes, mode: result.value.mode });
    return;
  }
  dispatch({ type: 'failed', message: result.error.message });
}

async function runCheck(dispatch: Dispatch, state: CheckerState, memos: Memos): Promise<void> {
  dispatch({ type: 'busy' });
  const body = { pages: state.pages, beliefs: toBeliefs(state.drafts) };
  const result = await memos.check(JSON.stringify(body), () => requestCheck(body, browserFetch));
  if (result.ok) {
    dispatch({ type: 'checkLoaded', findings: result.value.findings, mode: result.value.mode });
    return;
  }
  dispatch({ type: 'failed', message: result.error.message });
}

interface PaneProps {
  readonly state: CheckerState;
  readonly dispatch: Dispatch;
  readonly memos: Memos;
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

function RolePane({ state, dispatch, memos }: PaneProps): ReactNode {
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
          void loadProbes(dispatch, { pages: state.pages, role: state.role }, memos);
        }
      }}
      onBack={() => {
        dispatch({ type: 'restart' });
      }}
    />
  );
}

function BeliefPane({ state, dispatch, memos }: PaneProps): ReactNode {
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
        void runCheck(dispatch, state, memos);
      }}
      onBack={() => {
        dispatch({ type: 'back', step: 'role' });
      }}
    />
  );
}

function ReportPane({ state, dispatch }: Omit<PaneProps, 'memos'>): ReactNode {
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

function StepPane({ state, dispatch, memos }: PaneProps): ReactNode {
  switch (state.step) {
    case 'document':
      return <DocumentPane dispatch={dispatch} />;
    case 'role':
      return <RolePane state={state} dispatch={dispatch} memos={memos} />;
    case 'beliefs':
      return <BeliefPane state={state} dispatch={dispatch} memos={memos} />;
    case 'report':
      return <ReportPane state={state} dispatch={dispatch} />;
  }
}

/** The whole flow. All decisions live in `checkerReducer`; this only wires it to the DOM. */
export function CheckerApp(): ReactNode {
  const [state, dispatch] = useReducer(checkerReducer, INITIAL_STATE);
  const [memos] = useState(createMemos);
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
        <StepPane state={state} dispatch={dispatch} memos={memos} />
      </div>
    </>
  );
}
