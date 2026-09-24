import { REPORT } from '@/core/constants';
import {
  tallyVerdicts,
  type UnderstandingScore,
  understandingScore,
  type VerdictTally,
} from '@/core/verdict/score';
import type { ResolvedFinding, Verdict } from '@/core/verdict/types';
import type { BeliefDraft } from '@/lib/checkerState';

/** One finding paired with the answer the user actually wrote. */
export interface ReportRow {
  readonly finding: ResolvedFinding;
  readonly belief: string;
  readonly kind: 'belief' | 'promise';
}

/**
 * Something the user should ask to have written into the document: either a promise that was
 * only spoken, or a belief the document never addresses. This list is the point of the tool.
 */
export interface WritingItem {
  readonly id: string;
  readonly text: string;
  readonly reason: 'promise' | 'silent';
}

export interface Report {
  readonly rows: readonly ReportRow[];
  readonly tally: VerdictTally;
  readonly score: UnderstandingScore;
  readonly writingList: readonly WritingItem[];
  readonly questions: readonly string[];
}

/** Plain-text verdict labels, used for the clipboard export. */
const VERDICT_TEXT: Readonly<Record<Verdict, string>> = {
  backed: 'Backed by the document',
  contradicted: 'Contradicted by the document',
  silent: 'The document is silent',
  needs_review: 'Needs your own review',
};

function toRows(findings: readonly ResolvedFinding[], drafts: readonly BeliefDraft[]): ReportRow[] {
  const byId = new Map(drafts.map((draft) => [draft.id, draft]));
  return findings.map((finding) => {
    const draft = byId.get(finding.beliefId);
    if (draft === undefined) {
      return { finding, belief: finding.beliefId, kind: 'belief' };
    }
    return { finding, belief: draft.text.trim(), kind: draft.kind };
  });
}

function toWritingItem(row: ReportRow): WritingItem | null {
  if (row.kind === 'promise') {
    return { id: row.finding.beliefId, text: row.belief, reason: 'promise' };
  }
  if (row.finding.verdict === 'silent') {
    return { id: row.finding.beliefId, text: row.belief, reason: 'silent' };
  }
  return null;
}

function toQuestion(row: ReportRow): string | null {
  const clause = row.finding.evidence?.clause ?? null;
  if (row.finding.verdict === 'contradicted') {
    const where = clause === null ? 'that clause' : `clause ${clause}`;
    return `The document says the opposite of “${row.belief}”. Can ${where} be changed before I sign?`;
  }
  if (row.finding.verdict === 'needs_review') {
    return `I could not confirm what the document says about “${row.belief}”. What does it actually mean here?`;
  }
  return null;
}

/**
 * Turns raw findings into everything the report screen shows.
 *
 * @param findings - Resolved findings from the API.
 * @param drafts - The answers the user wrote, used to show beliefs in their own words.
 * @returns The assembled report. Complexity: O(findings).
 */
export function buildReport(findings: readonly ResolvedFinding[], drafts: readonly BeliefDraft[]): Report {
  const rows = toRows(findings, drafts);
  const tally = tallyVerdicts(findings);
  return {
    rows,
    tally,
    score: understandingScore(tally),
    writingList: rows.map(toWritingItem).filter((item): item is WritingItem => item !== null),
    questions: rows
      .map(toQuestion)
      .filter((question): question is string => question !== null)
      .slice(0, REPORT.maxQuestions),
  };
}

function rowLines(row: ReportRow): string[] {
  const lines = [`${VERDICT_TEXT[row.finding.verdict]}: ${row.belief}`, `  ${row.finding.explanation}`];
  const evidence = row.finding.evidence;
  if (evidence !== null) {
    lines.push(`  Page ${String(evidence.page)}: “${evidence.text}”`);
  }
  return [...lines, ''];
}

function listLines(title: string, items: readonly string[]): string[] {
  if (items.length === 0) {
    return [];
  }
  return [title, ...items.map((item) => `- ${item}`), ''];
}

/**
 * Renders the report as plain text for copying or printing. Plain text is deliberate: it
 * pastes into an email to a landlord, an employer or a lawyer without losing anything.
 *
 * @param report - Output of {@link buildReport}.
 * @returns The report as text. Complexity: O(total characters).
 */
export function exportText(report: Report): string {
  const header = [
    'Kasauti — what the document actually says',
    `You were right on ${String(report.score.correct)} of ${String(report.score.assessed)} beliefs the document could answer.`,
    '',
  ];
  const body = report.rows.flatMap(rowLines);
  const writing = listLines(
    'Get this in writing:',
    report.writingList.map((item) => item.text),
  );
  const questions = listLines('Questions for a lawyer:', report.questions);
  return [...header, ...body, ...writing, ...questions, 'Kasauti gives information, not legal advice.'].join(
    '\n',
  );
}
