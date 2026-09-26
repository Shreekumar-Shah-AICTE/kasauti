import { describe, expect, it, vi } from 'vitest';

import { CLIENT, LIMITS } from '@/core/constants';
import type { BeliefInput } from '@/core/verdict/types';
import { requestCheck, requestProbes } from '@/lib/api';
import {
  type BeliefDraft,
  canCheck,
  checkerReducer,
  type CheckerState,
  INITIAL_STATE,
  toBeliefs,
  unusedExamples,
} from '@/lib/checkerState';
import { findSample, SAMPLES } from '@/samples';
import type { SampleDocument } from '@/samples/types';

const PAGES = ['Clause 8. One month rent is deducted towards painting on vacating.'];
const PROBES = [{ id: 'tenant-deposit', topic: 'Deposit', question: 'How much deposit comes back?' }];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function loaded(): CheckerState {
  return checkerReducer(INITIAL_STATE, { type: 'documentLoaded', name: 'lease.pdf', pages: PAGES });
}

function firstSample(): SampleDocument {
  const sample = SAMPLES[0];
  if (sample === undefined) {
    throw new Error('missing sample');
  }
  return sample;
}

function withSample(): CheckerState {
  const sample = firstSample();
  return checkerReducer(INITIAL_STATE, {
    type: 'sampleLoaded',
    name: sample.title,
    pages: sample.pages,
    role: sample.role,
    beliefs: sample.beliefs,
  });
}

function firstExample(): BeliefInput {
  const example = firstSample().beliefs[0];
  if (example === undefined) {
    throw new Error('missing example');
  }
  return example;
}

function withProbes(): CheckerState {
  return checkerReducer(loaded(), { type: 'probesLoaded', probes: PROBES, mode: 'live' });
}

describe('samples', () => {
  it('ships three documents that each exercise every verdict path', () => {
    expect(SAMPLES).toHaveLength(3);
    for (const sample of SAMPLES) {
      expect(sample.pages.length).toBeGreaterThan(1);
      expect(sample.beliefs.length).toBeGreaterThan(2);
      expect(sample.beliefs.some((belief) => belief.kind === 'promise')).toBe(true);
      expect(new Set(sample.beliefs.map((belief) => belief.id)).size).toBe(sample.beliefs.length);
    }
    expect(new Set(SAMPLES.map((sample) => sample.id)).size).toBe(SAMPLES.length);
  });

  it('finds a sample by id and reports unknown ids', () => {
    expect(findSample('rent-agreement')?.role).toBe('tenant');
    expect(findSample('nope')).toBeNull();
  });
});

