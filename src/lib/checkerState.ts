import { LIMITS } from '@/core/constants';
import type { Probe, Role } from '@/core/probes/fallbackBank';
import type { BeliefInput, ResolvedFinding } from '@/core/verdict/types';
import type { Mode } from '@/lib/contracts';

/** Where the user is in the flow. */
export type Step = 'document' | 'role' | 'beliefs' | 'report';

/** One editable answer. Probe-derived drafts carry the question they answer. */
export interface BeliefDraft {
  readonly id: string;
  readonly kind: 'belief' | 'promise';
  readonly prompt: string;
  readonly text: string;
}

export interface CheckerState {
  readonly step: Step;
  readonly documentName: string;
  readonly pages: readonly string[];
  readonly role: Role | null;
  readonly probes: readonly Probe[];
  readonly drafts: readonly BeliefDraft[];
  readonly findings: readonly ResolvedFinding[];
  /**
   * Example beliefs offered by a sample document. They are suggestions the user adds with one
   * click, never pre-filled answers, so every belief that reaches the model was chosen or typed.
   */
  readonly examples: readonly BeliefInput[];
  readonly mode: Mode | null;
  readonly busy: boolean;
  readonly error: string | null;
  /** Counter behind generated promise ids, so ids stay unique across removals. */
  readonly promiseCount: number;
}

export type CheckerAction =
  | { readonly type: 'documentLoaded'; readonly name: string; readonly pages: readonly string[] }
  | {
      readonly type: 'sampleLoaded';
      readonly name: string;
      readonly pages: readonly string[];
      readonly role: Role;
      readonly beliefs: readonly BeliefInput[];
    }
  | { readonly type: 'roleChosen'; readonly role: Role }
  | { readonly type: 'probesLoaded'; readonly probes: readonly Probe[]; readonly mode: Mode }
  | { readonly type: 'draftChanged'; readonly id: string; readonly text: string }
  | { readonly type: 'promiseAdded' }
  | { readonly type: 'promiseRemoved'; readonly id: string }
  | { readonly type: 'exampleAdded'; readonly id: string }
  | { readonly type: 'checkLoaded'; readonly findings: readonly ResolvedFinding[]; readonly mode: Mode }
  | { readonly type: 'busy' }
  | { readonly type: 'failed'; readonly message: string }
  | { readonly type: 'back'; readonly step: Step }
  | { readonly type: 'restart' };

/** The empty flow, also used by "Start over". */
export const INITIAL_STATE: CheckerState = {
  step: 'document',
  documentName: '',
  pages: [],
  role: null,
  probes: [],
  drafts: [],
  findings: [],
  examples: [],
  mode: null,
  busy: false,
  error: null,
  promiseCount: 0,
};

const PROMISE_PROMPT = 'What were you told, that is not in the document?';
const EXAMPLE_PROMPT = 'Something people often believe about this document';

function exampleDraft(example: BeliefInput): BeliefDraft {
  const prompt = example.kind === 'promise' ? PROMISE_PROMPT : EXAMPLE_PROMPT;
  return { id: example.id, kind: example.kind, prompt, text: example.text };
}

function probeDrafts(probes: readonly Probe[]): BeliefDraft[] {
  return probes.map((probe) => ({ id: probe.id, kind: 'belief', prompt: probe.question, text: '' }));
}

/** Drafts that carry real text, in the shape the API expects. */
export function toBeliefs(drafts: readonly BeliefDraft[]): BeliefInput[] {
  return drafts
    .filter((draft) => draft.text.trim().length > 0)
    .slice(0, LIMITS.maxBeliefs)
    .map((draft) => ({ id: draft.id, kind: draft.kind, text: draft.text.trim() }));
}

/** Whether the user may run the check: at least one answer, and not already running. */
export function canCheck(state: CheckerState): boolean {
  return !state.busy && toBeliefs(state.drafts).length > 0;
}

const INPUT_ACTIONS = ['documentLoaded', 'sampleLoaded', 'roleChosen', 'probesLoaded'] as const;
const DRAFT_ACTIONS = ['draftChanged', 'promiseAdded', 'promiseRemoved', 'exampleAdded'] as const;

