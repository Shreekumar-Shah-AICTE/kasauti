import { HTTP_STATUS } from '@/core/constants';

/** Client-safe error codes. Each maps to a fixed message so internals never leak. */
export type ApiErrorCode =
  'invalid_json' | 'invalid_input' | 'payload_too_large' | 'rate_limited' | 'internal';

interface ErrorDetail {
  readonly status: number;
  readonly message: string;
}

const DETAILS: Readonly<Record<ApiErrorCode, ErrorDetail>> = {
  invalid_json: {
    status: HTTP_STATUS.badRequest,
    message: 'The request could not be read. Please try again.',
  },
  invalid_input: {
    status: HTTP_STATUS.unprocessable,
    message: 'Some input is missing, too short or too long. Check the highlighted fields.',
  },
  payload_too_large: {
    status: HTTP_STATUS.payloadTooLarge,
    message: 'This document is too large. Paste the most relevant pages instead.',
  },
  rate_limited: {
    status: HTTP_STATUS.tooManyRequests,
    message: 'Too many checks in a short time. Please wait a minute and try again.',
  },
  internal: {
    status: HTTP_STATUS.internal,
    message: 'Something went wrong on our side. Your document was not stored.',
  },
};

/** Headers for every API response: results are personal, so proxies must never cache them. */
export const NO_STORE: Readonly<Record<string, string>> = { 'Cache-Control': 'no-store' };

/** Typed error raised inside request handlers and converted to a sanitised response. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  /** Dotted paths of the invalid fields (names only, never the submitted values). */
  readonly fields: readonly string[];

  constructor(code: ApiErrorCode, fields: readonly string[] = []) {
    super(code);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Converts any thrown value into a JSON error response with a fixed, user-friendly message.
 * Unknown errors become `internal`, so stack traces, keys and document text never reach the client.
 *
 * @param error - Anything caught by a handler.
 * @returns A sanitised `Response`. Complexity: O(1).
 */
export function errorResponse(error: unknown): Response {
  const apiError = error instanceof ApiError ? error : new ApiError('internal');
  const detail = DETAILS[apiError.code];
  return Response.json(
    { error: { code: apiError.code, message: detail.message, fields: apiError.fields } },
    { status: detail.status, headers: NO_STORE },
  );
}
