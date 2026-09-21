# NX — N-version revival: results (k=1 pilot)

_Ran 2026-09-21. `claude-sonnet-4-5` via CLI, 24 generations, 0 failures, $2.16. k=1 pilot toward
the pre-registered k=3 (labeled as such — not k=3). No Docker/Ollama/DB._

## The result — a clean, honest NEGATIVE

| Problem | Category | Baseline defect-rate | N-version flagged | Majority wrong |
|---|---|---|---|---|
| money-split | subtle | **0%** | **0%** | 0% |
| merge-intervals | subtle | **0%** | **0%** | 0% |
| business-days-add | subtle | **0%** | **0%** | 0% |
| reschedule-conflict | subtle | **0%** | **0%** | 0% |
| sum-array | trivial | 0% | 0% | 0% |
| reverse-string | trivial | 0% | 0% | 0% |

Every battery input (edge cases + 300 random each): the single baseline version was **correct**,
and the three independent versions **agreed unanimously**. Nothing to catch, nothing flagged.

## Interpretation — N-version stays DEAD on a frontier model, and *why*

The cost of N-version inverted exactly as the thesis says — the AI wrote 3 independent versions
for ~$0.20 total, free by historical standards. **But its benefit collapsed at the same time.**
On a frontier model at this task difficulty, the single version ships **no defects**, so
disagreement-flagging has nothing to catch. N-version is **cheap and useless here** — dead, not
by cost, but by **defect-exposure collapse**.

This is the **capacity-relative pattern again** (cf. CR): a practice's benefit recedes as the
model strengthens, because the failure mode it targets stops occurring. It **validates the revival
model directionally**: benefit is gated by exposure `λ` (defects present), not by `c_AI`. Making a
practice cheap does nothing when `λ → 0`. The revival tool already predicts N-version STILL-DEAD on
a clean, low-stakes project for exactly this reason — this experiment is the measured confirmation.

**The prediction it makes:** N-version should **revive on a weaker model** — one that *does* ship
these defects (`λ > 0`). That is the immediate next run.

## Caveats (honest)
- **k=1 pilot, single model (Sonnet), 6 problems** — a mechanism/direction check, not a powered
  result. State it as such.
- **The "subtle" problems were within Sonnet's competence** — 0% baseline defects means the
  difficulty didn't exceed the model. Harder/edgier problems (or a weaker model) are needed to make
  `λ > 0` and actually test N-version's catch.
- **AI-version diversity via framing is a weak proxy** for true N-version independence (same model).
- The harness had to READ the file the agentic `claude -p` writes (it does not return code inline);
  dead generations are dropped from the triple. Fixed before this run.

## Calibration datum for the revival model
N-version's `cov(logic-error)` is real in principle, but on a frontier model its effective benefit
is ~0 because `λ(logic-error) ≈ 0`. So the revival model should treat `λ` as **model-conditioned**:
the same practice is dead on a strong model and can revive on a weak one — the capacity-relative
axis, now inside the revival formula.

## Next
Re-run NX with **k≥3** AND on a **weak local model** (qwen2.5-coder / the CR ladder) where the
baseline ships defects — the test of whether N-version *revives* where the frontier does not. Add
harder problems so `λ > 0` even on Sonnet.
