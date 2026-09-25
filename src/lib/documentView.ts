import { UI } from '@/core/constants';
import { joinPages } from '@/core/text/pageMap';
import type { Evidence } from '@/core/verdict/types';

/** Size of a document in the units a signer thinks in. */
export interface DocumentStats {
  readonly pages: number;
  readonly words: number;
}

/**
 * Counts pages and words so the user can confirm the right document was read.
 *
 * @param pages - Page texts.
 * @returns Page and word counts. Complexity: O(total characters).
 */
export function documentStats(pages: readonly string[]): DocumentStats {
  const words = pages
    .join(' ')
    .split(/\s+/u)
    .filter((word) => word.length > 0).length;
  return { pages: pages.length, words };
}

/**
 * A window of one page with the quoted span marked. `match` is empty when the span cannot be
 * placed, so the viewer still shows the page rather than a wrong highlight.
 */
export interface PageView {
  readonly page: number;
  readonly totalPages: number;
  readonly before: string;
  readonly match: string;
  readonly after: string;
  /** Whether text was cut from the start or end of the page to keep the passage readable. */
  readonly clippedStart: boolean;
  readonly clippedEnd: boolean;
}

/** Start of the quote within its page: the code-computed offset first, then a text search. */
function localStart(pageText: string, pageStart: number, evidence: Evidence): number {
  const fromOffset = evidence.start - pageStart;
  if (pageText.slice(fromOffset, fromOffset + evidence.text.length) === evidence.text) {
    return fromOffset;
  }
  return pageText.indexOf(evidence.text);
}

/**
 * Places verified evidence back into its page for the side-by-side viewer.
 *
 * @param pages - Page texts, exactly as sent to the check.
 * @param evidence - A verified quote with its code-computed offset and page.
 * @returns The page split around the quote, or `null` if the page does not exist.
 * Complexity: O(total characters).
 */
export function pageView(pages: readonly string[], evidence: Evidence): PageView | null {
  const index = evidence.page - 1;
  const pageText = pages[index];
  const pageStart = joinPages(pages).pageStarts[index];
  if (pageText === undefined || pageStart === undefined) {
    return null;
  }
  const start = localStart(pageText, pageStart, evidence);
  const found = start >= 0 && evidence.text.length > 0;
  const matchStart = found ? start : pageText.length;
  const matchEnd = found ? start + evidence.text.length : pageText.length;
  const windowStart = Math.max(0, matchStart - UI.contextChars);
  const windowEnd = Math.min(pageText.length, matchEnd + UI.contextChars);
  return {
    page: evidence.page,
    totalPages: pages.length,
    before: pageText.slice(found ? windowStart : 0, matchStart),
    match: pageText.slice(matchStart, matchEnd),
    after: pageText.slice(matchEnd, windowEnd),
    clippedStart: found && windowStart > 0,
    clippedEnd: windowEnd < pageText.length,
  };
}
