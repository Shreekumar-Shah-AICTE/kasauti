# 0001 — Verify every quote in code, not in the prompt

Status: accepted

## Context

The model is asked to quote the clause that settles each belief. A model can produce a quote that
reads perfectly and does not exist in the document. If that quote reaches the user, the product's
only real promise — "this is what your document says" — is broken, and the user cannot tell.

Prompting harder ("quote verbatim, do not paraphrase") reduces the rate. It cannot make the
guarantee.

## Decision

Every quote is searched for in the uploaded text before it can support a verdict. Matching is tiered:
exact, then whitespace/case-normalized, then word-level fuzzy above 0.9 for quotes of at least three
words. A quote that cannot be located rejects the verdict: the finding becomes `needs_review` with
the reason `quote_unverified`, and the user is told the quote could not be found.

Page and clause numbers are computed from the matched character offset. The model is never asked for
them, and a number it volunteers is ignored.

The quote rendered in the report is sliced out of the document at the matched offset, not taken from
the model's reply. Even a verified-but-trimmed quote therefore displays the document's real words.

## Consequences

- A correct verdict whose quote is mangled by PDF extraction can be downgraded to `needs_review`.
  Losing a right answer is preferable to showing an invented one.
- The guarantee is testable without calling a model. `src/core/verdict/policy.eval.test.ts` feeds the
  policy a table of plausible replies, including fabricated quotes, and asserts the user-visible
  outcome.
- The fuzzy tier is a deliberate soft spot, recorded in `RISKS.md`; the tier is always shown so the
  reader knows how the match was made.
