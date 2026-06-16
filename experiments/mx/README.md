---
layout: default
title: "MX - Model Tiering"
parent: Experiments
nav_order: 7
description: "Does a tiered model pipeline (strong planner + cheaper executor + objective evaluation + escalation) beat a single mid-tier model at equal quality? Measured on the RealWorld/Conduit backend."
---

# MX — Model-Tiering Experiment

Tests whether a **tiered model pipeline** — a strong planner that decomposes and routes each subtask to a cheaper executor, an objective evaluator (the acceptance suite), and escalation to the strong model only on failure — delivers the **same task quality at lower cost** than a single strong model, *even after counting the planning and evaluation overhead*.

Design (frozen, pre-registration): [`exp-model-tiering-design`](#design-pre-registration) (summarized below).

---

## Question and Hypotheses

**Question.** Does a *tiered* pipeline (strong planner → cheap executors via subagents → evaluator → escalate only on failure) deliver the **same task quality at lower cost** than an all-strong baseline, *even after counting the overhead* of planning and evaluating?

- **H1 (cost).** Tiering (C4) costs materially less **$ per accepted task** than all-strong, at parity of quality.
- **H2 (quality).** Tiering matches (within noise) the pass-rate of all-strong and **beats** all-cheap.
- **H0 (null).** The overhead of planning + evaluating + escalating **cancels** the saving (tiering ≈ or > all-strong in cost).

> **Metric honesty (key).** Separate **tokens** from **dollars**. Tiering may consume *more total tokens* (executors + evaluator) but *fewer dollars* (cheap tokens cost less) and *fewer strong-model tokens*. We report **both**. This is distinct from the field claim *"you save time, not tokens"*: here we measure **cost-efficiency per accepted output**, not time.

---

## Conditions (pre-registered)

**Tiers (fixed):** *expensive/strong* = **Opus 4.8** · *mid* = **Sonnet 4.6** · *cheap* = **latest Haiku**. Key rule: **code generation generally runs on Sonnet** (Haiku only for trivial tasks). This repositions the experiment — the real competitor to beat is not "all-cheap" but **"use Sonnet for everything"** (C3).

All conditions receive **the same GS spec** and **the same acceptance suite** (the oracle). Only the model strategy varies.

| Cond. | Strategy | Purpose |
|---|---|---|
| **C1 — All-Opus** | Opus plans + generates + verifies. No tiering. | Quality and cost ceiling. |
| **C2 — All-Haiku** | Haiku does everything. | Floor (does Haiku suffice to generate? probably not — that is the datum). |
| **C3 — All-Sonnet** | Sonnet does everything. | **The practical baseline**: "use the good-enough model for everything." The number to beat. |
| **C4 — Tiered (the method)** | Opus plans, decomposes, and **routes each subtask to its tier** (Haiku = trivial, Sonnet = normal generation) → executors (subagents) generate → **objective evaluation of the solution** (generative execution / acceptance suite) → **escalate to Opus** the subtasks that fail. | The hypothesis. |
| **C5 — Tiered without escalation (ablation)** | Same as C4 but **without** the Opus retry. | Isolates how much the evaluate+escalate loop contributes. |

**Comparisons that matter:**
- **C4 vs C1** — does it match Opus quality at **fewer dollars**? (the headline).
- **C4 vs C3** — does tiering+escalation beat *"all-Sonnet"*? (the real test: if it does not beat C3, tiering is not worth the complexity).
- **C5 vs C4** — does evaluate+escalate **pay for itself**?

> **Note — solution evaluation is objective, not an LLM judge.** The pipeline's "evaluator" runs the **acceptance suite / generative execution** (the oracle) and escalation fires on its failure — the GS way (verify, don't trust). What the planner (Opus) does is *task evaluation* (decomposition + tier routing). The harness records the result, not the agent.

**Escalation trigger (fixed): K = 1** — one attempt at the assigned tier; if the acceptance suite fails, escalate to Opus.

---

## Task Corpus (the oracle)

The acceptance oracle is the **RealWorld / Conduit** API contract, expressed as Hurl request suites. "Quality" is objective: the tests are the oracle, so grading is automatic and unbiased. The pilot runs three phases of increasing scope against the same contract:

| Phase | Scope | Endpoints / suites | Requests |
|---|---|---|---|
| **1 — `auth` slice** | Registration, login, get/update current user, error cases | `auth.hurl` + `errors_auth.hurl` | 35 |
| **2 — Multi-resource** | auth + articles + comments | the slice plus articles/comments suites | 95 |
| **3 — Full Conduit** | The entire RealWorld backend: auth, profiles, articles, comments, favorites, feed, tags, pagination, authorization + error suites | 13 Hurl files | 149 |

