# 0002 — Silence is a verdict, and it must be earned

Status: accepted

## Context

The most valuable answer Kasauti can give is "your document never says this". It is what converts a
verbal promise into something a user can act on: ask for it in writing. Most document tools cannot
say it, because they only surface passages they found.

But absence cannot be proved the way presence can. There is no offset to point at. If the model says
"silent" because it did not look properly, the user is told their contract is missing a protection
that is actually on page 4 — a worse error than a wrong `backed`.

## Decision

`silent` is a first-class verdict, and the model must show its work to claim it. Each finding carries
the terms the model searched for. A `silent` verdict is accepted only when at least two distinct
terms are present (`VERDICT_POLICY.minSilentSearchTerms`); distinctness is computed after trimming
and lowercasing, so repeating one word does not count twice. Otherwise the finding becomes
`needs_review` with the reason `too_few_search_terms`.

In offline mode nothing can be claimed silent at all: every finding is `needs_review`.

## Consequences

- Silence costs the model something, which discourages it as a lazy default answer.
- The user-facing wording is "The document never says", and each such belief plus every verbal promise
  flows into the _Ask for this in writing_ list. The verdict has an action attached.
- The check is a heuristic about diligence, not a proof of absence. `RISKS.md` says so plainly.
