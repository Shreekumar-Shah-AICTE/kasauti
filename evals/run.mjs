#!/usr/bin/env node
/**
 * Labelled evaluation of the deployed /api/check endpoint.
 *
 * Usage:  node evals/run.mjs [baseUrl]
 * Default baseUrl: https://kasauti-pink.vercel.app
 *
 * Each case is a real belief a person might hold about one of three documents, labelled by
 * hand with the verdict the document actually supports. The runner batches beliefs per
 * document (the API caps a request at 8), then scores three things separately:
 *
 *   accuracy     - verdict matches the label
 *   abstentions  - the app said "check this yourself" instead of guessing (safe, not correct)
 *   unsafe       - a confident verdict that is wrong, or evidence that is not in the document
 *
 * Unsafe answers are the number that matters: a wrong "you were right" is the failure mode
 * this project exists to prevent.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.argv[2] ?? 'https://kasauti-pink.vercel.app';
const BATCH = 8;
const PAUSE_MS = 7000;

const suite = JSON.parse(readFileSync(join(HERE, 'cases.json'), 'utf8'));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function check(pages, beliefs) {
  const response = await fetch(`${BASE}/api/check`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pages, beliefs }),
  });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

/** A quote is only trustworthy if it really appears in the document that was sent. */
function quoteIsReal(pages, evidence) {
  if (!evidence) return true;
  const haystack = pages.join('\n\n').replace(/\s+/g, ' ').toLowerCase();
  return haystack.includes(evidence.text.replace(/\s+/g, ' ').toLowerCase());
}

const rows = [];
let mode = 'unknown';

for (const [docId, doc] of Object.entries(suite.documents)) {
  const cases = suite.cases.filter((item) => item.document === docId);
  for (const batch of chunk(cases, BATCH)) {
    const beliefs = batch.map((item) => ({ id: item.id, kind: item.kind, text: item.text }));
    const result = await check(doc.pages, beliefs);
    mode = result.mode;
    for (const item of batch) {
      const finding = result.findings.find((f) => f.beliefId === item.id);
      const verdict = finding?.verdict ?? 'missing';
      const abstained = verdict === 'needs_review';
      const correct = verdict === item.expected;
      rows.push({
        id: item.id,
        document: docId,
        expected: item.expected,
        got: verdict,
        correct,
        abstained,
        evidenceReal: quoteIsReal(doc.pages, finding?.evidence),
        reviewReason: finding?.reviewReason ?? null,
      });
    }
    await sleep(PAUSE_MS);
  }
}

const decided = rows.filter((row) => !row.abstained);
const correct = rows.filter((row) => row.correct);
const unsafe = decided.filter((row) => !row.correct || !row.evidenceReal);
const pct = (n, d) => `${((n / d) * 100).toFixed(1)}%`;

const summary = {
  baseUrl: BASE,
  ranAt: new Date().toISOString(),
  mode,
  total: rows.length,
  correct: correct.length,
  abstained: rows.length - decided.length,
  unsafe: unsafe.length,
  hallucinatedQuotes: rows.filter((row) => !row.evidenceReal).length,
  accuracy: pct(correct.length, rows.length),
  accuracyWhenAnswering: decided.length
    ? pct(decided.filter((r) => r.correct).length, decided.length)
    : 'n/a',
  byExpected: Object.fromEntries(
    ['backed', 'contradicted', 'silent'].map((verdict) => {
      const subset = rows.filter((row) => row.expected === verdict);
      return [verdict, `${subset.filter((row) => row.correct).length}/${subset.length}`];
    }),
  ),
};

writeFileSync(join(HERE, 'results.json'), `${JSON.stringify({ summary, rows }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
for (const row of rows.filter((r) => !r.correct)) {
  process.stdout.write(
    `  ${row.id}: expected ${row.expected}, got ${row.got} (${row.reviewReason ?? '-'})\n`,
  );
}
process.exit(unsafe.length === 0 ? 0 : 1);
