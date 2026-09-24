import { countOf, valueAt } from '@/core/collections';
import { EVIDENCE } from '@/core/constants';

/** A word in normalised text with its normalised-coordinate span. */
export interface Word {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

/** The best-matching window of document words for a quote. */
export interface FuzzyHit {
  /** Index of the first matching word. */
  readonly firstWord: number;
  /** Index of the last matching word (inclusive). */
  readonly lastWord: number;
  readonly similarity: number;
}

/**
 * Splits normalised text (single-space separated) into words with spans.
 *
 * @param text - Output of `normalizeForMatch(...).text`.
 * @returns Words in order. Complexity: O(n).
 */
export function tokenizeWords(text: string): Word[] {
  return [...text.matchAll(/\S+/g)].map((match) => ({
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
  }));
}

/**
 * Word-level similarity: 1 - (edit distance / length of the longer sequence).
 *
 * @returns A value in [0, 1]. Complexity: O(a * b) time, O(b) space.
 */
export function wordSimilarity(a: readonly string[], b: readonly string[]): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) {
    return 1;
  }
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (const [row, wordA] of a.entries()) {
    previous = nextEditRow({ previous, rowIndex: row, word: wordA }, b);
  }
  return 1 - valueAt(previous, b.length) / longest;
}

interface EditRow {
  readonly previous: readonly number[];
  readonly rowIndex: number;
  readonly word: string;
}

/** Computes one row of the Levenshtein table from the previous row. O(b). */
function nextEditRow(row: EditRow, b: readonly string[]): number[] {
  const current = [row.rowIndex + 1];
  for (const [col, wordB] of b.entries()) {
    const substitution = valueAt(row.previous, col) + (row.word === wordB ? 0 : 1);
    const insertion = valueAt(current, col) + 1;
    const deletion = valueAt(row.previous, col + 1) + 1;
    current.push(Math.min(substitution, insertion, deletion));
  }
  return current;
}

/**
 * Finds the window of document words most similar to the quote, using a rolling
 * bag-of-words overlap as a cheap filter before the exact edit-distance check.
 *
 * @param docWords - Tokenised document.
 * @param quoteWords - Tokenised quote.
 * @returns The best window at or above {@link EVIDENCE.fuzzyThreshold}, else `null`.
 * Complexity: O(n) for the filter plus O(k * m^2) for k candidate windows of m words.
 */
export function findFuzzyWindow(docWords: readonly Word[], quoteWords: readonly string[]): FuzzyHit | null {
  const size = quoteWords.length;
  if (size < EVIDENCE.minFuzzyWords || docWords.length < size) {
    return null;
  }
  const overlap = createOverlapCounter(quoteWords);
  let best: FuzzyHit | null = null;
  for (const [index, word] of docWords.entries()) {
    overlap.add(word.text);
    const first = index - size + 1;
    if (first < 0) {
      continue;
    }
    best = pickBetter(best, scoreWindow({ docWords, quoteWords, first, overlap: overlap.value() }));
    overlap.remove(valueAt(docWords, first).text);
  }
  return best;
}

interface WindowInput {
  readonly docWords: readonly Word[];
  readonly quoteWords: readonly string[];
  readonly first: number;
  readonly overlap: number;
}

function scoreWindow(input: WindowInput): FuzzyHit | null {
  const size = input.quoteWords.length;
  if (input.overlap / size < EVIDENCE.fuzzyThreshold) {
    return null;
  }
  const window = input.docWords.slice(input.first, input.first + size).map((word) => word.text);
  const similarity = wordSimilarity(window, input.quoteWords);
  if (similarity < EVIDENCE.fuzzyThreshold) {
    return null;
  }
  return { firstWord: input.first, lastWord: input.first + size - 1, similarity };
}

function pickBetter(current: FuzzyHit | null, candidate: FuzzyHit | null): FuzzyHit | null {
  if (candidate === null) {
    return current;
  }
  return current === null || candidate.similarity > current.similarity ? candidate : current;
}

interface OverlapCounter {
  add: (word: string) => void;
  remove: (word: string) => void;
  value: () => number;
}

/** Tracks how many quote words (with multiplicity) the current window contains. O(1) per update. */
function createOverlapCounter(quoteWords: readonly string[]): OverlapCounter {
  const need = new Map<string, number>();
  for (const word of quoteWords) {
    need.set(word, countOf(need, word) + 1);
  }
  const have = new Map<string, number>();
  let overlap = 0;
  return {
    add: (word) => {
      const count = countOf(have, word);
      overlap += count < countOf(need, word) ? 1 : 0;
      have.set(word, count + 1);
    },
    remove: (word) => {
      const count = countOf(have, word) - 1;
      have.set(word, count);
      overlap -= count < countOf(need, word) ? 1 : 0;
    },
    value: () => overlap,
  };
}
