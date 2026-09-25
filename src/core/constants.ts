/**
 * Named, documented limits and thresholds for the deterministic core.
 * Every number that shapes behaviour lives here so it can be reviewed in one place.
 */

/** Input caps. They bound model cost and keep every core algorithm's worst case small. */
export const LIMITS = {
  /** Maximum characters of document text accepted (about 20 dense A4 pages). */
  maxDocumentChars: 60_000,
  /** Maximum pages accepted from a PDF. */
  maxPages: 30,
  /** Maximum beliefs or promises checked in one request. */
  maxBeliefs: 8,
  /** Maximum characters in a single quote returned by the model. */
  maxQuoteChars: 600,
} as const;

/** Evidence-verification thresholds (see docs/adr/0001-verify-quotes-in-code.md). */
export const EVIDENCE = {
  /** Minimum word-level similarity for a quote to count as a fuzzy match. */
  fuzzyThreshold: 0.9,
  /** Quotes shorter than this many words are too ambiguous for fuzzy matching. */
  minFuzzyWords: 3,
} as const;

/** Separator placed between pages when a document is joined into one string. */
export const PAGE_SEPARATOR = '\n\n';

/** Verdict policy thresholds (see docs/adr/0002-silence-is-a-verdict.md). */
export const VERDICT_POLICY = {
  /** A `silent` verdict must show it searched for at least this many distinct terms. */
  minSilentSearchTerms: 2,
} as const;

/** Deterministic keyword locator settings. */
export const LOCATE = {
  /** Words shorter than this are ignored as keywords. */
  minKeywordChars: 3,
  /** Passages returned per belief in offline mode. */
  offlinePassages: 1,
} as const;

/** Model and output limits for the AI layer (see DECISIONS: models verified live). */
export const AI = {
  /** Fast, cheap model for writing probe questions. */
  probeModel: 'gemini-3.5-flash-lite',
  /** Stronger model for the single batched belief check. */
  checkModel: 'gemini-3.8-flash',
  /**
   * Model used when the check model itself is unavailable to the deployment's API key
   * (wrong tier, quota, or a retired id). Downgrading beats dropping to offline mode.
   */
  fallbackCheckModel: 'gemini-3.5-flash-lite',
  /** Hard timeout per model call. */
  timeoutMs: 20_000,
  /** Probe questions shown per document. */
  maxProbes: 3,
  /** Characters of the document sent when writing probes (the opening pages carry the key terms). */
  probeExcerptChars: 12_000,
  maxIdChars: 40,
  maxTopicChars: 60,
  maxQuestionChars: 240,
  maxTermChars: 80,
  maxSearchTerms: 10,
  maxExplanationChars: 400,
  /** Characters of a validation error echoed back in the single repair attempt. */
  maxIssueChars: 600,
  /** Characters of the invalid reply echoed back in the repair attempt. */
  maxEchoChars: 2_000,
} as const;

/** HTTP API guards (see SECURITY.md). Every limit is per server instance. */
export const SERVER = {
  /** Largest request body accepted, in bytes (the document cap plus JSON overhead). */
  maxBodyBytes: 256_000,
  /** Requests one client may burst before throttling. */
  rateLimitBurst: 10,
  /** Tokens regained per minute per client. */
  rateLimitPerMinute: 10,
  /** Distinct clients tracked before the least recently seen is evicted. */
  rateLimitMaxClients: 5_000,
  /** Live results kept in the hash-keyed cache. */
  cacheEntries: 100,
  /** Letters a belief or document needs before it counts as meaningful text (rejects gibberish like "??"). */
  minMeaningfulLetters: 3,
  /** Maximum characters in one belief or promise. */
  maxBeliefChars: 300,
} as const;

/** Report presentation limits. */
export const REPORT = {
  /** Most questions offered for a lawyer, so the list stays actionable. */
  maxQuestions: 5,
} as const;

/** Display settings for the report's side-by-side document viewer. */
export const UI = {
  /** Characters of page text shown either side of a highlighted quote. */
  contextChars: 700,
} as const;

/** HTTP status codes used by the API. */
export const HTTP_STATUS = {
  badRequest: 400,
  payloadTooLarge: 413,
  unprocessable: 422,
  tooManyRequests: 429,
  internal: 500,
} as const;

/** Milliseconds in one minute. */
export const MS_PER_MINUTE = 60_000;
