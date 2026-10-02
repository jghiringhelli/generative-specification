# RND-1: failure modes under pressure (June 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | Sub-experiment 1 (prescriptive vs descriptive spec): SUPPORTED, near-definitional (treatment-targeted by construction). Sub-experiment 2 (bounded context): INVALID-DESIGN (ceiling, both 100%). Sub-experiment 3 (test-faking): NULL by floor, no hacking occurred, so verification had nothing to detect |
| Evidence tier | C/D (n = 2 to 3 per cell, no registration found) |
| Registration | None found. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\rnd-1\` (README.md, oracle\, runs\, specs\) |

## What was asked
Which GS arm suppresses (a) literal-minimum exploitation of under-specification, (b) loss of requirements in a larger spec, (c) own-test reward hacking?

## What the design could and could not detect
- Sub-experiment 1: descriptive spec 0 of 3, prescriptive 3 of 3 on a held-out oracle, with equal token cost. The prescriptive spec states the acceptance criteria the oracle checks, so "the spec that says the requirement yields the requirement" is close to definitional. It is a clean demonstration of the literal-minimum behaviour (the model resolves ambiguity to the floor), which is the informative part. The held-out oracle missed one approximation of a field that a stateless code-reading judge caught; the design's use of both instruments is a good control.
- Sub-experiment 2: a 12-requirement spec is within the model's one-shot capacity, so flat equals bounded; the experiment could not detect a bounded-context effect at that scale.
- Sub-experiment 3: with n = 2 and a model that does not hack, the verification arm had no behaviour to catch.

## What it licenses
Descriptive specifications are resolved to the literal minimum at n = 3; bounded context and independent verification were not shown to matter at this scale and model. No effect-size claim.
