/**
 * Text normalisation that keeps a map back to the original string, so a match found in
 * normalised text can still be highlighted at its exact position in the source document.
 */

/** Normalised text plus, for every normalised character, its offset in the original string. */
export interface NormalizedText {
  readonly text: string;
  readonly offsets: readonly number[];
}

/** Typographic characters that PDFs and models swap freely; folded to ASCII before matching. */
const CHAR_FOLDS: Readonly<Record<string, string>> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u20B9': 'rs',
};

const WORD_CHAR = /[\p{L}\p{N}]/u;

/**
 * Lower-cases, folds typographic characters, and collapses every run of whitespace or
 * punctuation into a single space. Leading and trailing separators are dropped.
 *
 * @param input - Any text, e.g. a document page or a model-supplied quote.
 * @returns The normalised text with an offset map back into `input`.
 * Complexity: O(n) time and space in the length of `input`.
 */
export function normalizeForMatch(input: string): NormalizedText {
  const chars: string[] = [];
  const offsets: number[] = [];
  let pendingSpace = false;
  for (let index = 0; index < input.length; index += 1) {
    const folded = foldChar(input.charAt(index));
    if (!WORD_CHAR.test(folded)) {
      pendingSpace = chars.length > 0;
      continue;
    }
    if (pendingSpace) {
      chars.push(' ');
      offsets.push(index);
      pendingSpace = false;
    }
    for (const char of folded) {
      chars.push(char);
      offsets.push(index);
    }
  }
  return { text: chars.join(''), offsets };
}

function foldChar(char: string): string {
  return (CHAR_FOLDS[char] ?? char).toLowerCase();
}
