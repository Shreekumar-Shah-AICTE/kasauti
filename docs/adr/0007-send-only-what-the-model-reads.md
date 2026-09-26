# 0007 — Send only what the model reads, and never send it twice

Status: accepted

## Context

A contract can be 60,000 characters. Every character sent to the model costs input tokens and
latency, and every byte uploaded from a phone on a slow connection costs the user time. The first
version uploaded the whole document for the probe request even though the server only read its
first 12,000 characters, sent every character of a long document to the check call, and asked the
server again when a user went back and re-checked beliefs they had not changed.

## Decision

1. **Probe uploads are trimmed in the browser.** `excerptPages` (`src/core/text/excerpt.ts`) keeps
   only the leading pages up to `AI.probeExcerptChars`, the same budget the server applies.
2. **Long documents are cut to the relevant clauses for the check.** `selectForModel`
   (`src/core/evidence/select.ts`) sends short documents whole. Past `AI.checkBudgetChars` it ranks
   numbered clauses (or lines) by keyword overlap with the beliefs, keeps the best first, fills the
   rest of the budget in document order, and marks each gap so the model knows the view is partial.
   Quotes are still verified against the full document, so trimming can never create evidence.
3. **Output is capped.** Every call sets `maxOutputTokens`, so a runaway reply cannot hold a
   function open until the timeout.
4. **Unchanged input is answered in the tab.** `createRequestMemo` (`src/lib/requestMemo.ts`) keeps
   the last live results per endpoint; offline results and failures are never kept.
5. **PDF pages are read concurrently** with `Promise.all`, not one page at a time.

## Consequences

- Probe requests upload at most 12,000 characters regardless of document length.
- The check prompt is bounded at 32,000 document characters, about half the input cap.
- A keyword ranker can miss a clause phrased with no shared words. The fill step keeps as much of
  the remaining document as fits, and "silent" still requires the model to list what it searched
  for, so a miss surfaces as a reviewable verdict rather than a confident wrong answer.
