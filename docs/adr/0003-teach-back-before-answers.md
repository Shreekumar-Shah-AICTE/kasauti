# 0003 — Ask what the user believes before showing them anything

Status: accepted

## Context

The obvious product is a summariser: upload a contract, get an explanation. Every such tool shares a
flaw. A user who already believes the deposit is refundable reads a summary that never mentions the
deposit and walks away with the belief intact and now confirmed. The dangerous beliefs are precisely
the ones the user does not think to ask about.

## Decision

The flow inverts. Before any document text is shown back to the user, they answer in their own words
what they think the document says, plus anything they were told verbally that they expect to be in
it. Only then is the document consulted, belief by belief.

The questions are generated from the document and the user's situation, so they hit the clauses that
actually matter in that document rather than a generic checklist.

Verbal promises are recorded as a distinct kind of input, because they are not beliefs about the text
— they are claims to be tested against it, and they are the most common source of a `silent` verdict.

## Consequences

- A user can be told they were wrong, which is the entire point and the only way this product adds
  information rather than reassurance.
- Typing costs effort, so the flow stays short: samples pre-fill the beliefs so a reviewer can reach
  a report in well under a minute.
- The score is worded as beliefs the document could settle, never as a safety rating of the contract.
  Unasked topics are never counted, so a clean report cannot masquerade as a clean contract.
