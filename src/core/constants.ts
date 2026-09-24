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
