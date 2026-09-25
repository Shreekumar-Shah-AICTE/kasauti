import { describe, expect, it } from 'vitest';

import type { GenerateText } from '@/ai/client';
import { SERVER } from '@/core/constants';
import { createCache, hashKey } from '@/server/cache';
import { createCheckHandler, createProbesHandler, type EndpointDeps } from '@/server/endpoints';
import { ApiError, errorResponse } from '@/server/errors';
import { clientKey, createRateLimiter } from '@/server/rateLimit';
import { buildCsp, createNonce, securityHeaders } from '@/server/securityHeaders';
import { createServerDeps } from '@/server/serverDeps';
import { CheckRequestSchema, parseRequest, ProbeRequestSchema } from '@/server/validateInput';

const PAGES = ['9. Security deposit. One month rent shall be deducted towards painting on vacating.'];
const BELIEFS = [{ id: 'b1', kind: 'belief', text: 'My deposit is fully refundable' }];

function post(body: unknown, headers: Record<string, string> = {}): Request {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return new Request('http://localhost/api', { method: 'POST', body: text, headers });
}

function deps(generate: GenerateText | null, allow = true): EndpointDeps {
  return { ai: { generate, timeoutMs: 50 }, allow: () => allow };
}

describe('errorResponse', () => {
  it.each([
    ['invalid_json', 400],
    ['invalid_input', 422],
    ['payload_too_large', 413],
    ['rate_limited', 429],
    ['internal', 500],
  ] as const)('maps %s to %i with no-store', async (code, status) => {
    const response = errorResponse(new ApiError(code, ['pages']));
    expect(response.status).toBe(status);
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toMatchObject({ error: { code, fields: ['pages'] } });
  });

  it('hides unknown errors behind a generic message', async () => {
    const response = errorResponse(new Error('secret stack with GEMINI_API_KEY'));
    const text = await response.text();
    expect(response.status).toBe(500);
    expect(text).not.toContain('GEMINI_API_KEY');
  });
});

describe('parseRequest', () => {
  it('accepts a valid check body and trims beliefs', () => {
    const input = parseRequest(CheckRequestSchema, {
      pages: PAGES,
      beliefs: [{ id: 'b1', kind: 'promise', text: '  deposit refundable  ' }],
    });
    expect(input.beliefs[0]?.text).toBe('deposit refundable');
  });

  it.each([
    ['unknown role', { role: 'landlord', pages: PAGES }, 'role'],
    ['no pages', { role: 'tenant', pages: [] }, 'pages'],
    ['gibberish document', { role: 'tenant', pages: ['?? 12 !!'] }, 'pages'],
    ['oversized document', { role: 'tenant', pages: ['a'.repeat(60_001)] }, 'pages'],
    ['extra field', { role: 'tenant', pages: PAGES, admin: true }, 'body'],
    ['not an object', 'hello', 'body'],
  ])('rejects %s', (_name, body, field) => {
    expect(() => parseRequest(ProbeRequestSchema, body)).toThrow(ApiError);
    try {
      parseRequest(ProbeRequestSchema, body);
    } catch (error) {
      expect(error instanceof ApiError ? error.fields : []).toContain(field);
    }
  });

  it.each([
    ['empty belief text', [{ id: 'b1', kind: 'belief', text: '   ' }]],
    ['duplicate ids', [BELIEFS[0], BELIEFS[0]]],
    [
      'too many beliefs',
      Array.from({ length: 9 }, (_v, i) => ({ id: `b${String(i)}`, kind: 'belief', text: 'rent' })),
    ],
    ['no beliefs', []],
  ])('rejects %s', (_name, beliefs) => {
    expect(() => parseRequest(CheckRequestSchema, { pages: PAGES, beliefs })).toThrow(ApiError);
  });
});

describe('createRateLimiter', () => {
  it('allows a burst, blocks, then refills over time', () => {
    let now = 0;
    const allow = createRateLimiter({ capacity: 2, refillPerMs: 0.001, maxClients: 10, now: () => now });
    expect([allow('a'), allow('a'), allow('a')]).toEqual([true, true, false]);
    expect(allow('b')).toBe(true);
    now = 1_000;
    expect(allow('a')).toBe(true);
    expect(allow('a')).toBe(false);
  });

  it('evicts the least recently seen client to bound memory', () => {
    const allow = createRateLimiter({ capacity: 1, refillPerMs: 0, maxClients: 1, now: () => 0 });
    expect(allow('a')).toBe(true);
    expect(allow('b')).toBe(true);
    expect(allow('a')).toBe(true);
  });

  it.each([
    [{ 'x-forwarded-for': 'client-a, proxy-b' }, 'client-a'],
    [{ 'x-real-ip': ' client-c ' }, 'client-c'],
    [{ 'x-forwarded-for': ' ' }, 'anonymous'],
    [{}, 'anonymous'],
  ])('derives the client key from %o', (headers, expected) => {
    expect(clientKey(new Request('http://localhost', { headers }))).toBe(expected);
  });
});

