import { valueAt } from '@/core/collections';
import { LIMITS } from '@/core/constants';
import { findFuzzyWindow, tokenizeWords, type Word } from '@/core/evidence/fuzzy';
import { type NormalizedText, normalizeForMatch } from '@/core/text/normalize';

/** How strongly a quote was matched to the document, from strongest to none. */
export type EvidenceTier = 'exact' | 'normalized' | 'fuzzy' | 'unverified';

/** Result of verifying one quote. Spans are offsets into the original document text. */
export type QuoteMatch =
  | {
      readonly tier: 'exact' | 'normalized' | 'fuzzy';
      readonly start: number;
      readonly end: number;
      readonly similarity: number;
    }
  | { readonly tier: 'unverified' };

/** A document pre-processed once so many quotes can be verified cheaply. */
export interface IndexedDocument {
  readonly raw: string;
  readonly normalized: NormalizedText;
  readonly words: readonly Word[];
}

const UNVERIFIED: QuoteMatch = { tier: 'unverified' };
const EDGE_CHARS = new Set([' ', '\t', '\n', '\r', '.', '\u2026']);

/** Strips whitespace and ellipses models add around partial quotes. Linear, no regex backtracking. */
function trimQuoteEdges(quote: string): string {
  let start = 0;
  let end = quote.length;
  while (start < end && EDGE_CHARS.has(quote.charAt(start))) {
    start += 1;
  }
  while (end > start && EDGE_CHARS.has(quote.charAt(end - 1))) {
    end -= 1;
  }
  return quote.slice(start, end);
}

/**
 * Normalises and tokenises a document once.
 *
 * @param raw - Full document text (see `joinPages`).
 * @returns The indexed document. Complexity: O(n).
 */
export function indexDocument(raw: string): IndexedDocument {
  const normalized = normalizeForMatch(raw);
  return { raw, normalized, words: tokenizeWords(normalized.text) };
}

/**
 * Verifies that a model-supplied quote really appears in the document. Tiers are tried in
 * order: exact → normalized (case, punctuation, whitespace) → fuzzy (≥ 0.9 word similarity).
 * The model never marks its own evidence as verified; this function does.
 *
 * @param doc - Output of {@link indexDocument}.
 * @param quote - The quote to find.
 * @returns The strongest match with its original-text span, or `{ tier: 'unverified' }`.
 * Complexity: O(n) for exact/normalized; see `findFuzzyWindow` for the fuzzy tier.
 */
export function verifyQuote(doc: IndexedDocument, quote: string): QuoteMatch {
  const trimmed = trimQuoteEdges(quote);
  if (trimmed.length === 0 || trimmed.length > LIMITS.maxQuoteChars) {
    return UNVERIFIED;
  }
  const exact = doc.raw.indexOf(trimmed);
  if (exact >= 0) {
    return { tier: 'exact', start: exact, end: exact + trimmed.length, similarity: 1 };
  }
  const needle = normalizeForMatch(trimmed).text;
  const normalizedAt = doc.normalized.text.indexOf(needle);
  if (needle.length > 0 && normalizedAt >= 0) {
    return {
      tier: 'normalized',
      ...toOriginalSpan(doc, normalizedAt, normalizedAt + needle.length),
      similarity: 1,
    };
  }
  return verifyFuzzy(doc, needle);
}

function verifyFuzzy(doc: IndexedDocument, needle: string): QuoteMatch {
  const hit = findFuzzyWindow(
    doc.words,
    tokenizeWords(needle).map((word) => word.text),
  );
  if (hit === null) {
    return UNVERIFIED;
  }
  const span = toOriginalSpan(
    doc,
    valueAt(doc.words, hit.firstWord).start,
    valueAt(doc.words, hit.lastWord).end,
  );
  return { tier: 'fuzzy', ...span, similarity: hit.similarity };
}

/** Maps a normalised [start, end) span back to original-text offsets. */
function toOriginalSpan(doc: IndexedDocument, start: number, end: number): { start: number; end: number } {
  const offsets = doc.normalized.offsets;
  return { start: valueAt(offsets, start), end: valueAt(offsets, end - 1) + 1 };
}
