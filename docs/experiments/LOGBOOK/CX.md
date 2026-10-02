# CX: patchability on two quality tiers (April 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | INVALID-DESIGN: pass rate 5 of 5 vs 5 of 5 (ceiling); three of five tasks described a bug absent from both codebases |
| Evidence tier | C |
| Registration | None found. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cx\` (README.md, tasks\, results\COMPARATIVE-ANALYSIS.md) |

## What was asked
Is a GS-specified Conduit (rubric 13/14) more patchable than a community Conduit (rubric 7/14) on five SWE-bench-style patch tasks (gate: compiles and relevant tests pass)?

## What the design could and could not detect
- COMPARATIVE-ANALYSIS.md records "Bug absent both" for CX-1, CX-2 and CX-3: those tasks were not applicable to either codebase. Only CX-4 and CX-5 required real patches. Five tasks, all passed in both, with three vacuous: a ceiling that could not discriminate and cannot support equivalence either.
- One model, one benchmark (memorized), pass/fail only. Where patches land and type-enforced correctness are qualitative observations.
- The comparison also differs in more than quality (stack, size, test count); the two tiers are not matched twins.

## What it licenses
Nothing about patchability advantage or equivalence. The file's own conclusion, that both are patchable by a capable engineer, is what the data show.

## Open
Matched twins with seeded defects present in both, hidden oracle: BACKLOG B6 (twin-study family).
