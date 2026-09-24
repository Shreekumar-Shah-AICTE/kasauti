# Contributing to Kasauti

## Quality gate

Every change must pass `npm run verify` (typecheck → lint → format check → tests with coverage → build).

## Code limits (enforced by ESLint)

| Rule                  | Limit                                       |
| --------------------- | ------------------------------------------- |
| Lines per function    | ≤ 40                                        |
| Lines per file        | ≤ 250                                       |
| Cyclomatic complexity | ≤ 8                                         |
| Parameters            | ≤ 3 (use an options object)                 |
| Nesting depth         | ≤ 3                                         |
| `src/core` coverage   | 100% lines, branches, functions, statements |

Not allowed: `any`, `as` casts, non-null `!`, `@ts-ignore`, `eslint-disable`.
Every exported function gets TSDoc with its Big-O complexity.

## Architecture rule

`src/core` is pure TypeScript: no I/O, no React, no network. The model (in `src/ai`) proposes
verdicts and quotes; `src/core` verifies every quote against the document before it can be shown.
