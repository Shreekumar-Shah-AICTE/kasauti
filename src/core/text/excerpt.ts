/**
 * Keeps the leading pages of a document up to a character budget, cutting the last kept page.
 * The browser uses it so a probe request uploads only the text the model will read.
 *
 * @param pages - Page texts in reading order.
 * @param maxChars - Characters to keep in total.
 * @returns The leading pages, never more than `maxChars` characters. Complexity: O(pages).
 */
export function excerptPages(pages: readonly string[], maxChars: number): string[] {
  const kept: string[] = [];
  let remaining = maxChars;
  for (const page of pages) {
    if (remaining <= 0) {
      break;
    }
    kept.push(page.slice(0, remaining));
    remaining -= page.length;
  }
  return kept;
}
