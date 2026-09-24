import { valueAt } from '@/core/collections';

/** A numbered clause located in a document. */
export interface Clause {
  /** Human-readable label, e.g. "Clause 9" or "Clause 4.2". */
  readonly label: string;
  /** Offset where the clause heading starts. */
  readonly start: number;
  /** Offset just past the clause's last character (start of the next clause or end of text). */
  readonly end: number;
}

/**
 * Matches clause headings at the start of a line: "9.", "9)", "4.2", "Clause 9", "Section 4.2:".
 * The capture group is the clause number.
 */
const CLAUSE_HEADING = /^[ \t]*(?:(?:clause|section|article) )?(\d{1,2}(?:\.\d{1,2})*)[.):]? /gim;

/**
 * Splits document text into numbered clauses using line-leading headings.
 *
 * @param text - The full document text.
 * @returns Clauses in document order; an empty array when no headings are found.
 * Complexity: O(n) in the length of `text`.
 */
export function splitClauses(text: string): Clause[] {
  const headings = [...text.matchAll(CLAUSE_HEADING)].map((match) => ({
    label: `Clause ${valueAt(match, 1)}`,
    start: match.index,
  }));
  return headings.map((heading, index) => ({
    ...heading,
    end: headings[index + 1]?.start ?? text.length,
  }));
}

/**
 * Finds the clause containing an offset.
 *
 * @param clauses - Output of {@link splitClauses}.
 * @param offset - A character offset into the same text.
 * @returns The clause label, or `null` when the offset is outside every numbered clause.
 * Complexity: O(c) over c clauses; documents have tens of clauses, so a scan is simplest.
 */
export function clauseAtOffset(clauses: readonly Clause[], offset: number): string | null {
  const found = clauses.find((clause) => offset >= clause.start && offset < clause.end);
  return found?.label ?? null;
}
