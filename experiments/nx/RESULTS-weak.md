# NX — N-version revival on a WEAK model (qwen2.5-coder:7b, k=2)

_Ran 2026-09-21. Ollama qwen2.5-coder:7b (GPU), 48 generations, 0 gen-failures, 2 dead versions
(46 live). No Docker/DB. Contrast: the frontier run (Sonnet, `RESULTS.md`) was a clean negative._

## Result

| Problem | Category | Baseline defect-rate | N-version flagged | Majority wrong | Disagreement-catch | False-positive |
|---|---|---|---|---|---|---|
| money-split | subtle | 0% | 0% | 0% | — | 0 |
| merge-intervals | subtle | 0% | 0% | 0% | — | 0 |
| **business-days-add** | subtle | **0%** | **26%** | **26%** | **1.00 (100%)** | **0.00** |
| reschedule-conflict | subtle | 0% | 0% | 0% | — | 0 |
| sum-array | trivial | 0% | 0% | 0% | — | 0 |
| reverse-string | trivial | 0% | 0% | 0% | — | 0 |

## Read — honest, still largely negative, with one real signal

**Baseline defect-rate is 0% on every problem for qwen7b too** — like Sonnet, a single qwen
generation gets all 6 right. So on 5 of 6 problems the exposure `λ ≈ 0` and N-version has nothing to
catch → **still dead**. These problems are within a competent coder model's single-shot competence;
model-weakness alone (7B vs frontier) did not open `λ`.

**The one exception is a genuine mechanism signal.** On **business-days-add** — the most
edge-case-dense problem — qwen's implementations were **inconsistent**: across the triple, versions
landed on *different* handling of the n=0 / weekend / holiday-adjacency edges. Where 2 of 3 landed on
a wrong variant (majority wrong on 26% of inputs, averaged over the two triples; 52% in the triple
that diverged), **disagreement flagged 100% of the majority-wrong cases with ZERO false positives**
(`catch=1.0, fp=0`). When `λ>0` appeared, the N-version mechanism worked **perfectly**.

**The subtle point that matters most:** the *baseline* shipped 0% on business-days-add while the
*triple* was majority-wrong 52% on one rep. A single generation is a coin flip — it sometimes samples
a correct implementation and looks clean; the disagreement across three draws **surfaces the model's
underlying uncertainty** on those edge inputs that the one lucky single-shot hides. So on a weak/
uncertain model, **N-version's real value is exposing variance ("the model is unsure here") exactly
where silent defects live** — not just catching a defect a single version already shows.

## What this says about revival (and the thesis)

- **Revival is gated by `λ`, and `λ = f(model, problem-difficulty)`.** Weakening the model (frontier→7B)
  was **not enough** to open `λ` on easy problems — qwen is a good coder. The lever that reliably
  opens `λ` is **problem difficulty beyond single-shot competence**, and there N-version pays.
- **Capacity-relative, refined:** the frontier had **zero** variance even on business-days (0 flags);
  the weak model had variance **on the hardest problem** (26% flagged, perfect catch). The gradient
  is real but the effect is small because the problems don't stress either model enough.
- **Calibration datum:** in the `λ>0` window, N-version's coverage of logic-error is effectively
  **1.0 with 0 false positives** — so the revival model should treat N-version as *high-coverage,
  low-residual-once-triggered*, but its effective benefit = `cov × λ`, and `λ` collapses on
  easy tasks. This is the model-conditioned-`λ` refinement from the frontier run, now with a number.

## Verdict
**Not a clean revival demonstration** (problems too easy → `λ≈0` for both models), **but the
mechanism is validated in the one window where `λ>0` appeared** (perfect catch, zero false positives),
and it revealed model *uncertainty* a single-shot hides. The missing lever is **harder problems**, not
a weaker model.

## Caveats
k=2 pilot; single weak model; 6 problems all within single-shot competence (0% baseline everywhere);
AI-version diversity via framing/temperature is a weak independence proxy. Mechanism/direction check,
not a powered result.

## Next
Author **harder problems** (edge-dense enough that a single competent generation ships defects →
`λ>0` even on Sonnet), then re-run NX at k≥3 across the capacity ladder. The prediction: catch rises
with `λ`, and `λ` rises as problems get harder and models get weaker — the two axes of the revival
surface.
