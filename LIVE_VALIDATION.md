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

| Measure                                        | Result      |
| ---------------------------------------------- | ----------- |
| Cases                                          | 33          |
| Mode                                           | live        |
| Verdict matches the label                      | 33 (100.0%) |
| Quotes that could not be found in the document | 0           |
| Answers downgraded to "check this yourself"    | 0           |

By expected verdict: **backed 10/10**, **contradicted 14/14**, **silent 9/9**.

## What the suite caught, and what we changed

The first run scored 32/33. The single miss was `offer-08` — _"I am barred from joining a competitor
after I leave"_. The offer letter has a non-solicitation clause but no non-compete, so the label is
`silent`; the app answered `contradicted` and quoted the non-solicitation clause. The quote was real
and verifiable, so no fabricated evidence was ever shown, but the verdict was more confident than
the document warranted: a narrower restriction was read as answering a broader question.

The fix was a prompt rule, not a code exception: when the closest clause covers an adjacent but
different subject, the verdict must be `silent`. The re-run scored 33/33 with no regression on the
other 32 cases. The class of error matters more than the case — this is the failure mode to watch
when new document types are added.

## What the numbers do and do not say

- They measure the full deployed path: HTTP request, model call, code-side quote verification,
  verdict policy, response. Nothing is stubbed.
- Zero unverifiable quotes across 33 answers is the claim this project rests on, and it is enforced
  by code rather than by the score: any quote the app cannot find in the document is rejected before
  the user sees it (`src/core/evidence/verifyQuote.ts`).
- 33 cases over three documents is a small sample in three domains. It is evidence, not a
  guarantee, and a perfect score on it should not be read as a perfect tool.
- The suite runs live, so it also exercises the deployment, the API key and the rate limiter. A run
  exits non-zero if any confident answer is wrong or any quote is unverifiable.
- Offline behaviour is covered separately and deterministically by the eval table in
  `src/core/verdict/policy.eval.test.ts`, which feeds the policy dishonest model replies and asserts
  that code overrules them.
