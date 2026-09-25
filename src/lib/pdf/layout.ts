/**
 * A vertical jump of more than this many line heights between two text fragments is read as a
 * paragraph break. Ordinary line wraps move down about 1.2 line heights, so 1.5 separates the two
 * without needing font metrics.
 */
const PARAGRAPH_GAP_LINES = 1.5;

/**
 * Index of the y translation inside a pdf.js text item's affine `transform` matrix
 * `[a, b, c, d, e, f]`, where `f` is the text baseline's y coordinate on the page.
 */
const TRANSFORM_Y_INDEX = 5;

/** The parts of a pdf.js text item that layout needs. */
interface PositionedText {
  readonly str: string;
  readonly y: number;
  readonly height: number;
}

function numberAt(values: unknown, index: number): number {
  const list: unknown[] = Array.isArray(values) ? values : [];
  const value = list[index];
  return typeof value === 'number' ? value : 0;
}

/** Narrows an untyped pdf.js item; `transform[5]` is the baseline's y coordinate. */
function toPositioned(item: unknown): PositionedText | null {
  if (typeof item !== 'object' || item === null || !('str' in item)) {
    return null;
  }
  const transform = 'transform' in item ? item.transform : null;
  const height = 'height' in item && typeof item.height === 'number' ? item.height : 0;
  return { str: String(item.str), y: numberAt(transform, TRANSFORM_Y_INDEX), height };
}

function separator(previous: PositionedText | null, next: PositionedText): string {
  if (previous === null) {
    return '';
  }
  const lineHeight = Math.max(previous.height, next.height);
  const jump = Math.abs(previous.y - next.y);
  return lineHeight > 0 && jump > lineHeight * PARAGRAPH_GAP_LINES ? '\n\n' : ' ';
}

/**
 * Joins one page's pdf.js text items into plain text, keeping paragraph breaks.
 *
 * Clause detection anchors on headings at the start of a line ("8. Deductions."), so a page
 * flattened to one line would attribute every quote to the page's first clause.
 *
 * @param items - `getTextContent().items` for one page; unknown shapes are ignored.
 * @returns The page text with blank lines between paragraphs. Complexity: O(n) in the items.
 */
export function itemsToText(items: readonly unknown[]): string {
  const parts: string[] = [];
  let previous: PositionedText | null = null;
  for (const item of items) {
    const text = toPositioned(item);
    if (text === null || text.str.trim().length === 0) {
      continue;
    }
    parts.push(separator(previous, text), text.str);
    previous = text;
  }
  return parts
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();
}
