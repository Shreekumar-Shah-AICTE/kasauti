/** Request header that carries the per-request CSP nonce to the renderer. */
export const NONCE_HEADER = 'x-nonce';

/** Every security header the app sets, by name. */
export type SecurityHeaderName =
  | 'Content-Security-Policy'
  | 'Strict-Transport-Security'
  | 'X-Content-Type-Options'
  | 'X-Frame-Options'
  | 'Referrer-Policy'
  | 'Permissions-Policy'
  | 'Cross-Origin-Opener-Policy'
  | 'Cross-Origin-Resource-Policy';

export type SecurityHeaders = Readonly<Record<SecurityHeaderName, string>>;

/**
 * Builds a strict, nonce-based Content Security Policy. Development adds only what the
 * Next.js dev server needs (eval for fast refresh, inline styles for the overlay).
 *
 * @param nonce - Fresh per-request nonce.
 * @param isDev - Whether the dev server is running.
 * @returns The policy string. Complexity: O(1).
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const devScript = isDev ? " 'unsafe-eval'" : '';
  const style = isDev ? "'self' 'unsafe-inline'" : `'self' 'nonce-${nonce}'`;
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devScript}`,
    `style-src ${style}`,
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

/**
 * All response security headers for one request.
 *
 * @param nonce - Fresh per-request nonce.
 * @param isDev - Whether the dev server is running.
 * @returns Header name → value. Complexity: O(1).
 */
export function securityHeaders(nonce: string, isDev: boolean): SecurityHeaders {
  return {
    'Content-Security-Policy': buildCsp(nonce, isDev),
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

/**
 * Creates an unguessable nonce using the Web Crypto API (available in the edge runtime).
 *
 * @returns A base64 nonce. Complexity: O(1).
 */
export function createNonce(): string {
  return btoa(crypto.randomUUID());
}
