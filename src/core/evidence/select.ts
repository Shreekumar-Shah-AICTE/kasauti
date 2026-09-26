import { valueAt } from '@/core/collections';
import { extractKeywords } from '@/core/evidence/locate';
import type { Clause } from '@/core/text/clauseSplit';

/** A span of the document considered as one unit when trimming a long document. */
interface Chunk {
  readonly start: number;
  readonly end: number;
  readonly score: number;
}

/** What the model is shown for a batched check, and whether anything was left out. */
export interface ModelView {
  readonly text: string;
  readonly trimmed: boolean;
}

/** Marker placed where unrelated text was left out, so the model knows the view is partial. */
export const OMISSION_MARKER = '\n[\u2026 unrelated text omitted \u2026]\n';

const LINE = /[^\n]+/g;

function scoreText(text: string, keywords: ReadonlySet<string>): number {
  let score = 0;
  for (const word of extractKeywords(text)) {
    score += keywords.has(word) ? 1 : 0;
  }
  return score;
}

/** Numbered clauses (plus any preamble) when the document has them, otherwise its lines. */
function chunkSpans(text: string, clauses: readonly Clause[]): { start: number; end: number }[] {
  if (clauses.length === 0) {
    return [...text.matchAll(LINE)].map((match) => ({
      start: match.index,
      end: match.index + match[0].length,
    }));
  }
  const firstStart = valueAt(clauses, 0).start;
  const preamble = firstStart > 0 ? [{ start: 0, end: firstStart }] : [];
  return [...preamble, ...clauses.map((clause) => ({ start: clause.start, end: clause.end }))];
}

/** Best-scoring chunks first; ties keep document order so the choice is deterministic. */
function pickWithinBudget(chunks: readonly Chunk[], budget: number): Chunk[] {
  let used = 0;
  const picked: Chunk[] = [];
  for (const chunk of chunks.toSorted((a, b) => b.score - a.score || a.start - b.start)) {
    const size = chunk.end - chunk.start;
    if (used + size <= budget) {
      picked.push(chunk);
      used += size;
    }
  }
  return picked.toSorted((a, b) => a.start - b.start);
}

/**
 * Chooses the text the model reads for a batched check. Short documents are sent whole. A long
 * document is cut to the clauses that share the most keywords with the beliefs, then filled with
 * the remaining clauses in order until the budget is spent, so near-synonyms still have a chance.
 * Quotes are still verified against the full document, so trimming can never create evidence.
 *
 * @param input - Full text, its clauses, the belief texts and the character budget.
 * @returns The model's view of the document. Complexity: O(n + c log c) for c chunks.
 */
export function selectForModel(input: {
  readonly text: string;
  readonly clauses: readonly Clause[];
  readonly queries: readonly string[];
  readonly budget: number;
}): ModelView {
  if (input.text.length <= input.budget) {
    return { text: input.text, trimmed: false };
  }
  const keywords = extractKeywords(input.queries.join(' '));
  const chunks = chunkSpans(input.text, input.clauses).map((span) => ({
    ...span,
    score: scoreText(input.text.slice(span.start, span.end), keywords),
  }));
  return { text: joinChunks(input.text, pickWithinBudget(chunks, input.budget)), trimmed: true };
}

/** Joins chunks in order, placing the omission marker only where text was actually left out. */
function joinChunks(text: string, picked: readonly Chunk[]): string {
  let joined = '';
  let previousEnd = -1;
  for (const chunk of picked) {
    const gap = joined.length > 0 && chunk.start !== previousEnd;
    joined += (gap ? OMISSION_MARKER : '') + text.slice(chunk.start, chunk.end);
    previousEnd = chunk.end;
  }
  return joined;
}
