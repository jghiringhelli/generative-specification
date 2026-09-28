# Revival Arms (RVX) — do the dead disciplines improve generative code?

> Experiment design (2026-09-05). Tests whether Cleanroom, Correctness by Construction (CbC),
> and the B-method, added as interventions to a generative harness, produce better code, and in
> WHAT WAY and WHY. Structural disciplines for the GS map. Successful arms fold into ForgeCraft
> + the academic docs. Extends the AX line (same RealWorld/Conduit benchmark, same runner).
> Frame: the autonomation spine + the CPU/numerical-methods economics (these were validated then
> abandoned on human-labor cost the executor now removes).

## Design
Each discipline becomes ONE new treatment arm, layered on the current `treatment` condition (full
GS cascade) so we isolate the discipline's marginal effect, not GS-vs-nothing. Protocol B:
k-replications -> Mann-Whitney U + Cliff's delta + Holm-Bonferroni (reuse `runner/stats.py`).
Baseline = current `treatment`. Shared behavioral oracle = the Hurl suite (`../evidence/hurl`),
run back-to-back where a golden master is needed (per the bridge-test oracle fix).

## The three arms (each = a harness intervention, stated as what it ADDS to treatment)

### RVX-clean (Cleanroom) — verification-before-run + statistical certification
- **Adds:** (1) a mandatory box-structured spec step before any code is emitted; (2) a
  verification-by-review GATE run by fresh perspective-reader agents (this is where PBR /
  Perspective-Based Reading operationalizes: tester, user, maintainer perspectives) that must
  pass before materialization; (3) statistical/usage-based test generation (weighted by endpoint
  usage) rather than only example tests.
- **Hypothesis:** review-before-run cuts the behavioral defect rate the oracle catches, at a cost
  premium; its value is reliability (fewer catastrophic reps), echoing the AX saturation finding.
- **Cheapest to run first.**

### RVX-cbc (Correctness by Construction) — contracts + a static-verification gate
- **Adds:** (1) contract/invariant/assertion-driven derivation (pre/post conditions and domain
  invariants stated in the spec and emitted as runtime + type-level checks); (2) a
  static-verification GATE the executor must satisfy (strict tsc, property-based tests over the
  invariants, exhaustiveness) before a rep is admitted.
- **Hypothesis:** eliminates whole error CLASSES (e.g. the null-vs-empty-string conformance
  defects seen in the M oracle baseline) rather than instances; largest structural-quality gain.

### RVX-bmethod (B-method) — model-first, derive from a verified model
- **Adds:** an intermediate VERIFIED MODEL step: the executor produces a checked model of the
  system (state + operations + invariants), the model is validated, then code is derived from it.
- **Hypothesis:** highest ceiling, hardest to operationalize for general web code. Run LAST, only
  if RVX-clean or RVX-cbc separate from baseline (avoid sinking effort in the heaviest arm first).

## Dependent variables
Same as AX: layer_violations, audit (7 props x 0-2), CVEs, files/test_files, cost. PLUS the
behavioral defect rate: fraction of the Hurl oracle that passes per rep (the metric M failed on).
Per-arm question is not only "better?" but "better HOW" (which DV moves) and "why" (which
mechanism: spec-first, review gate, contracts, or model).

## Runner wiring (sketch)
- Add to `runner/generate.cjs` CONDITIONS: `"rvx-clean"`, `"rvx-cbc"`, `"rvx-bmethod"`, each a
  copy of `treatment`'s context plus its intervention prompts under `revival/<arm>/prompts/`.
- The review-gate arms need a new orchestrator step between generate and materialize: run the
  perspective-reader / static-verification pass, loop back on failure (bounded retries), log the
  gate verdicts as artifacts.
- `measure.cjs`: add oracle-pass-rate by running the Hurl suite (now that `hurl` is installed) as
  a measured metric, not just a manual check.
- `aggregate.cjs` + `stats.py`: add the new arms and the `oracle_pass` column; existing pairwise
  machinery handles the rest.

## Outputs
Arms that beat baseline (on any DV, at acceptable cost) -> fold the mechanism into ForgeCraft +
cite in the paper. Arms that do not -> a documented NEGATIVE result (also publishable: "prompting
the discipline was not enough, it had to be enforced", cf. Zhu on prompt-specificity).
