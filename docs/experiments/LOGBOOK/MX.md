# MX: model tiering pilot (June 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | H1 and H2 (tiered pipeline matches quality at lower cost): INCONCLUSIVE (the tiered arm was never run). Quality comparison all-Opus vs all-Sonnet: INVALID-DESIGN (both at 100%, ceiling) |
| Evidence tier | C/D (design summarized in the README, "frozen"; no timestamp found; n = 1 per cell) |
| Registration | The README says the design is a frozen pre-registration kept elsewhere; no tag or commit before data was found in this repository. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\mx\` (README.md, oracle\, runs\) |

## What was asked
Does a tiered pipeline (strong planner, cheaper executors, objective evaluation, escalation) deliver the same quality at lower dollars than all-strong or all-mid?

## What the design could and could not detect
- Three phases on Conduit (auth slice, multi-resource, full). Full Conduit: all-Opus 149 of 149, all-Sonnet 149 of 149. At the ceiling, quality cannot discriminate.
- The tiered arm (C4) was judged "at planning": the planner's token count alone (37,444) exceeded the all-Sonnet build (34,768), so C4 was not completed. That is a cost observation about the planner on this task, not a test of tiering on harder tasks.
- Dollar factors are derived from a price ratio (about 5x), not from measured spend; token counts are totals without an input/output split.
- n = 1 per cell. Conduit is a memorized benchmark; a model that has seen many implementations may one-shot it for that reason.

## Questions
| Question | Result |
|---|---|
| Sonnet matches Opus on quality at lower cost | INVALID-DESIGN as a quality comparison (ceiling, n = 1, memorized task); the cost direction (about 1/5 per token) is a price fact |
| Tiering beats all-Sonnet | INCONCLUSIVE (not run past planning) |

## What it licenses
On a well-specified, memorized CRUD benchmark a mid-tier model completed the task; tiering overhead was not worth it there. No claim for harder tasks.
