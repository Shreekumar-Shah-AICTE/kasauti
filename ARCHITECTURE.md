# Architecture

One rule shapes everything: **the model proposes, code decides.** Every layer below exists to keep
that boundary visible and testable.

## Layers

```
browser        src/components/*            four steps, no decisions of their own
  │            src/lib/checkerState.ts     the whole flow as one pure reducer
  │            src/lib/report.ts           report rows, ordered worst verdict first
  │            src/lib/documentView.ts     places a verified quote back on its page
  │            src/lib/pdf/extractPages.ts PDF text extracted on the device
  ▼
HTTP           src/app/api/{probes,check}  thin routes
  │            src/server/*                validation, rate limit, cache, headers
  ▼
AI             src/ai/*                    prompts, schemas, one repair attempt
  │                                        ── UNTRUSTED OUTPUT CROSSES HERE ──
  ▼
deterministic  src/core/evidence/*         quote verification, exact → normalized → fuzzy
core           src/core/verdict/policy.ts  the trust policy that produces final verdicts
               src/core/text/*             page map, clause split, normalization
```

Nothing in `src/core` imports from `src/ai`. The core is pure, synchronous and fully tested; it is
the part a reviewer should read first.

## The trust boundary

`resolveFinding` in `src/core/verdict/policy.ts` takes what the model proposed and decides what the
user sees:

| Model proposes                           | User sees                                          |
| ---------------------------------------- | -------------------------------------------------- |
| `backed`/`contradicted` + findable quote | that verdict, with a code-computed page and clause |
| `backed`/`contradicted` + no quote       | `needs_review` — _quote_missing_                   |
| `backed`/`contradicted` + invented quote | `needs_review` — _quote_unverified_                |
| `silent` + ≥2 distinct search terms      | `silent`                                           |
| `silent` + fewer terms                   | `needs_review` — _too_few_search_terms_            |

Quote matching is tiered: exact, then whitespace/case-normalized, then a word-level fuzzy match above
a 0.9 threshold for quotes of at least three words. The tier is shown to the user, because "found as
a close match" and "found word for word" are different claims.

## Flow

1. **Document** — paste text, upload a PDF (parsed in-browser), or pick a sample.
2. **Role** — decides which beliefs are worth probing.
3. **Beliefs** — teach-back. Answers are typed before anything is quoted back. Verbal promises are
   added here as a separate kind.
4. **Report** — verdict cards with evidence, an _ask for this in writing_ list, lawyer questions, and
   a plain-text export.

UI state is one reducer (`checkerReducer`), so every transition is tested without a browser, and the
components hold no branching logic worth testing separately.

## Cost and failure design

- At most **two** model calls per document: one to write probe questions, one batched belief check.
- One repair attempt on a schema-invalid reply, echoing the validation error back; then fallback.
- Any failure — no key, timeout, bad schema twice — switches to offline mode: a deterministic probe
  bank, keyword passages from the document, every finding `needs_review`, and a banner saying so.

## Quality gates

`npm run verify` = typecheck → ESLint (`--max-warnings 0`) → Prettier check → Vitest at 100%
statements/branches/functions/lines on core, AI, server, lib and samples → production build. CI runs
the same command. Lint enforces the structure as well as the style: complexity ≤ 8, ≤ 250 lines per
file, ≤ 40 per function, ≤ 3 parameters, depth ≤ 3, no `any`, no `as`, no non-null assertions, no
`eslint-disable`, and no magic numbers outside `src/core/constants.ts`.
