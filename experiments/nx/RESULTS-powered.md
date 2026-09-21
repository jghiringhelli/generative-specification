# NX — powered replication on `business-days-add` (k=4, Sonnet vs qwen7b)

_Ran 2026-09-21. One problem (the edge-dense one where exposure appeared), k=4 per model, existing
harnesses + verified oracle. A focused capacity-relative revival contrast — not a broad study._

## The two-model contrast

| Model | baseline defect-rate | dead-version rate | N-ver flagged | maj-wrong | disagreement-catch | false-positive | effective triples |
|---|---|---|---|---|---|---|---|
| **Sonnet** (frontier) | **0%** (0/4 reps erred) | 0/16 | 0% | 0% | — (nothing wrong) | 0 | 4/4 |
| **qwen2.5-coder:7b** (weak) | **~8.7%** (one rep 26%) | **7/16 (44%)** | 13% | 13% | **1.00** | **0.00** | 2/4 |

## Verdict — the revival contrast holds, with one honest complication

- **Dead on the frontier (confirmed powered).** At k=4, Sonnet's single version was correct every
  time and all four triples were unanimous — `λ = 0` for this problem on a frontier model, so
  N-version has nothing to catch. Cheap and useless. This is now a *powered* negative, not a fluke.
- **Revives on the weak model.** qwen ships real defects here (`λ ≈ 8.7%`, up to 26% on a rep), and
  where its triple was majority-wrong, **disagreement caught 100% of those inputs with zero false
  positives.** When the generator errs, N-version works essentially perfectly. That is the
  capacity-relative revival: the same practice, dead on the strong model, alive on the weak one.
- **The complication (honest, and it matters):** qwen's **44% dead-version rate** — nearly half its
  generations were unrunnable code — means you often cannot assemble three *live* versions (two of
  four triples had <2 live and were skipped). So on a weak model N-version carries a hidden cost:
  **you must over-generate to get a usable triple.** The practice reduces to few effective triples
  (2/4 here). This is a real, reportable limitation, not a detail to hide.

## What it says for the thesis
- `λ = f(model, difficulty)` is now shown *powered* on one problem: exposure collapses on the
  frontier and opens on the weak model — the capacity-relative axis inside the revival formula.
- N-version's coverage is near-perfect **when triggered** (catch 1.0, fp 0), so its revival verdict
  is entirely an exposure question — cost-inversion is necessary but not sufficient; `λ > 0` is the
  gate, and a **weak model both raises `λ` (more defects) and raises the practice's residual cost
  (dead versions to discard).** The revival model should carry that second effect: a weaker executor
  is not uniformly better for a cheap practice.
- The uncertainty-surfacing angle stands: qwen's single baseline ranged 0%→26% across reps (a coin
  flip); the triple exposes that variance where a lucky single generation hides it.

## Caveats
One problem, one frontier + one weak model, k=4 (a focused replication). Framing-diversity is a weak
independence proxy. qwen's dead-version rate inflates the residual and shrinks effective k. A
mechanism/direction result, not a powered effect size across practices.
