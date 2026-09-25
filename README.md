# Kasauti

**Test what you believe about a legal document — before you sign it.**

Most people do not misread contracts. They never read them, and sign on the strength of what they
believe and what they were told. Kasauti checks the belief, not the document: you say what you think
it says, and every answer comes back marked against your document's own words.

_Kasauti_ (कसौटी) is the touchstone — the stone used to test whether gold is real.

## Try it in 60 seconds

1. Open the app and click **Rent agreement** under _Or try a sample_.
2. Keep the pre-selected situation and click **Next: your beliefs**.
3. The answers are pre-filled for the sample. Click **Check against the document**.
4. Read the report:
   - a **You were right** card, with the clause that backs it;
   - a **The document says otherwise** card — the deposit is not fully refundable;
   - a **The document never says** card, which becomes an _Ask for this in writing_ item.
5. Click **Copy report** and paste it anywhere. That plain-text list is the thing a user actually
   sends to a landlord, an employer, or a lawyer.

## What makes it different

**Teach-back before answers.** You commit to what you believe before the document is quoted back at
you. A tool that explains first can only ever confirm what you already assumed; this one can catch a
belief you did not know was wrong.

**The model proposes, code decides.** The model never has the last word:

- Every quote it offers is searched for in the uploaded text. A quote that cannot be found is
  **rejected**, and the verdict is downgraded to _Check this yourself_ with the reason shown.
- Page and clause numbers are computed by code from the matched offset, never taken from the model.
- Quoted text shown in the report is sliced out of your document, so it cannot be a paraphrase.
- Claiming your document is **silent** requires showing at least two distinct search terms.

This is the project's central claim, so it is tested as an evaluation table of plausible model
replies — including dishonest ones — in `src/core/verdict/policy.eval.test.ts`.

**Silence is a finding.** "Your document never mentions this" is the answer most tools cannot give,
and it is exactly what turns a verbal promise into a risk.

**It degrades honestly.** If the model is unavailable, the app still runs: standard questions for
your situation, deterministic keyword passages, and every card marked for your own review with a
banner saying so. It never silently pretends to have checked.

## Running it

```bash
npm install
GEMINI_API_KEY=your-key npm run dev   # http://localhost:3000
```

Without a key the app still works, in offline mode.

```bash
npm run verify   # typecheck → lint (0 warnings) → format → tests (100% coverage) → build
```

`npm run verify` is the only gate that matters: it is what CI runs on every push, and nothing is
committed red.

## Privacy

PDFs are parsed in your browser; only the extracted text is sent, and only when you ask for a check.
Nothing is written to a database — there is no database. Live results are held in an in-memory cache
keyed by a hash of the input, for the lifetime of the server instance.

## Documentation

| File                        | What it covers                                            |
| --------------------------- | --------------------------------------------------------- |
| `ARCHITECTURE.md`           | The layers, and why the trust boundary sits where it does |
| `docs/GENAI_ARCHITECTURE.md` | Each GenAI service and exactly where it is integrated    |
| `SECURITY.md`               | Input limits, rate limiting, CSP, what is not stored      |
| `RISKS.md`                  | Honest failure modes, including ones not yet fixed        |
| `docs/DEMO_SCRIPT.md`       | The recorded walkthrough, shot by shot                    |
| `docs/adr/`                 | Decisions that were expensive to make                     |

## Limits

Kasauti gives information, not legal advice. It reads what your document says; it cannot tell you
whether a clause is enforceable where you live. Scanned PDFs have no selectable text, so they must be
pasted in. Long documents are capped, and the cap is stated in the UI when it is hit.
