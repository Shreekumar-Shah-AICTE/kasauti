import { describe, expect, it } from 'vitest';

import { ApiError } from '@/server/errors';
import { clientKey } from '@/server/rateLimit';
import { assertJsonBody, assertSameOrigin } from '@/server/requestGuards';

describe('request guards', () => {
  const request = (headers: Record<string, string>): Request =>
    new Request('https://kasauti.test/api/check', { method: 'POST', headers });

  it.each([
    ['no browser headers (a script)', {}],
    ['a same-origin browser call', { 'sec-fetch-site': 'same-origin', origin: 'https://kasauti.test' }],
    ['a matching forwarded host', { origin: 'https://app.example', 'x-forwarded-host': 'app.example' }],
    ['a matching host header', { origin: 'https://edge.example', host: 'edge.example' }],
  ])('allows %s', (_name, headers) => {
    expect(() => {
      assertSameOrigin(request(headers));
    }).not.toThrow();
  });

  it.each([
    ['a cross-site fetch', { 'sec-fetch-site': 'cross-site' }],
    ['a same-site subdomain', { 'sec-fetch-site': 'same-site' }],
    ['a foreign origin', { origin: 'https://evil.example' }],
    ['an unreadable origin', { origin: 'null' }],
  ])('refuses %s', (_name, headers) => {
    expect(() => {
      assertSameOrigin(request(headers));
    }).toThrow(ApiError);
  });

  it.each([
    ['application/json', true],
    ['Application/JSON; charset=utf-8', true],
    ['text/plain', false],
    ['application/x-www-form-urlencoded', false],
  ])('checks the content type %s', (type, allowed) => {
    const check = (): void => {
      assertJsonBody(request({ 'content-type': type }));
    };
    if (allowed) {
      expect(check).not.toThrow();
    } else {
      expect(check).toThrow(ApiError);
    }
  });

  it('refuses a request with no content type', () => {
    expect(() => {
      assertJsonBody(request({}));
    }).toThrow(ApiError);
  });
});

describe('clientKey privacy', () => {
  it('never keeps the raw address', () => {
    const key = clientKey(new Request('http://localhost', { headers: { 'x-real-ip': '203.0.113.7' } }));
    expect(key).not.toContain('203.0.113.7');
  });
});
