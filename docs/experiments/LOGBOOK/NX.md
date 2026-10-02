# NX: N-version revival, exposure-gated (September 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | H1 (N-version catches shipped defects on subtle tasks): INVALID-DESIGN as registered (floor: no defects on 5 of 6 problems for both models). One post-hoc selected problem: INCONCLUSIVE (k = 4, mechanism signal) |
| Evidence tier | C (registration precedes the runs by 27 minutes in history); the powered contrast is D (problem chosen after seeing where exposure appeared) |
| Registration | `experiments\nx\PREREGISTRATION.md` commit `8b4577a`, 2026-09-21 14:26; frontier run `b54e673` 14:53; weak run `6529412` 15:00; powered contrast `82e6fae` 16:06. No external timestamp. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\nx\` (PREREGISTRATION.md, RESULTS.md, RESULTS-weak.md, RESULTS-powered.md, problems.cjs) |

## What was asked
When an AI writes N versions for free, does disagreement across 3 versions flag defects a single version would ship, on subtle tasks, while staying useless on trivial ones? Registered k = 3.

## What the design could and could not detect
- The "subtle" problems were within the models' single-shot competence: baseline defect rate 0% on every problem for Sonnet and on 5 of 6 for qwen 7b. With no defects there is nothing to catch, so H1 could not be tested on those problems. The registered run was k = 1 (frontier), k = 2 (weak), labelled pilot.
- The one problem with exposure (business-days-add) was singled out after the weak run, then rerun at k = 4 for both models. Selecting the problem by the outcome makes the powered contrast exploratory.
- On that problem: Sonnet 0 of 4 erroneous, qwen baseline about 8.7% with one repetition at 26%; qwen dead-version rate 44% (7 of 16), so only 2 of 4 triples were usable; where qwen's triple was majority-wrong, disagreement flagged all of those inputs with 0 false positives.
- Independence of the 3 versions is a framing proxy from one model.
- The claim "validates the revival model directionally" in RESULTS.md goes beyond data this thin; it is a single-problem pattern.

## Questions
| Question | Result |
|---|---|
| N-version catch on subtle tasks (registered H1) | INVALID-DESIGN: floor, no exposure |
| N-version dead when exposure is zero | SUPPORTED trivially (nothing to catch is the definition) |
| N-version catches when the weak model errs (business-days only) | INCONCLUSIVE, exploratory, k = 4 |

## What it licenses
A cheap practice cannot pay where the failure it targets does not occur; one edge-dense problem shows catch 1.0 when it does. Not a calibrated revival model parameter.

## Open
Harder problems with fixed difficulty tiers, the revival grid design (`C:\workspace\PragmaWorks\gs\generative-specification\experiments\revival\PREREGISTRATION.md`, 2026-09-28, grid not run as far as the files show), BACKLOG B7.
