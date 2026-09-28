---
nav_exclude: true
---

# L1 — Complete Specification, Derive-All

Ablation rung **L1 = L0 (naive) + a complete formal specification, derived holistically.**

## What this rung isolates

L0 (naive) gives the model six terse, incremental feature prompts and a one-line
README. L1 changes exactly ONE thing: instead of dribbling the work out feature by
feature, the model receives the **complete API specification up front** and a single
instruction to **derive the entire implementation from it**. No architecture rules,
no quality standards, no testing mandate, no artifact cascade. Just: here is the whole
specification, produce the whole system.

The marginal delta L1 - L0 isolates the value of **holistic, specification-driven
derivation** over incremental prompting, holding the model, flags, spec text, and
emit-discipline scaffolding constant.

## What to Build

A REST API for a social blogging platform called Conduit. The complete specification
is the `REALWORLD_API_SPEC.md` injected into your context. Use Node.js and TypeScript.
Derive the complete implementation from the specification in one pass.
