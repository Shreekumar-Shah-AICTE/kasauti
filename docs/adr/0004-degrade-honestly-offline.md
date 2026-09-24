# 0004 — Degrade honestly instead of failing or faking

Status: accepted

## Context

A demo depends on an API key, a quota and a third-party model. Judges may open the app after a quota
reset, on a bad network, or with the key removed. Two common responses are both bad: crash with an
error screen, or quietly return answers computed some other way and present them as checked.

The second is worse here than in most apps, because the product's value is the claim that the
document was actually consulted.

## Decision

A single `mode` of `live` or `offline` is decided server-side and returned with every response. Any
of the following selects `offline`: no API key, a model timeout, a network failure, or a reply that
fails schema validation twice (the second attempt being a repair call that echoes the validation
error back).

In offline mode the app remains fully usable: probe questions come from a deterministic bank per
situation, relevant passages are found by keyword ranking in `src/core/evidence`, and **every**
finding is `needs_review` with the reason `offline_mode`. A banner states that nothing was checked
against a model and the cards are for the user's own review.

## Consequences

- The app never shows a dead end, and never claims a verification it did not perform.
- Offline mode doubles as the failure path and the no-key local development path, so it is exercised
  constantly rather than being untested fallback code.
- It is also the signal for a wrong model ID: if the deployment answers with the offline banner while
  a key is set, the configured model names are wrong. This is the cheapest live check available.
