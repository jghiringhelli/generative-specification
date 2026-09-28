---
nav_exclude: true
---

# Bridge Test — Weak Shore (Mechanical Specification)

The weak-shore arm of the **bridge test**. Same rung as `../bridge-strong` (≈ L1,
complete spec, derive-all, no harness/cascade/sentinel), same set of behaviors, same
information content — but the behaviors are specified at the **mechanical / code level**:
exact function signatures, pseudocode, and step-by-step procedure. The bridge from
human-conceptual intent to code is pre-crossed by the author; the model transcribes
rather than derives.

Prediction (pre-registered): this arm costs **more** (more input tokens, more
tokens-per-correct-output) for **equal or worse** correctness than the conceptual arm,
because specifying on the weak shore is expensive and the model did not need it. See
`../bridge-strong/README.md` for the full contrast and rationale.

## What to Build

Conduit, from the complete specification, deriving all endpoints in one pass —
Node.js + TypeScript.