describe('api client', () => {
  it('returns parsed probes on success', async () => {
    const result = await requestProbes({ role: 'tenant', pages: PAGES }, () =>
      Promise.resolve(jsonResponse({ mode: 'offline', probes: PROBES })),
    );
    expect(result.ok && result.value.probes[0]?.topic).toBe('Deposit');
  });

  it('sends the beliefs as JSON to the check endpoint', async () => {
    let seenPath = '';
    let seenBody = '';
    const result = await requestCheck(
      { pages: PAGES, beliefs: [{ id: 'b1', kind: 'belief', text: 'Deposit comes back' }] },
      (path, init) => {
        seenPath = path;
        seenBody = typeof init.body === 'string' ? init.body : '';
        return Promise.resolve(jsonResponse({ mode: 'live', findings: [] }));
      },
    );
    expect(seenPath).toBe('/api/check');
    expect(seenBody).toContain('Deposit comes back');
    expect(result.ok && result.value.mode).toBe('live');
  });

  it('surfaces the server error message', async () => {
    const body = { error: { code: 'rate_limited', message: 'Too many checks.', fields: [] } };
    const result = await requestProbes({ role: 'tenant', pages: PAGES }, () =>
      Promise.resolve(jsonResponse(body, 429)),
    );
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toEqual({ code: 'rate_limited', message: 'Too many checks.' });
  });

  it.each([
    ['an unrecognised error body', () => Promise.resolve(jsonResponse({ oops: true }, 500)), 'bad_response'],
    ['a non-JSON body', () => Promise.resolve(new Response('<html>', { status: 500 })), 'bad_response'],
    ['a malformed success body', () => Promise.resolve(jsonResponse({ mode: 'sideways' })), 'bad_response'],
    ['a network failure', () => Promise.reject(new Error('offline')), 'network'],
  ])('fails safely on %s', async (_name, fetcher, code) => {
    const result = await requestProbes({ role: 'tenant', pages: PAGES }, fetcher);
    expect(!result.ok && result.error.code).toBe(code);
  });

  it('gives up on a hung request instead of spinning forever', async () => {
    vi.useFakeTimers();
    try {
      const hung = (_path: string, init: RequestInit): Promise<Response> =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new Error('aborted'));
          });
        });
      const pending = requestProbes({ role: 'tenant', pages: PAGES }, hung);
      await vi.advanceTimersByTimeAsync(CLIENT.requestTimeoutMs);
      const result = await pending;
      expect(!result.ok && result.error.code).toBe('timeout');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('checkerReducer', () => {
  it('moves to the role step when a document is loaded', () => {
    const state = loaded();
    expect(state).toMatchObject({ step: 'role', documentName: 'lease.pdf', pages: PAGES });
  });

  it('offers a sample\u2019s beliefs as examples without answering for the user', () => {
    const state = withSample();
    expect(state.role).toBe('tenant');
    expect(state.examples).toHaveLength(firstSample().beliefs.length);
    expect(state.drafts).toHaveLength(0);
    expect(state.promiseCount).toBe(0);
  });

  it('adds an example once, on request, and then stops offering it', () => {
    const example = firstExample();
    const state = checkerReducer(withSample(), { type: 'exampleAdded', id: example.id });
    expect(state.drafts).toMatchObject([{ id: example.id, kind: example.kind, text: example.text }]);
    expect(state.drafts[0]?.prompt.length).toBeGreaterThan(0);
    expect(unusedExamples(state).some((item) => item.id === example.id)).toBe(false);
    expect(checkerReducer(state, { type: 'exampleAdded', id: example.id }).drafts).toHaveLength(1);
  });

  it('keeps a spoken promise a promise when it is added from an example', () => {
    const promise = firstSample().beliefs.find((belief) => belief.kind === 'promise');
    if (promise === undefined) {
      throw new Error('missing promise example');
    }
    const state = checkerReducer(withSample(), { type: 'exampleAdded', id: promise.id });
    expect(state.drafts[0]?.kind).toBe('promise');
    expect(state.drafts[0]?.prompt).toContain('told');
  });

  it('ignores an unknown example and one that would pass the belief limit', () => {
    const sampled = withSample();
    expect(checkerReducer(sampled, { type: 'exampleAdded', id: 'nope' }).drafts).toHaveLength(0);
    const full: CheckerState = {
      ...sampled,
      drafts: Array.from({ length: LIMITS.maxBeliefs }, (_value, index) => ({
        id: `filler-${String(index)}`,
        kind: 'belief' as const,
        prompt: 'q',
        text: 'a',
      })),
    };
    expect(checkerReducer(full, { type: 'exampleAdded', id: firstExample().id }).drafts).toHaveLength(
      LIMITS.maxBeliefs,
    );
  });

  it('records the chosen role', () => {
    expect(checkerReducer(loaded(), { type: 'roleChosen', role: 'employee' }).role).toBe('employee');
  });

  it('turns probes into empty drafts but keeps drafts a sample already provided', () => {
    expect(withProbes().drafts).toEqual([
      { id: 'tenant-deposit', kind: 'belief', prompt: 'How much deposit comes back?', text: '' },
    ]);
    const prefilled: CheckerState = { ...loaded(), drafts: [existingDraft()] };
    const after = checkerReducer(prefilled, { type: 'probesLoaded', probes: PROBES, mode: 'offline' });
    expect(after.drafts).toEqual([existingDraft()]);
    expect(after.mode).toBe('offline');
  });

  it('edits, adds and removes drafts', () => {
    const two: CheckerState = { ...withProbes(), drafts: [...withProbes().drafts, existingDraft()] };
    const edited = checkerReducer(two, {
      type: 'draftChanged',
      id: 'tenant-deposit',
      text: 'All of it',
    });
    expect(edited.drafts[0]?.text).toBe('All of it');
    expect(edited.drafts[1]).toEqual(existingDraft());
    const added = checkerReducer(edited, { type: 'promiseAdded' });
    expect(added.drafts).toHaveLength(3);
    expect(added.drafts[2]?.id).toBe('promise-1');
    const removed = checkerReducer(added, { type: 'promiseRemoved', id: 'promise-1' });
    expect(removed.drafts).toHaveLength(2);
  });

  it('refuses to add a ninth belief', () => {
    const full: CheckerState = { ...withProbes(), drafts: Array.from({ length: 8 }, makeDraft) };
    expect(checkerReducer(full, { type: 'promiseAdded' }).drafts).toHaveLength(8);
  });

  it('tracks the request lifecycle', () => {
    const busy = checkerReducer(withProbes(), { type: 'busy' });
    expect(busy.busy).toBe(true);
    const failed = checkerReducer(busy, { type: 'failed', message: 'Too many checks.' });
    expect(failed).toMatchObject({ busy: false, error: 'Too many checks.' });
    const done = checkerReducer(busy, { type: 'checkLoaded', findings: [], mode: 'offline' });
    expect(done).toMatchObject({ step: 'report', busy: false, mode: 'offline' });
  });

  it('goes back a step and starts over', () => {
    expect(checkerReducer(withProbes(), { type: 'back', step: 'role' }).step).toBe('role');
    expect(checkerReducer(withProbes(), { type: 'restart' })).toEqual(INITIAL_STATE);
  });
});

describe('toBeliefs and canCheck', () => {
  it('drops blank answers, trims the rest and caps at eight', () => {
    const drafts: BeliefDraft[] = [
      { id: 'a', kind: 'belief', prompt: 'p', text: '  deposit refundable  ' },
      { id: 'b', kind: 'promise', prompt: 'p', text: '   ' },
    ];
    expect(toBeliefs(drafts)).toEqual([{ id: 'a', kind: 'belief', text: 'deposit refundable' }]);
    expect(toBeliefs(Array.from({ length: 12 }, makeDraft))).toHaveLength(8);
  });

  it('allows the check only with an answer and no request in flight', () => {
    expect(canCheck(withProbes())).toBe(false);
    const ready: CheckerState = { ...withProbes(), drafts: [existingDraft()] };
    expect(canCheck(ready)).toBe(true);
    expect(canCheck({ ...ready, busy: true })).toBe(false);
  });
});

function existingDraft(): BeliefDraft {
  return { id: 'kept', kind: 'belief', prompt: 'From this sample', text: 'Deposit is refundable' };
}

function makeDraft(_value: unknown, index: number): BeliefDraft {
  return { id: `d${String(index)}`, kind: 'belief', prompt: 'p', text: `answer ${String(index)}` };
}
