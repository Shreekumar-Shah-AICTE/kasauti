import { describe, expect, it, vi } from 'vitest';

import type { ApiResult } from '@/lib/api';
import { createRequestMemo } from '@/lib/requestMemo';

interface Outcome {
  readonly mode: 'live' | 'offline';
  readonly n: number;
}

const live = (n: number): ApiResult<Outcome> => ({ ok: true, value: { mode: 'live', n } });

describe('createRequestMemo', () => {
  it('reuses a live result for the same key', async () => {
    const memo = createRequestMemo<Outcome>(2);
    const run = vi.fn(() => Promise.resolve(live(1)));
    await memo('a', run);
    expect(await memo('a', run)).toEqual(live(1));
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('never keeps offline results or failures, so a retry can reach the model', async () => {
    const memo = createRequestMemo<Outcome>(2);
    const offline: ApiResult<Outcome> = { ok: true, value: { mode: 'offline', n: 0 } };
    const failed: ApiResult<Outcome> = { ok: false, error: { code: 'network', message: 'x' } };
    const run = vi.fn<() => Promise<ApiResult<Outcome>>>();
    run.mockResolvedValueOnce(offline).mockResolvedValueOnce(failed).mockResolvedValueOnce(live(2));
    await memo('a', run);
    await memo('a', run);
    expect(await memo('a', run)).toEqual(live(2));
    expect(run).toHaveBeenCalledTimes(3);
  });

  it('drops the oldest entry once full', async () => {
    const memo = createRequestMemo<Outcome>(1);
    const run = vi.fn((n: number) => Promise.resolve(live(n)));
    await memo('a', () => run(1));
    await memo('b', () => run(2));
    await memo('a', () => run(3));
    expect(run).toHaveBeenCalledTimes(3);
  });
});
