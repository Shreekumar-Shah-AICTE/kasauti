# GenAI architecture

Which GenAI services Kasauti uses, and the exact place each one is integrated.

## Services used

| Service                                    | Where it is integrated                                                   | What it is asked for                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Google Gemini (`gemini-3.5-flash-lite`)    | `src/ai/service.ts` → `POST /api/probes` (`src/app/api/probes/route.ts`) | Up to 3 questions worth asking about **this** document, for **this** role  |
| Google Gemini (`gemini-3.8-flash`)         | `src/ai/service.ts` → `POST /api/check` (`src/app/api/check/route.ts`)   | One finding per belief: verdict, verbatim quote, search terms, explanation |
| Google Gen AI SDK (`@google/genai` 2.24.0) | `src/ai/gemini.ts`                                                       | The only transport to the model; server-side only                          |
| Vercel (deployment)                        | —                                                                        | Hosting the Next.js app and its route handlers                             |

The API key is read server-side only, from `GEMINI_API_KEY`. It is never sent to the browser, and the
browser never calls Google directly — both model calls happen inside route handlers.

## Where GenAI sits in the flow

```
step 1  document        no model call (PDF parsed in the browser)
step 2  role       ──▶  MODEL CALL 1  gemini-3.5-flash-lite   src/ai/prompts.ts:probePrompt
                        in:  role + capped document excerpt
                        out: up to 3 questions  → validated by src/ai/schemas.ts
step 3  beliefs         no model call (the user types)
step 3→4 check     ──▶  MODEL CALL 2  gemini-3.8-flash        src/ai/prompts.ts:checkPrompt
                        in:  all beliefs at once + the document
                        out: one finding per belief → validated by src/ai/schemas.ts
                             │
                             ▼  src/core/verdict/policy.ts  (no AI here)
                        quote verified against the document, page/clause computed,
                        unverifiable claims downgraded to needs_review
step 4  report          no model call
```

Exactly two model calls per document, whatever its size or belief count. See
`docs/adr/0005-two-model-calls-per-document.md`.

## What the model decides, and what it does not

The model proposes; deterministic code decides. This is the project's defining property.

| Decision                                | Made by                                               |
| --------------------------------------- | ----------------------------------------------------- |
| Which questions to ask                  | model (`gemini-3.5-flash-lite`)                       |
| Proposed verdict per belief             | model (`gemini-3.8-flash`)                            |
| Candidate quote                         | model, then **verified** against the document by code |
| Whether that quote actually exists      | code (`src/core/evidence/verifyQuote.ts`)             |
| Page number and clause label            | code (`src/core/text/pageMap.ts`, `clauseSplit.ts`)   |
| Final verdict shown to the user         | code (`src/core/verdict/policy.ts`)                   |
| Whether "the document never says" holds | code (≥ 2 distinct search terms required)             |
| Text of the quote rendered              | code (sliced from the user's document)                |

## Reliability

- Structured output is validated with Zod (`src/ai/schemas.ts`); every model string is length-capped
  from `AI` in `src/core/constants.ts`.
- One repair attempt echoes the validation error back to the model (`src/ai/repair.ts`).
- A second failure, a 45 second timeout, or a missing key switches the response to `mode: "offline"`:
  a deterministic question bank and keyword passages, with every finding marked `needs_review` and a
  banner telling the user nothing was model-checked. See `docs/adr/0004-degrade-honestly-offline.md`.

## Why not just paste the document into a general assistant

A general assistant will answer fluently and cannot prove it read the clause. Kasauti's answers are
constrained by the document: an invented quote is rejected before it reaches the screen, page and
clause numbers are computed rather than claimed, and "your document never says this" is a real,
earned verdict that turns into an _ask for this in writing_ list. It also asks the user what they
believe **first**, so it can contradict a belief the user never thought to question — something a
summary can never do.
