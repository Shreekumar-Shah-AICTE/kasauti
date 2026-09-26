# Security

Kasauti handles documents people have not signed yet: rent agreements, offer letters, contracts. The
assumption throughout is that the text is sensitive and the model is untrusted.

## What is stored

Nothing, anywhere durable. There is no database and no analytics.

- PDFs are parsed **in the browser** (`src/lib/pdf/extractPages.ts`). The file itself never leaves the
  device; only extracted text is sent, and only when the user asks for a check.
- Live results are held in an in-memory LRU cache (100 entries) keyed by a hash of the input, for the
  lifetime of the server instance. It disappears when the instance does.
- Every API response is sent with `Cache-Control: no-store`.
- Document text is never written to logs. Server code does not log request bodies.

## Untrusted model output

Model replies are treated as hostile input, not as answers:

- Parsed against a Zod schema, with one repair attempt; a second failure falls back to offline mode.
- Quotes are verified against the uploaded text before they can support a verdict; unverifiable
  quotes are rejected and surfaced as _Check this yourself_ (`src/core/verdict/policy.ts`).
- Page and clause numbers are computed by code, never accepted from the model.
- Every model-provided string is length-capped before use (`AI` in `src/core/constants.ts`).
- Model text is rendered as React children only — never as HTML, and there is no `dangerouslySetInnerHTML`
  anywhere in the codebase.

## Input limits

Enforced server-side in `src/server/validateInput.ts` and `src/core/constants.ts`:

| Limit                 | Value        |
| --------------------- | ------------ |
| Request body          | 256 KB       |
| Document text         | 60,000 chars |
| Pages                 | 30           |
| Beliefs per request   | 8            |
| Characters per belief | 300          |
| Model call timeout    | 45 s         |

Oversized bodies are rejected with `413` before parsing. Invalid shapes get `422` with field names.
Gibberish (fewer than three letters of real text) is rejected rather than sent to the model.

## Cross-site abuse

The API only serves this app's own pages (`src/server/requestGuards.ts`):

- A browser request whose `Sec-Fetch-Site` is not `same-origin`, or whose `Origin` host differs from
  the request host, is refused with `403`. Another website cannot spend this deployment's model quota
  through a visitor's browser.
- Bodies must be `application/json`, otherwise `415`. That also rules out "simple" cross-site form
  posts, which browsers may send without a CORS preflight.
- No CORS headers are sent, so cross-origin scripts cannot read a response either.

## Rate limiting

A token bucket per client, keyed by a SHA-256 hash of the client IP so no raw address is held in
memory: burst of 10, refilled at 10 per minute, tracking at most 5,000 clients
with least-recently-seen eviction (`src/server/rateLimit.ts`). Over the limit returns `429`.

**This is per server instance, in memory.** On a platform that runs several instances the effective
limit is multiplied by the instance count. It protects against accidental loops and casual abuse, not
a determined attacker. See `RISKS.md`.

## Headers

Set in `src/middleware.ts` / `src/server/securityHeaders.ts`:

- `Content-Security-Policy` with a per-request nonce: `script-src 'self' 'nonce-…' 'strict-dynamic'`,
  `style-src 'self' 'nonce-…'`, `worker-src 'self' blob:` for the PDF worker, no `unsafe-inline` in
  production. Consequently the codebase contains no inline `style` attributes.
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`,
  `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin`,
  `X-Permitted-Cross-Domain-Policies: none`, `X-DNS-Prefetch-Control: off`, and a `Permissions-Policy`
  denying camera, microphone, geolocation, payment, USB, motion sensors and topics.

## Supply chain

- `package-lock.json` is committed and CI installs with `npm ci`, so every build uses the exact
  audited dependency tree. Direct dependencies are pinned to exact versions in `package.json`.
- CI fails on any high-severity advisory in production dependencies (`npm audit --omit=dev`).
- Every GitHub Action is pinned to a full commit SHA, so a moved tag cannot change what CI runs.
- CodeQL runs on every push and weekly; Dependabot proposes grouped weekly updates.

## Secrets

`GEMINI_API_KEY` is read server-side only and is never sent to the browser. Absent key = offline mode,
not a crash. No secret is committed; `.env*` is ignored.

## Reporting

Machine-readable contact: `/.well-known/security.txt` (RFC 9116).

Open an issue in this repository. Please do not include real contract text in a report.
