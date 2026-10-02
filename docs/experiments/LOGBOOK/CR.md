# CR: capacity-relative study on a non-memorized benchmark (September 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | H1 (GS benefit declines with capability) on duplication and complexity: INCONCLUSIVE with partial support (direction as predicted, n = 3, no trend test run). Behavioural oracle: INVALID-DESIGN at the weak rung (apps did not serve), no signal at hosted rungs. Layer violations: INVALID-DESIGN as a metric here (never fired) |
| Evidence tier | C, the strongest of the set: preregistration precedes generation in history |
| Registration | `experiments\cr\PREREGISTRATION.md` commit `c4c855e`, 2026-09-17 15:33:11 -05:00, before the benchmark authoring commit `bba73c9` (15:37) and the runs. Public push time and an external timestamp are not verified. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\` (PREREGISTRATION.md, RESULTS-final.md, RESULTS-copilot-arm-mid-frontier.md, DEVIATION-weak-rung.md, benchmark\, runner\) |

## What was asked
Is GS's benefit over naive use a decreasing function of model capability, on an invented (Pastura) benchmark with no public corpus? Ladder: qwen2.5-coder 7b (weak, local), a mid hosted model, three frontier models; naive vs GS; k = 3.

## What the design could and could not detect
- The non-memorized benchmark is the design's real strength (guard c). The canary recall probe was on the registration's own checklist; no result file for it is in the repository.
- Registered analysis: monotone trend test (Jonckheere-Terpstra or Page) over the ladder. The result file reports direction and magnitude only and says it follows the small-k rule; the registered test was not run.
- Weak-rung GS cells were high variance (one 32-file app, one 5 files, one empty project). Medians over k = 3 are coarse.
- Behavioural oracle: both conditions fail to serve on the 7b model (0 of 0); hosted rungs: GS equal or lower than naive. The layer-violation metric is 0 everywhere, so it carries no information (floor).
- Deviations disclosed: the 32B rung dropped for VRAM (DEVIATION-weak-rung.md); an earlier weak-rung run invalidated by a background task race and rerun. Not in a deviations file: metric instruments were changed after first results (commits `ea93b7e` barrel-aware dead-code metric, `4166ad2` layer-metric widening, 2026-09-18).
- Single invented domain; the capability order was fixed a priori.

## Questions
| Question | Result |
|---|---|
| GS-minus-naive gap on duplication shrinks weak to strong | INCONCLUSIVE, direction as predicted (+14.5 weak, about 0 mid, slightly negative frontier) |
| Same on complexity | INCONCLUSIVE, mild decline then flat |
| Same on behavioural oracle | INVALID-DESIGN (floor at the weak rung); GS no better than naive at hosted rungs |
| Layer violations | INVALID-DESIGN (metric did not fire) |

## What it licenses
"On one invented benchmark, with three runs per cell, a spec cascade reduced duplication and complexity most on a 7B model and the effect receded at the frontier." Not a law, not a behavioural quality claim.

## Intuition versus result
The behavioural result (GS no better, sometimes worse) ran against the expected direction and is reported as such in RESULTS-final.md. The protocol's audit has not been applied to it: the weak rung's non-serving apps and the oracle strictness are validity candidates. Open item: BACKLOG B5.
