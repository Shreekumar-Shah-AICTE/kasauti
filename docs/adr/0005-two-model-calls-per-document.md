# 0005 — At most two model calls per document

Status: accepted

## Context

The natural implementation makes one model call per belief, plus one per probe question, plus a retry
here and there. With eight beliefs that is a dozen calls for a single document: slow enough to lose
the user, expensive enough to exhaust a demo quota, and a dozen independent chances to hallucinate.

## Decision

Exactly two calls, both bounded:

1. **Probes** — one call takes the situation and a capped excerpt of the document and returns at most
   three questions worth asking about this document.
2. **Check** — one call takes every belief at once and returns one finding per belief.

A schema-invalid reply gets a single repair attempt that echoes the validation error back; a second
failure falls through to offline mode rather than looping. Each call has a 45 second timeout. Live
results are cached in memory against a hash of the input, so re-running the same sample costs
nothing.

## Consequences

- Cost and latency are predictable, and a quota cannot be drained by one enthusiastic user.
- Batching gives the model all the beliefs together, which helps it spend one clause on the right
  belief instead of stretching it across several.
- A batched reply is a bigger structured object, so schema validation and per-field length caps do
  more work; that is cheaper than a network round trip per belief.
- The verification work that makes verdicts trustworthy is deterministic and free, so quality does
  not scale with the number of model calls.
