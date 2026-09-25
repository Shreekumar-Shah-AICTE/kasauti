# Demo script (target: 3 min 30 s, hard limit 4 min)

Rules this script obeys: everything is **typed live on camera**, no pre-filled forms, a success case
**and** an edge case, and the GenAI moment is pointed at explicitly with its input and output on
screen. Keep the cursor visible and pause on each result.

Before recording: open the deployed URL in a clean window, check no offline banner appears on a first
run, and have the rent-agreement text below in a scratch file to copy from.

## 0:00 – 0:20 The problem

Home page on screen. Read the tagline aloud.

> "People do not misread contracts. They never read them. They sign because of what they believe and
> what they were told. Kasauti tests the belief, not the document."

Point at the three verdict names in the intro paragraph.

## 0:20 – 0:55 Live document entry (no pre-fill)

Paste this into the **Paste the document text** box, visibly, then click **Use this text**. Pause so
the clauses are readable.

```
1. Term. This leave and licence agreement is made for 11 months from 1 October 2026.
2. Licence fee. The licensee shall pay Rs. 24,000 per month on or before the 5th day.
3. Escalation. The licence fee shall increase by 10% on each renewal.
4. Security deposit. The licensee shall pay Rs. 100,000 as an interest-free security deposit. One
   month's rent shall be deducted towards painting and cleaning charges on vacating.
5. Lock-in. Neither party may terminate within the first 6 months.
6. Notice. Either party may terminate thereafter by giving 2 months' written notice.
7. Refund. The deposit shall be refunded within 45 days of vacating, after lawful deductions.
```

Say: "This is a normal Indian rent agreement. Nothing is uploaded or stored — a PDF would be read in
the browser."

## 0:55 – 1:15 Role, and the first GenAI moment

Choose **Renting a home**, click **Next: your beliefs**.

Say explicitly, while the spinner shows:

> "This is the first GenAI call. Gemini reads this document and writes the questions worth asking
> about **this** contract — not a generic checklist."

When the questions appear, read one aloud and note it references this document's own subject matter.
That proves the output is dynamic.

## 1:15 – 2:00 Teach-back, typed live

Type these answers, one per question, slowly enough to read:

- deposit question → `My full deposit of Rs. 100,000 comes back to me when I leave.`
- notice question → `I can leave any time by giving 2 months notice.`

Then click **Add something you were told** and type the verbal promise:

- `The broker said the landlord will not raise the rent next year.`

Say: "I am committing to what I believe **before** the app shows me anything. That is the point — it
can now tell me I am wrong about something I never thought to ask."

Click **Check against the document**.

## 2:00 – 3:05 The report: success and edge cases

While it loads, say: "Second and last GenAI call. Every belief goes in one batch; Gemini returns a
verdict, a quote and the terms it searched for. Then code takes over."

Walk the cards in this order and pause on each:

1. **You were right** (notice period) — point at the quote and at `Page 1, Clause 6`. Say: "That page
   and clause were computed by code from where the quote was found, not claimed by the model."
2. **The document says otherwise** (the deposit) — point at the quote about painting deductions. Say:
   "This is the belief that would have cost real money. The document contradicts it in its own
   words."
3. **The document never says** (the rent-raise promise) — the edge case the rubric asks for. Say:
   "The document cannot answer this, so the app refuses to guess. It says so, and turns it into an
   action."

Scroll to **Ask for this in writing** and read the promise item. Then **Worth asking a lawyer**.
Click **Copy report** and paste it into a notes app so the plain-text output is visible.

## 3:05 – 3:30 The differentiator

Say, over the report:

> "Why not just paste this into a general assistant? Because it will answer fluently and cannot prove
> it read the clause. Here, a quote that is not in your document is rejected before it reaches the
> screen and the verdict is downgraded to 'check this yourself'. Page and clause numbers are computed
> by code. And if the model is unreachable, the app still runs and says plainly that nothing was
> checked. It gives information, not legal advice — and it tells you what to ask a lawyer."

End on the report with the disclaimer visible.

## Optional 15 s cut-in, if under time

Show the repo: `docs/adr/0001-verify-quotes-in-code.md`, the CI workflow, and
`src/core/verdict/policy.eval.test.ts`, saying: "The claim that a fabricated quote cannot reach the
user is a test, not a promise."

## Do not

- A sample document is fine to use in the video: samples no longer pre-fill any answer. They load
  the document and offer example beliefs as chips, so the beliefs shown are still chosen on camera.
  Type at least one belief yourself, so the teach-back is visibly live.
- Do not cut away while a model call is in flight; the wait is the proof it is live.
- Do not exceed 4 minutes. Cut the optional section first, then shorten section 0:00 – 0:20.