describe('createCache', () => {
  it('returns stored values and evicts the least recently used', () => {
    const cache = createCache<number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('hashes equal input to equal keys', () => {
    expect(hashKey({ a: 1 })).toBe(hashKey({ a: 1 }));
    expect(hashKey({ a: 1 })).not.toBe(hashKey({ a: 2 }));
  });
});

describe('securityHeaders', () => {
  it('builds a strict nonce CSP in production', () => {
    const csp = buildCsp('abc', false);
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe');
  });

  it('relaxes only what the dev server needs', () => {
    expect(buildCsp('abc', true)).toContain("'unsafe-eval'");
    expect(securityHeaders('n', false)['X-Frame-Options']).toBe('DENY');
  });

  it('creates distinct nonces', () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});

describe('createServerDeps', () => {
  it.each([undefined, '', '  '])('runs offline without a key (%o)', (key) => {
    expect(createServerDeps(key).ai.generate).toBeNull();
  });

  it('creates a live generator and a working limiter with a key', () => {
    const built = createServerDeps('test-key');
    expect(typeof built.ai.generate).toBe('function');
    expect(built.allow('client')).toBe(true);
  });
});

describe('endpoints', () => {
  it('serves offline probes when no key is configured', async () => {
    const response = await createProbesHandler(deps(null))(post({ role: 'tenant', pages: PAGES }));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ mode: 'offline' });
  });

  it('never caches offline results, so a recovered model is used next time', async () => {
    let calls = 0;
    const generate: GenerateText = () => {
      calls += 1;
      return Promise.reject(new Error('quota'));
    };
    const handler = createCheckHandler(deps(generate));
    const first = await handler(post({ pages: PAGES, beliefs: BELIEFS }));
    await handler(post({ pages: PAGES, beliefs: BELIEFS }));
    await expect(first.json()).resolves.toMatchObject({ mode: 'offline', failure: 'provider_error' });
    // Two requests, each trying the check model and then the fallback model.
    expect(calls).toBe(4);
  });

  it('caches live results so repeat checks cost no model call', async () => {
    let calls = 0;
    const reply = {
      findings: [
        {
          beliefId: 'b1',
          verdict: 'contradicted',
          quote: 'One month rent shall be deducted towards painting',
          searchedTerms: ['deposit', 'refund'],
          explanation: 'Part of the deposit is kept for painting.',
        },
      ],
    };
    const generate: GenerateText = () => {
      calls += 1;
      return Promise.resolve(JSON.stringify(reply));
    };
    const handler = createCheckHandler(deps(generate));
    const first = await handler(post({ pages: PAGES, beliefs: BELIEFS }));
    await handler(post({ pages: PAGES, beliefs: BELIEFS }));
    await expect(first.json()).resolves.toMatchObject({
      mode: 'live',
      findings: [{ verdict: 'contradicted', evidence: { page: 1 } }],
    });
    expect(calls).toBe(1);
  });

  it.each([
    { name: 'rate limited', endpointDeps: deps(null, false), request: post({}), status: 429 },
    { name: 'invalid JSON', endpointDeps: deps(null), request: post('{oops'), status: 400 },
    {
      name: 'declared oversize',
      endpointDeps: deps(null),
      request: post({}, { 'content-length': String(SERVER.maxBodyBytes + 1) }),
      status: 413,
    },
    {
      name: 'actual oversize',
      endpointDeps: deps(null),
      request: post('x'.repeat(SERVER.maxBodyBytes + 1)),
      status: 413,
    },
    {
      name: 'invalid input',
      endpointDeps: deps(null),
      request: post({ pages: PAGES, beliefs: [] }),
      status: 422,
    },
  ])('responds to $name', async ({ endpointDeps, request, status }) => {
    const response = await createCheckHandler(endpointDeps)(request);
    expect(response.status).toBe(status);
  });
});
