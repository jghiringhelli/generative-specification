# FX1-DEVLOOP2: development loop 2, three entry paths (greenfield, existing project, re-platform)

**Development, not evidence.** The formulas and the checker were tuned on these runs; no rate here is a rate of anything. Private report with the tables and the questions: `C:\workspace\PragmaWorks\soma\docs\fx1-dev-loop-2-2026-10-07.md`.

| Field | Value |
|---|---|
| ID | FX1-DEVLOOP2 |
| Status | CLOSED (stopped at the four-iteration cap) |
| Outcome | none; this is not an experiment |
| Evidence tier | none (development) |
| Refines / refined by | refines FX1-DEVLOOP and FX1-LOCK-VERIFY / replaced by FX-0 and the REV3 draft of FX-1 |
| Registration | none, by design |
| Data and code | lab sandboxes and logs (local only): `C:\workspace\PragmaWorks\lab-runs\fx1-dev\` (`harness\run2.js`, `logs2\`, `fixtures-legacy\`); formulas branch `formulas-2026-10-05` (migrate case A rewritten, checker `--migration` M01 to M10 and `--sync` Y01 to Y05, controls MG1 to MG16 and SY1 to SY6, 86 tests); FX-1 REV3 draft |
| Opened / closed | 2026-10-07 / 2026-10-08 |

## What was done
- Path definitions as JC gave them: A greenfield from a complete spec; B an existing project with no substrate and no complete spec, the formula adds the substrate and generates the spec from the code, judged on spec-code synchronization; C re-platform (code to spec, then a greenfield on another stack, with new features and a cleanup list), judged on equivalence of what is kept and accounting of the intended changes. Formula 12 case A was rewritten to be literally code to spec to greenfield; case B (older GS layout) unchanged and not tested.
- Three legacy fixtures written by an ungoverned session (habits and rollup in Python, shortly in Node; development only, disjoint from any confirmatory fixture).
- 29 valid runs in four scored batches in the Linux container (A 11, B 9, C 9), each followed by the lock formula and the checker; 11 further runs were lost to harness failures (credential revocation and an empty sandbox in batch 1, a session rate limit in the next batch) and are voided.
- Hand inspection on 12 runs: gates block at push (commits are free by design), lock consistent, ids resolve; equivalence: a plant of a behavior change in the new code was refused in 23 of 24 trials.

## Findings worth keeping
- Models write Python tests as `test_F_001_2_...`; the id grammar needs both forms. Spec folders collect assumption tables whose rows start with ids.
- A CI check that read the current branch name was red in every other clone and the pre-push gate then blocked every push: one cause took five elements down at once.
- The re-platform criterion accounting (new features, changed behaviors, deferred items) failed in five of five early runs, each time one criterion without a test; the formula now ends with the counts the checker computes.
- The mutation probe shows what a model's characterization suite leaves unpinned (boundary comparisons, date arithmetic); it is a sampling instrument.

## Limits
Anthropic models, one tier, by one author; the checker was repaired after seeing results (25 defects over two loops); the legacy fixtures are invented-by-request code, not real third-party code; Spanish prompts were not read by a native reader.