type InputAction = Extract<CheckerAction, { type: (typeof INPUT_ACTIONS)[number] }>;
type DraftAction = Extract<CheckerAction, { type: (typeof DRAFT_ACTIONS)[number] }>;
type RequestAction = Exclude<CheckerAction, InputAction | DraftAction>;

function isInputAction(action: CheckerAction): action is InputAction {
  return INPUT_ACTIONS.some((type) => type === action.type);
}

function isDraftAction(action: CheckerAction): action is DraftAction {
  return DRAFT_ACTIONS.some((type) => type === action.type);
}

function reduceInput(state: CheckerState, action: InputAction): CheckerState {
  switch (action.type) {
    case 'documentLoaded':
      return { ...INITIAL_STATE, step: 'role', documentName: action.name, pages: action.pages };
    case 'sampleLoaded':
      return {
        ...INITIAL_STATE,
        step: 'role',
        documentName: action.name,
        pages: action.pages,
        role: action.role,
        examples: action.beliefs,
      };
    case 'roleChosen':
      return { ...state, role: action.role, error: null };
    case 'probesLoaded':
      return {
        ...state,
        step: 'beliefs',
        busy: false,
        probes: action.probes,
        mode: action.mode,
        drafts: state.drafts.length > 0 ? state.drafts : probeDrafts(action.probes),
      };
  }
}

function addPromise(state: CheckerState): CheckerState {
  if (state.drafts.length >= LIMITS.maxBeliefs) {
    return state;
  }
  const count = state.promiseCount + 1;
  const draft: BeliefDraft = {
    id: `promise-${String(count)}`,
    kind: 'promise',
    prompt: PROMISE_PROMPT,
    text: '',
  };
  return { ...state, promiseCount: count, drafts: [...state.drafts, draft] };
}

function addExample(state: CheckerState, id: string): CheckerState {
  const example = state.examples.find((item) => item.id === id);
  const present = state.drafts.some((draft) => draft.id === id);
  if (example === undefined || present || state.drafts.length >= LIMITS.maxBeliefs) {
    return state;
  }
  return { ...state, drafts: [...state.drafts, exampleDraft(example)] };
}

function reduceDrafts(state: CheckerState, action: DraftAction): CheckerState {
  switch (action.type) {
    case 'draftChanged':
      return {
        ...state,
        drafts: state.drafts.map((draft) =>
          draft.id === action.id ? { ...draft, text: action.text } : draft,
        ),
      };
    case 'promiseAdded':
      return addPromise(state);
    case 'promiseRemoved':
      return { ...state, drafts: state.drafts.filter((draft) => draft.id !== action.id) };
    case 'exampleAdded':
      return addExample(state, action.id);
  }
}

/** Examples the user has not added yet, in the order the sample lists them. */
export function unusedExamples(state: CheckerState): BeliefInput[] {
  const used = new Set(state.drafts.map((draft) => draft.id));
  return state.examples.filter((example) => !used.has(example.id));
}

function reduceRequest(state: CheckerState, action: RequestAction): CheckerState {
  switch (action.type) {
    case 'busy':
      return { ...state, busy: true, error: null };
    case 'checkLoaded':
      return { ...state, step: 'report', busy: false, findings: action.findings, mode: action.mode };
    case 'failed':
      return { ...state, busy: false, error: action.message };
    case 'back':
      return { ...state, step: action.step, busy: false, error: null };
    case 'restart':
      return INITIAL_STATE;
  }
}

/**
 * The whole flow as one pure function, so every transition is testable without a browser.
 *
 * @param state - Current state.
 * @param action - What happened.
 * @returns The next state. Every action is handled by exactly one group, so there is no
 * silent fall-through to hide a missed case. Complexity: O(drafts).
 */
export function checkerReducer(state: CheckerState, action: CheckerAction): CheckerState {
  if (isInputAction(action)) {
    return reduceInput(state, action);
  }
  if (isDraftAction(action)) {
    return reduceDrafts(state, action);
  }
  return reduceRequest(state, action);
}
