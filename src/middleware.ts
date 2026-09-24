import { NextResponse } from 'next/server';

import { createNonce, NONCE_HEADER, securityHeaders } from '@/server/securityHeaders';

/** Applies a fresh CSP nonce and the full security-header set to every page and API response. */
export function middleware(request: Request): NextResponse {
  const nonce = createNonce();
  const headers = securityHeaders(nonce, process.env.NODE_ENV === 'development');
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER, nonce);
  requestHeaders.set('Content-Security-Policy', headers['Content-Security-Policy']);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [name, value] of Object.entries(headers)) {
    response.headers.set(name, value);
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|llms.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
