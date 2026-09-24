import { LOCATE } from '@/core/constants';

/** A span of the original text ranked by keyword overlap with a query. */
export interface Passage {
  readonly start: number;
  readonly end: number;
  readonly score: number;
}

/** Common English words that carry no signal for locating a clause. */
const STOPWORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'this',
  'with',
  'you',
  'your',
  'are',
  'was',
  'will',
  'can',
  'any',
  'have',
  'has',
  'not',
  'but',
  'from',
  'they',
  'said',
  'what',
  'when',
  'shall',
  'who',
  'all',
]);

/** Sentence-like spans: runs of text between full stops, semicolons and line breaks. */
const SPAN = /[^.;\n]+/g;
const WORD = /[\p{L}\p{N}]+/gu;

/**
 * Extracts distinct, meaningful lower-case keywords.
 *
 * @param text - Any text.
 * @returns Keywords of at least `LOCATE.minKeywordChars` characters, stopwords removed. Complexity: O(n).
 */
export function extractKeywords(text: string): Set<string> {
  const words = text.toLowerCase().match(WORD) ?? [];
  return new Set(words.filter((word) => word.length >= LOCATE.minKeywordChars && !STOPWORDS.has(word)));
}

function scoreSpan(span: string, keywords: ReadonlySet<string>): number {
  let score = 0;
  for (const word of extractKeywords(span)) {
    if (keywords.has(word)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Ranks the document's sentence-like spans by keyword overlap with a query. Used for
 * offline mode and to pre-select relevant chunks for long documents. Deterministic.
 *
 * @param text - The full document text.
 * @param query - A belief, promise or question.
 * @param limit - Maximum passages to return.
 * @returns Passages with score > 0, best first (ties keep document order). Complexity: O(n + s log s).
 */
export function rankPassages(text: string, query: string, limit: number): Passage[] {
  const keywords = extractKeywords(query);
  const passages: Passage[] = [];
  for (const match of text.matchAll(SPAN)) {
    const score = scoreSpan(match[0], keywords);
    if (score > 0) {
      passages.push({ start: match.index, end: match.index + match[0].length, score });
    }
  }
  return passages.toSorted((a, b) => b.score - a.score || a.start - b.start).slice(0, limit);
}
