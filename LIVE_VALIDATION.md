# Live validation

Numbers below come from running `node evals/run.mjs` against the deployed app, not against a mock.
Anyone can reproduce them:

```bash
node evals/run.mjs https://kasauti-pink.vercel.app
```

The suite is 33 hand-labelled beliefs about three documents (a residential rent agreement, a
software engineering offer letter, and a freelance design contract) in `evals/cases.json`. Each
belief is written the way a person would say it, not the way the clause is written, so the model has
to do real work to match them.

## Result — 25 September 2026, `https://kasauti-pink.vercel.app`

| Measure                                        | Result     |
| ---------------------------------------------- | ---------- |
| Cases                                          | 33         |
| Mode                                           | live       |
| Verdict matches the label                      | 32 (97.0%) |
| Quotes that could not be found in the document | 0          |
| Answers downgraded to "check this yourself"    | 0          |

By expected verdict: **backed 10/10**, **contradicted 14/14**, **silent 8/9**.

## The one disagreement

`offer-08` — _"I am barred from joining a competitor after I leave"_. The offer letter has a
non-solicitation clause but no non-compete, so the label is `silent`. The app answered
`contradicted` and quoted the non-solicitation clause, i.e. it read a narrower restriction as
answering a broader question. The quote itself was real and verifiable, so no fabricated evidence
was shown, but the verdict was more confident than the document warrants. This is the sharpest
remaining weakness: distinguishing "the document restricts something adjacent" from "the document
never addresses this".

## What the numbers do and do not say

- They measure the full deployed path: HTTP request, model call, code-side quote verification,
  verdict policy, response. Nothing is stubbed.
- Zero unverifiable quotes across 33 answers is the claim this project rests on, and it is enforced
  by code rather than by the score: any quote the app cannot find in the document is rejected before
  the user sees it (`src/core/evidence/verifyQuote.ts`).
- 33 cases over three documents is a small sample in three domains. It is evidence, not a
  guarantee, and the failure above shows the shape of the errors that remain.
- The suite runs live, so it also exercises the deployment, the API key and the rate limiter. A run
  exits non-zero if any confident answer is wrong or any quote is unverifiable.
- Offline behaviour is covered separately and deterministically by the eval table in
  `src/core/verdict/policy.eval.test.ts`, which feeds the policy dishonest model replies and asserts
  that code overrules them.
