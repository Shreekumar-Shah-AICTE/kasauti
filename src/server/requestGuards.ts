import { ApiError } from '@/server/errors';

/** `Sec-Fetch-Site` values a browser sends for requests made by this app's own pages. */
const TRUSTED_FETCH_SITES: ReadonlySet<string> = new Set(['same-origin', 'none']);

const JSON_MEDIA_TYPE = 'application/json';

function requestHosts(request: Request): Set<string> {
  const hosts = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    new URL(request.url).host,
  ];
  return new Set(hosts.filter((host): host is string => host !== null && host !== ''));
}

function originHost(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * Refuses cross-site calls to the API, so another website cannot spend this deployment's model
 * quota from a visitor's browser (a CSRF-style abuse). Browsers always send `Sec-Fetch-Site` and
 * `Origin` on cross-site POSTs; non-browser clients (the eval script, curl) send neither and are
 * still bounded by the rate limiter.
 *
 * @param request - Incoming API request.
 * @throws {ApiError} `forbidden_origin` when the request comes from another site.
 * Complexity: O(1).
 */
export function assertSameOrigin(request: Request): void {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite !== null && !TRUSTED_FETCH_SITES.has(fetchSite)) {
    throw new ApiError('forbidden_origin');
  }
  const origin = request.headers.get('origin');
  if (origin === null) {
    return;
  }
  const host = originHost(origin);
  if (host === null || !requestHosts(request).has(host)) {
    throw new ApiError('forbidden_origin');
  }
}

/**
 * Accepts only JSON bodies. This also blocks "simple" cross-site form posts, which browsers can
 * send without a preflight only as form or plain-text content types.
 *
 * @param request - Incoming API request.
 * @throws {ApiError} `unsupported_media_type` for any other content type.
 * Complexity: O(header length).
 */
export function assertJsonBody(request: Request): void {
  const mediaType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (mediaType !== JSON_MEDIA_TYPE) {
    throw new ApiError('unsupported_media_type');
  }
}
