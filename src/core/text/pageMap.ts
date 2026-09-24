import { valueAt } from '@/core/collections';
import { PAGE_SEPARATOR } from '@/core/constants';

/** A document joined into one searchable string, remembering where each page starts. */
export interface PagedDocument {
  readonly text: string;
  /** Offset in `text` where each page begins, in ascending order. */
  readonly pageStarts: readonly number[];
}

/**
 * Joins page texts into one string and records page boundaries.
 *
 * @param pages - Page texts in reading order (index 0 is page 1).
 * @returns The joined text and the start offset of every page.
 * Complexity: O(total characters).
 */
export function joinPages(pages: readonly string[]): PagedDocument {
  const pageStarts: number[] = [];
  let cursor = 0;
  for (const page of pages) {
    pageStarts.push(cursor);
    cursor += page.length + PAGE_SEPARATOR.length;
  }
  return { text: pages.join(PAGE_SEPARATOR), pageStarts };
}

/**
 * Finds the 1-based page number that contains a character offset. Code computes page
 * numbers so the model can never invent one.
 *
 * @param doc - A document produced by {@link joinPages}.
 * @param offset - A character offset into `doc.text`.
 * @returns The 1-based page number; offsets before the first page resolve to page 1.
 * Complexity: O(log p) via binary search over p pages.
 */
export function pageAtOffset(doc: PagedDocument, offset: number): number {
  let low = 0;
  let high = doc.pageStarts.length - 1;
  while (low < high) {
    // Upper midpoint so the loop always shrinks when `low` moves up.
    const mid = (low + high + 1) >>> 1;
    const start = valueAt(doc.pageStarts, mid);
    if (start <= offset) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return Math.max(low, 0) + 1;
}
