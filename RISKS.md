# Risks

An honest list, including the things still unfixed. Anything claimed as solved is solved in code and
tested; everything else is here.

## Known weaknesses

**The rate limiter is per instance.** It lives in memory, so on a platform running several instances
the effective limit is multiplied. It stops accidental loops, not a determined attacker. The fix is a
shared store (Redis/Upstash), deliberately not added: it would introduce a network dependency and a
second failure mode for a demo that has no abuse traffic.

**Fuzzy quote matching can accept a near-miss.** Above a 0.9 word-level similarity a quote is accepted
as evidence. A very close but materially different quote could pass. Mitigation: the match tier is
always shown, and the quote displayed is sliced from the user's own document, so a reader can see the
real words. A stricter threshold would reject legitimate quotes where the PDF mangles spacing.

**Clause numbers depend on document formatting.** Clause detection is regex-based over common Indian
and Western contract conventions (`1.`, `1.1`, `Clause 4`). An unusually formatted document yields a
page number but no clause. That degrades to less precision, never to a wrong number.

**Scanned PDFs cannot be read.** No OCR. The app detects that a PDF has no selectable text and says so
in plain words, asking the user to paste instead, rather than silently returning an empty document.

**The model can be wrong in the direction of "silent".** Code can prove a quote exists; it cannot prove
the absence of a clause. A `silent` verdict therefore requires evidence of searching (≥ 2 distinct
terms) and is presented as "your document never says", which is also the phrasing that makes it
actionable: get it in writing.

**A belief can be too vague to check.** "The terms are fair" has no answer in any document. These come
back as `needs_review`; the teach-back prompts are written to pull specific answers instead.

## Product risks

**Mistaken for legal advice.** The disclaimer appears on the home page and again in the report and the
export. The score is worded as "backed X of the Y answers your document could settle" — deliberately
not a risk rating, a safety score, or a percentage of how dangerous the contract is.

**False comfort from a clean report.** A report with every belief backed means the beliefs held were
correct, not that the document is safe. The report says this, and unasked topics are never counted.

**Jurisdiction.** Kasauti reports what the text says, not whether a clause is enforceable. Some clauses
it will correctly mark `backed` are unenforceable in some jurisdictions; saying which would be advice.

## Operational risks

| Risk                       | Handling                                                            |
| -------------------------- | ------------------------------------------------------------------- |
| Model API down or keyless  | Offline mode, banner, every finding `needs_review`                  |
| Model returns invalid JSON | Zod validation, one repair attempt, then offline mode               |
| Model call hangs           | 20 s timeout                                                        |
| Cost spike                 | At most two model calls per document; excerpt cap for probes; cache |
| Huge document              | 256 KB body cap, 60k char and 30 page caps, stated in the UI        |

## Verified by a human, not by tests

- The live Gemini model IDs (`gemini-3.5-flash-lite`, `gemini-3.8-flash`) are pinned from the
  published changelog. The app degrades safely if they are wrong, and the offline banner is the
  signal. Status is recorded in the project log.
- The PDF worker under the production CSP (`worker-src 'self' blob:`).