> In GS the spec **includes** the acceptance criteria; the implementation is derived from the spec and verified against them. What varies across conditions is the **model strategy**, not the spec.

The full 13-file oracle is vendored in [`oracle/`](oracle/) (see [Reproducibility](#reproducibility)).

---

## Measured Results

> Execution: **in-session subagents** at the Opus 4.8 / Sonnet 4.6 / Haiku tiers; resumable journal, one row per cell. **Token counts are totals reported by each subagent — no in/out split** (a precise per-task dollar figure needs a promptfoo run; see caveats). Tokens are exact; the dollar factor uses the Opus:Sonnet per-token price ratio (~5x).

### Phase 1 — `auth` slice

| Cell | Status | Tokens (total) | LOC | Correctness (pass/total) | Latency | Notes |
|---|---|---|---|---|---|---|
| C1·r1 (All-Opus) | ✅ | 26,248 | 214 | **35/35 (100%)** | 61s | pipeline validated; `auth.hurl` 20/20 + `errors_auth` 15/15 |
| C3·r1 (All-Sonnet) | ✅ | 23,457 | 226 | **35/35 (100%)** | 86s | matches Opus on correctness, comparable tokens → at ~1/5 the $/token, **much cheaper** |
| C4·r1 (Tiered) | — not applicable (slice too small) | — | — | — | — | replaced by the multi-resource task |

### Phase 2 — Multi-resource (auth + articles + comments)

| Cell | Status | Tokens | LOC | Correctness | Latency | Notes |
|---|---|---|---|---|---|---|
| **C3-multi (All-Sonnet)** | ✅ | 34,768 | 474 | **95/95 (100%)** | 131s | Sonnet **one-shots the entire 3-resource backend** |
| **C4-multi (Tiered)** | ⛔ verdict at planning | planner **37,444** (alone) | — | — | 74s (planner) | **the Opus planner alone already cost MORE than C3's complete build** → C4 cannot beat C3 on cost; executors were not completed |

### Phase 3 — Full Conduit (the one-shot ceiling)

The entire RealWorld/Conduit backend: 13 Hurl files, 149 requests (auth, profiles, articles, comments, favorites, feed, tags, pagination, authorization + errors).

| Condition | Correctness | Tokens | LOC | Latency |
|---|---|---|---|---|
| **C1 — All-Opus** | **149/149 (100%)** | 54,440 | 419 | 152s |
| **C3 — All-Sonnet** | **149/149 (100%)** | 43,393 | 545 | 172s |

**Sonnet one-shots the FULL Conduit at 100%** — following, feed, favorites, pagination, tags, authorization/ownership rules, everything. Opus is also 100%, but with **more tokens (54k vs 43k)** and at **~1/5 the per-token price of Opus → ~6x more expensive for an identical result**.

C4-full was not run: with Sonnet scoring 149/149, escalation to Opus has nothing to fix, and the multi-resource phase already showed the Opus planner *alone* costs more than Sonnet's entire build — a decisive verdict.

---

## Conclusion

1. **At current model quality, Sonnet matches Opus at 100% even on the complete canonical backend** (the RealWorld benchmark), at **~1/5–1/6 the cost**. The strong, measured statement: *"use the mid model (Sonnet), not the expensive one (Opus) — same quality, a fraction of the cost"* for this task class (well-specified CRUD/backend). This moves white-paper §4.3 from *reasoned* to **measured**.

2. **Model-tiering is NOT justified for this task class.** When the mid model can one-shot the task, the strong-model planner overhead is pure cost: the Opus planner for C4 (37.4k tokens) alone *exceeded* C3's entire build (34.8k). Neither Opus (more expensive, no gain) nor tiering (planning overhead) pays. Tiering would only pay on tasks that **exceed Sonnet's one-shot capacity** (novel algorithms, deep domain, large unfamiliar codebase) — where you would otherwise reach for Opus everywhere, and tiering saves by using Sonnet/Haiku with selective Opus escalation. **The benefit of tiering is conditional on task size/difficulty relative to the mid model.** RealWorld/Conduit is not that hard; the harder regime is a distinct future experiment, not "more of the same."

3. **Pipeline + finding validated and measured** across 5 cells (slice + multi-resource + full Conduit), an objective Hurl oracle, and a resumable journal. Ready to scale (more tasks, k≥2, the in/out split via promptfoo) when warranted.

---

## Reproducibility

### What is committed here

```
experiments/mx/
  README.md            this writeup
  oracle/              the 13 RealWorld/Conduit Hurl suites — the acceptance oracle (149 requests)
  runs/                AI-generated implementations per cell (evidence)
    c1-r1/             All-Opus, auth slice        (server.js + package.json)
    c3-r1/             All-Sonnet, auth slice
    c3-multi/          All-Sonnet, multi-resource
    c1-full/           All-Opus, full Conduit
    c3-full/           All-Sonnet, full Conduit
    .gitignore         node_modules/
```

Each `runs/<cell>/` holds the generated `server.js` (an in-memory, pure-JS Conduit backend) and its `package.json`. `node_modules/` is gitignored; install it locally before testing.

### Execution method (honest)

The cells were produced by **in-session subagents** pinned to the three tiers (Opus 4.8 / Sonnet 4.6 / latest Haiku). The generating agent does **not** run the oracle itself (no self-report — the harness records pass/fail). This method yields **total tokens per cell only, with no input/output split**, so the dollar figures use the published Opus:Sonnet per-token price ratio (~5x) rather than an exact billed amount. A **precise per-task dollar** measurement needs a single-shot harness run (`promptfoo`) that logs in/out tokens and USD per call.

### The oracle command

For a cell, install deps, start the server on a port `P`, then run the relevant Hurl suites against it:

```bash
cd experiments/mx/runs/c3-full
npm install
PORT=3000 node server.js &        # start the generated backend

# Run the acceptance oracle (full Conduit = all 13 suites; uid keeps test data unique):
hurl --test \
  --variable host=http://localhost:3000 \
  --variable uid=1 \
  ../../oracle/auth.hurl \
  ../../oracle/profiles.hurl \
  ../../oracle/articles.hurl \
  ../../oracle/comments.hurl \
  ../../oracle/favorites.hurl \
  ../../oracle/feed.hurl \
  ../../oracle/tags.hurl \
  ../../oracle/pagination.hurl \
  ../../oracle/errors_auth.hurl \
  ../../oracle/errors_articles.hurl \
  ../../oracle/errors_comments.hurl \
  ../../oracle/errors_profiles.hurl \
  ../../oracle/errors_authorization.hurl
```

For the `auth` slice cells (`c1-r1`, `c3-r1`), run only `auth.hurl` + `errors_auth.hurl` (35 requests). For the multi-resource cell (`c3-multi`), add `articles.hurl` + `comments.hurl` (95 requests).

**Correctness = passed requests / total.** A green run reproduces the reported 35/35, 95/95, or 149/149.

### Honest caveats

- **Tokens are exact; dollars are derived.** The ~6x cost gap rests on the Opus:Sonnet per-token price ratio, not on a billed in/out split. Treat the dollar figures as directional until a promptfoo run pins them.
- **Single-shot cost is pessimistic.** Per-call pricing re-sends the spec each time; in a real session the spec/skill is injected once and stays in prompt cache, which *widens* the Sonnet-vs-Opus gap further. So the measured gap is a lower bound on the real-world advantage.
- **k = 1 per cell in the pilot.** This is a directional pilot, not the full grid. Scaling to k ≥ 2 and reporting median ± dispersion is future work.
- **Task-class scope.** RealWorld/Conduit is a well-specified standard backend. The finding ("use Sonnet, skip tiering") holds for this class. It does **not** generalize to genuinely harder tasks (novel algorithms, deep domain, large unfamiliar codebases), where tiering may still pay — a distinct future experiment.
- **C2 (All-Haiku) and C5 (ablation)** were not needed once the decisive verdict landed (C3 saturates correctness; the C4 planner alone outcosts C3's full build).

---

## Design (pre-registration)

The frozen design pre-registered the five conditions, the tiers, the primary metric (**$ per accepted task**), the escalation trigger (K = 1), the decision rule, and the validity threats **before** any run. Decision rule: C4 confirms H1+H2 if it reaches C1's pass-rate within −5 pp **and** does so at ≤ 60% of C1's $/accepted-task, **and** beats C3 on $/accepted-task or pass-rate. The pilot reached its verdict before C4 could be completed: C3 already saturates correctness, and the C4 planner alone outcosts C3's full build.

---

## Relationship to Other Experiments

- **AX** (complete) — adversarial AI-vs-AI study; quality as a function of specification completeness, on the same RealWorld/Conduit benchmark.
- **EX** (complete) — full L1–L4 executable proof on live Conduit.
- **MX** (this) — model strategy at fixed spec: shows the *mid* model (Sonnet) suffices for this task class, and tiering is unjustified when the mid model one-shots.
- Feeds **white-paper §4.3** (the cost rebuttal: "fewer dollars per correct line"), moving it from *reasoned* to *measured* for this task class.
