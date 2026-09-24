# 0006 — One command is the gate, and nothing is committed red

Status: accepted

## Context

This project was built by an AI agent across several sessions, with handoffs and at least one lost
sandbox. In that setting the expensive failures are not bugs but drift: a half-finished refactor, a
file that was never pushed, a test suite that has quietly been failing for two steps. A human
reviewer also needs one command they can trust rather than a list of things to try.

## Decision

`npm run verify` runs typecheck → ESLint with `--max-warnings 0` → Prettier check → Vitest with 100%
statement, branch, function and line coverage on `core`, `ai`, `server`, `lib` and `samples` → a
production build. It is the only gate, CI runs the identical command on every push, and no commit is
made while it is red.

Lint enforces structure, not just style: complexity ≤ 8, ≤ 250 lines per file, ≤ 40 per function,
≤ 3 parameters, depth ≤ 3, no `any`, no `as`, no non-null assertions, no `eslint-disable`, no
`console`, and no magic numbers outside `src/core/constants.ts`.

## Consequences

- The 100% threshold is a design tool more than a confidence metric: it makes untestable code fail
  the build, which is why the UI flow lives in one pure reducer and the trust policy is pure.
- Escape hatches are unavailable rather than discouraged. `eslint-disable` being banned means an
  awkward type has to be solved, as with the committed CSS-module declaration in
  `src/types/css.d.ts`.
- The cost is real: adding a branch means adding its test in the same commit. That is the intended
  trade.
- After every verified group of work the code is pushed, and correctness is re-confirmed from a clean
  clone rather than from the working sandbox.
