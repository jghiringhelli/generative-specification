# Revival Program — pre-registration (the falsifiable cheap-rigor experiment)

> 2026-09-23. The full revival experiment behind the future extension paper ("Cheap Rigor: a
> capacity-gated model of discipline revival"). Extends the single-practice NX pre-registration
> (`experiments/nx/PREREGISTRATION.md`) to a **program** designed to be able to FAIL. Commit this
> hash before any generation. Local only: `claude` CLI (frontier) + Ollama qwen (weak ladder) + node.
> No Docker, no DB. RAM-light (ladder sizes chosen to fit 12GB VRAM).
>
> **Why this design exists:** blind reviews nulled the earlier plan as *unfalsifiable-by-flexibility*
> — a three-shape model with author-assigned class labels and difficulty tuned to the desired regime
> confirms any outcome. The four commitments below (fixed difficulty, a model ladder not two
> endpoints, per-cell numeric predictions with a null region and named falsifiers, hold-out
> validation) are what make it a real test. None of the parameter defaults in
> `docs/discipline-revival-model.md` may be tuned after seeing a cell's result.

## 0. The question

Does making a *validated-but-dead-on-cost* practice cheap (the AI runs it) revive it — **and does
its revival value have the SHAPE the revival model predicts for its class**, across a capability
ladder? Where does each practice *stay dead*, and does the model predict both?

## 1. The three commitments that make it falsifiable

**C1 — Difficulty is FIXED, not tuned.** One problem set, each problem pre-labeled with a difficulty
tier (T0 trivial / T1 moderate / T2 hard / T3 edge-dense), committed here before any run. We never
add/adjust problems to move a cell into a desired regime. Exposure `λ` is allowed to emerge from
(fixed difficulty × model), never engineered.

**C2 — A capability LADDER, not two endpoints.** The capability axis is a clean same-family ladder,
weakest→strongest: `qwen2.5-coder:1.5b`, `:3b`, `:7b`, and `claude-sonnet-4-5` (frontier). Four
points can show a *shape* (monotone vs hump vs floor); the earlier n=2 twin critique was exactly
that two points cannot. (All qwen sizes fit 12GB VRAM; nothing larger — the 32B drop in CR is
respected.) **Plus one CROSS-VENDOR frontier rung** — a second-vendor frontier model (OpenAI GPT or
Google Gemini, whichever is keyed; AX2 used both) run on the *same* problems, parallel to Sonnet at
the top. Its job is NOT the capability shape (it sits at the frontier, off the qwen family axis) but
to test whether the frontier result (esp. N-version STILL-DEAD at λ≈0) is vendor-specific or
general — and to pre-empt the single-model monoculture flag *inside* the paper, not defer all of it
to replication.

**C3 — Per-cell NUMERIC predictions, a null region, and named falsifiers, all committed below
(§4–§6) before running.** The revival model emits a number per (practice × model × tier) cell now;
the experiment compares measured to predicted. A model that can only be read *after* the result is
not being tested.

## 2. Practices under test — chosen for DIFFERENT predicted shapes

To test the shape taxonomy (the non-obvious claim), the three practices are predicted to behave
*differently* across the ladder. If they all move alike, the taxonomy is false (§6, F1).

| Practice | Class | Failure mode it targets | Automatable oracle |
|---|---|---|---|
| **P1 — N-version** (Avizienis) | defect-catching | silent logic error | disagreement across 3 independent generations vs hidden battery |
| **P2 — Mutation testing** | test-adequacy | weak/vacuous tests that pass but do not constrain | AI writes suite; we mutate the reference impl and measure mutants killed |
| **P3 — Property-based / formal property spec** | structural-verification | invariant violation the example-tests miss | AI states + checks invariants (fast-check style) vs hidden battery |

Each practice's coverage `a_j`, `c_AI`, `c_res` come from `discipline-revival-model.md` §4 as
**provisional defaults, frozen now**; the experiment measures the realized values and compares.

## 3. The grid

`3 practices × 5 generators × 16 problems × k repetitions`, plus a **baseline** (single generation,
no practice) per (generator × problem). Generators = the 4-rung qwen→Sonnet capability ladder + 1
cross-vendor frontier rung (§C2). Problems = 16 (4 per tier × 4 tiers, §4). Repetitions `k=3` per
cell for dispersion; stopping rule fixed (no peek-and-add). Same spec, same hidden battery,
generator never sees the oracle. The cross-vendor rung enters the F1/F2 shape analysis only as a
frontier check, not as a ladder point.

## 4. Predicted revival surface (COMMITTED — fill the numbers before running)

For each cell, the model predicts a **net revival verdict** ∈ {REVIVED, ALWAYS-WORTH, STILL-DEAD}
and a **numeric marginal benefit** (defects caught net of false-positive/residual cost, in the
practice's own units). The qualitative surface committed now:

- **P1 N-version** — predicted **capability-HUMP**: STILL-DEAD at Sonnet (λ≈0, nothing to catch);
  REVIVED at 7b/3b (λ>0 on T2/T3, catch high, residual low); degrading at 1.5b (λ high but
  dead-version rate spikes → residual eats the benefit). Peak in the *middle* of the ladder.
- **P2 Mutation testing** — predicted **weakly RECEDING with a floor**: REVIVED at 1.5b/3b (weak
  models write vacuous tests that mutation exposes cheaply), narrowing toward the frontier, but a
  non-zero floor at Sonnet on T2/T3 (even strong models write superficially-passing tests for hard
  logic). NOT a hump.
- **P3 Property-spec** — predicted **RECEDING**: strongest at the weak end (many invariant
  violations to catch), receding monotonically as the model strengthens and stops violating
  invariants on T0–T2; a small residual only on T3. Distinct from P1's hump and P2's floor.

*(The exact per-cell numbers are entered into `predictions.csv`, committed with this hash. This
prose fixes the shapes; the CSV fixes the magnitudes. Both are frozen before generation.)*

## 5. The NULL REGION (must also verify)

Cells where the model predicts **≈0 benefit**, which the experiment must confirm (a positive result
here falsifies the exposure-gating claim, not just "a miss"):

- Any practice on **T0 trivial** problems, at **any** model → ≈0 (nothing to catch).
- **P1 N-version** at **Sonnet** on T0–T2 → ≈0 (λ≈0 within competence).
- **P3 Property-spec** at **Sonnet** on T0–T1 → ≈0.

If the null region shows real benefit, the model is wrong there and we report it as such.

## 6. Named falsifiers (committed)

- **F1 (taxonomy):** if all three practices show the *same* shape across the ladder (e.g. all
  monotone receding), the class/shape taxonomy is false — the central non-obvious claim dies.
- **F2 (class assignment):** if a practice moves opposite to its predicted class — e.g. P3
  (predicted receding) shows a hump, or P1 (predicted hump) is monotone — that class label is wrong.
- **F3 (exposure-gating):** if the null region (§5) shows benefit, "revival is exposure-gated not
  cost-gated" is falsified.
- **F4 (model validity):** if predicted marginal benefit does not correlate with measured benefit on
  the HELD-OUT fold (§7) at ρ we pre-set (target ρ≥0.5), the model has no predictive validity.

Any of F1–F4 firing is a **publishable negative**, reported in the same voice as a positive.

## 7. Validation — prospective, on a HELD-OUT fold (not the fit set)

The problem set is split **now** into `FIT` and `HOLDOUT` folds (committed in `folds.json`, ~30%
holdout, stratified by tier). Provisional `a`/`c_res` defaults may be refined **only** on FIT.
F4's correlation of predicted-vs-measured is computed **only on HOLDOUT**. No bootstrapping the set
the parameters were fit on (the specific critique from review).

## 8. Metrics (per practice × model × problem × k)

- **P1:** baseline shipped-defect rate; disagreement-catch of majority-wrong inputs; false-positive
  (flagged-but-correct); **dead-version rate** (generations that don't compile/run — the residual).
- **P2:** mutants killed / survived by the AI-written suite; mutation score; suite-authoring cost.
- **P3:** invariant violations caught vs the hidden battery; spec-authoring residual; false alarms.
- **All:** tokens (`c_AI`, from the CLI/Ollama stream), human-residual proxy `c_res`, and the §6
  revival-filter verdict {revived / always-worth / still-dead}, per `discipline-revival-model.md` §6.

## 9. Analysis

- Median [IQR] over k per cell. The **money figure**: benefit-vs-model-strength curve per practice
  (the three shapes overlaid) — the direct test of F1/F2.
- Predicted-vs-measured scatter on HOLDOUT (F4).
- Report the three buckets (revived / always-worth / still-dead) with the *why*, nulls featured.

## 10. Threats / owns (stated, not hidden)

- **AI-version independence** (P1) is imperfect (same model, framing-diversity proxy) — disclosed.
- **Frontier vendors** — Sonnet + one cross-vendor rung (§C2) are run now; this partially addresses
  the single-model flag in-paper. FULL cross-vendor breadth (all rungs × multiple vendors) remains
  the replication ask, NOT claimed here.
- **Oracle correctness is load-bearing** — reference impls simple, independently reviewed; battery
  large-random + hand-picked edge cases; generator-blind.
- **Mutation operators** (P2) are a fixed, published set — no post-hoc operator selection.
- **c_res is a proxy** (adjudication/authoring steps counted mechanically), not a human-time study;
  the human-rater arm (DX2) is separate.

## 11. Pre-registration checklist
- [ ] This file + `predictions.csv` + `folds.json` + problem set/oracles committed (hash logged) before any generation.
- [ ] Problem set difficulty tiers (T0–T3) fixed; generator-blind oracles + battery fixed.
- [ ] Model ladder fixed (1.5b/3b/7b/Sonnet); k and stopping rule fixed.
- [ ] Null region (§5) and falsifiers F1–F4 (§6) fixed.
- [ ] FIT/HOLDOUT split fixed; parameters refined only on FIT.
- [ ] Preregistration published to OSF/Zenodo with a DOI (timestamp) before running.

## 12. Design decisions — RESOLVED (JC, 2026-09-23)
1. **Third practice:** ✅ **property-based / formal property spec** (most automatable, cleanest third
   shape).
2. **Capability ladder:** ✅ **{qwen 1.5b, 3b, 7b, Sonnet}** — same-family, kept at 4 rungs (no Haiku;
   a family change would muddy the capability axis).
3. **Problem set size:** ✅ **16** (4 per tier × 4 tiers).
4. **Cross-vendor:** ✅ **add one cross-vendor frontier rung NOW** (GPT or Gemini, whichever keyed),
   to blunt the monoculture flag in-paper; full breadth stays the replication ask.
5. **F4 validity bar:** ✅ **ρ ≥ 0.5**, fixed here.

Design frozen. Build order: (1) `problems.cjs` (16 problems, tiers, generator-blind oracles +
batteries + invariants) — extends `experiments/nx/problems.cjs`; (2) `folds.json` (FIT/HOLDOUT,
~30% holdout, tier-stratified); (3) `predictions.csv` (committed per-cell numbers); (4) the harness
(qwen via Ollama + frontier via CLI + cross-vendor via API); then commit + publish the
preregistration DOI **before** the first generation.
