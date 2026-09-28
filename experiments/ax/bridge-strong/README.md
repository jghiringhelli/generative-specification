---
nav_exclude: true
---

# Bridge Test — Strong Shore (Conceptual Specification)

This is one of the two arms of the **bridge test**, the targeted experiment for the
paper's contribution #1 (the specification bridge and read-asymmetry). It is NOT a rung
in the build-up ladder: it holds the rung fixed (≈ L1, complete spec, derive-all, no
harness/cascade/sentinel) and varies only the **altitude of specification**.

## The contrast

Both arms specify the **same set of behaviors** with the **same information content**.
They differ only in which shore of the bridge they stand on:

- **Strong shore (this arm):** requirements stated at the **conceptual / domain level** —
  what must be true, in human terms. "The slug is derived from the title and is unique."
  "Reject expired or tampered tokens." The model must cross the bridge itself, from the
  human-conceptual statement to the code that realizes it.
- **Weak shore (`../bridge-weak`):** the **same** requirements stated at the
  **mechanical / code level** — exact signatures, pseudocode, step-by-step procedure.
  The bridge is pre-crossed by the author; the model transcribes.

## Prediction (pre-registered)

The conceptual arm achieves **equal correctness at lower cost** (fewer input tokens and
fewer tokens-per-correct-output), because the transformer is fluent on both banks and
crosses the bridge for free; paying to specify on the weak shore is expensive and
unnecessary. If it holds, the read-asymmetry is **measured, not argued** — the strongest
empirical support for contribution #1. Distinct from prescriptive-vs-descriptive (RND-1):
that varies output-space closure; this varies the shore/altitude of specification.

## What to Build

Conduit, from the complete specification, deriving all endpoints in one pass —
Node.js + TypeScript.
