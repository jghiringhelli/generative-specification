# NX — N-version revival experiment (pre-registration)

> 2026-09-21. The first true **revival experiment** (Paper 2): does a practice abandoned purely
> for cost — **N-version programming** (Avizienis 1985) — beat the single-version baseline when the
> AI writes the N versions for free, and on which task types does it *stay dead*? Commit this hash
> before running. Needs only the `claude` CLI + node (no Docker, no Ollama, no DB — RAM-light).

## Hypothesis
- **H1 (revival on subtle tasks):** on tasks with subtle correctness (edge cases where a single
  generation makes silent errors), N-version **disagreement-flagging catches shipped defects** that
  the single version would ship, at an adjudication cost below the benefit → **N-version revives**.
- **H0 / negative (stays dead on trivial tasks):** on trivial tasks the N versions agree, catch
  nothing, and waste 3× tokens → **stays dead**. Reporting the negative is part of the result.

## Design
- **Conditions, per problem:**
  - **Baseline** = 1 AI implementation (fresh stateless `claude -p` session).
  - **N-version** = 3 AI implementations (independent fresh sessions; framing varied to induce
    diversity, same spec). Decision rule: run all 3 on the input battery; an input where the 3
    **disagree** (not unanimous) is a **flagged suspected defect**.
- **k:** each condition repeated **k=3** (independent baseline picks + independent N-version triples)
  to get dispersion. Total generations per problem = 3 (baseline reps) + 9 (3 triples) = 12.
- **What varies within a condition:** only the model session (nondeterminism). Same model
  (`claude-sonnet-4-5` via the CLI harness), same spec, same battery.
- **The oracle** (hidden from the generator): a hand-authored correct reference implementation +
  a large random input battery per problem. The generator never sees the oracle or the battery.

## Metrics (per problem, per condition)
1. **Shipped-defect rate (baseline):** fraction of battery inputs where the single version's output
   ≠ oracle. (What a single version ships wrong.)
2. **Disagreement-catch (N-version):** of the inputs where the *majority* N-version answer is wrong
   (a real defect the triple would ship by majority vote), how many are **flagged** by disagreement
   (not unanimous). Plus: inputs where disagreement flags a defect the *baseline* would have shipped.
3. **False-positive rate:** inputs flagged by disagreement where the majority (or all) were actually
   correct → wasted adjudication. This is the **residual cost** driver.
4. **Cost:** tokens (baseline 1× vs N-version 3× generation) — from the CLI stream. Adjudication
   residual ∝ number of disagreement clusters to review.
5. **Net revival verdict:** N-version revives on a problem iff (defects caught × their impact) >
   (false-positive adjudications × residual). Report per problem and by category (subtle vs trivial).

## Analysis
- Median [IQR] over k per problem. Aggregate by **category** (subtle / trivial).
- **The money figure:** defect-catch vs false-positive, subtle vs trivial — showing revival on
  subtle, dead on trivial. Report nulls in the same voice as positives (§the honest rule).
- **Calibration output:** the measured defect-catch and false-positive rates give the first
  data-grounded estimate of N-version's `cov` (coverage of logic-error) and `c_res` (residual) for
  the revival model — replacing the provisional hand-set defaults in `revival_v0.cjs`.

## Problem set (authored oracles — the generator never sees them)
In `problems.cjs`. Each: `{id, category, spec (the prompt), oracle(fn), genInput(rng)}`. Categories:
**subtle** (edge-case logic where single generations silently err) and **trivial** (control).
Subtle: business-day date add, cents-exact money split, interval merge (touching edges), reschedule
rule with min-rest + self-overlap. Trivial: sum, string reverse.

## Threats / owns
- **Single model** (Sonnet via CLI) — own it; a second model is future work.
- **Small problem set** — a mechanism demonstration, not a powered effect size; state it.
- **Oracle correctness is load-bearing** — the reference impls are simple and independently
  reviewed; the battery is large random + hand-picked edge cases.
- **Independence of the 3 versions** is imperfect (same model) — real N-version wants diverse
  teams; AI-diversity via framing is a weaker but honest proxy, disclosed.

## Pre-registration checklist
- [ ] This file committed (hash logged) before any generation.
- [ ] Problem set + oracles committed, generator-blind.
- [ ] k and stopping rule fixed (no peeking-and-adding).
- [ ] Decision rule (disagreement = flag; majority vote = shipped answer) fixed.
