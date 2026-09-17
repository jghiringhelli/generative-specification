# CR — The Capacity-Relative Experiment (pre-registration)

> **Goal:** earn the paper's contribution #4 with direct, contamination-free evidence, and
> in doing so prove the master line empirically ("the frontier absorbs the mechanical delta;
> the trust delta lives elsewhere"). This file is the pre-registered design and analysis
> plan. Commit its hash BEFORE any generation run. No peeking-and-adding runs.

## 1. The claim under test

**H1 (capacity-relative law).** The quality benefit of the GS discipline over unstructured
("naive") AI use is a **decreasing function of model capability**. Formally: let
Δ(m) = quality(GS, m) − quality(naive, m) for model m on a fixed, non-memorized task. Then
Δ is **monotonically non-increasing** across a capability ladder ordered weak→strong, and
Δ(frontier) ≪ Δ(weak).

**H0 (null).** Δ is flat across the ladder (the benefit is capacity-independent), or noise
dominates the ordering.

**Directional sub-predictions (pre-registered, per metric):**
- Layer-boundary violations: naive rises sharply as capability falls; GS stays ≈0 at every
  rung → Δ largest at the weak rung.
- Duplication, cyclomatic complexity: Δ shrinks monotonically toward the frontier.
- Conformance (oracle pass rate): naive collapses on the weak model; GS degrades gracefully
  → Δ largest at the weak rung, small at the frontier.

## 2. Why a non-memorized benchmark (the load-bearing design choice)

Conduit / RealWorld API is in every model's pretraining (dozens of public implementations).
On a contaminated benchmark a strong model looks good *without* GS partly because it
**recalls** the answer, which **inflates saturation** and confounds capacity with recall.
We therefore build an **invented-domain** target with **no public reference implementation**,
so any Δ is attributable to *method × genuine capability*, not memorization.

**Contamination controls:**
- Domain, entity names, and business rules are invented for this study; the spec is not
  published until after the runs.
- A **canary probe**: before the study, ask each model cold to implement the domain from its
  name alone; near-zero recall confirms non-contamination (logged).
- No RealWorld/Conduit/todo/e-commerce vocabulary in the spec.

## 3. The benchmark (invented domain)

**Target: "Pastura" — a rangeland grazing-rotation & forage-budget API.** Chosen for
structural surface + a checkable oracle + no public corpus.

- **Entities:** Paddock, Herd, Move (a herd entering/leaving a paddock), ForageReading
  (a dated biomass measurement), RestRule.
- **Auth:** ranch owner (full) vs hand (record moves/readings only) — role-gated writes.
- **Temporal business rules (the oracle's teeth):**
  - A paddock MUST observe a minimum rest period (days) after a herd leaves before another
    herd may enter (RestRule).
  - Stocking rate (herd animal-units ÷ paddock area) MUST NOT exceed the paddock's computed
    carrying capacity derived from its latest ForageReading.
  - A Move MUST NOT overlap an existing open Move on the same paddock.
- **Computed reads:** current occupancy per paddock; forage budget (days of grazing left)
  per paddock from latest reading and stocking rate; rotation history per herd.
- **Validation + error contract:** a fixed error shape (documented in the spec) so the
  oracle can check convention as well as function.

The **full cascade** (naive README + GS artifact set: sentinel, ADRs, use cases with
acceptance criteria, NFRs, oracle spec) is authored as the next step and committed under
`experiments/cr/benchmark/` BEFORE runs. Effort ≈ one authored spec (JC + assistant).

## 4. The capability ladder (the independent variable)

Ordered weak→strong. Exact members finalized against available infra; the design requires
**at least three rungs spanning a real capability range**, ideally four:

| Rung | Candidate model | Access |
|---|---|---|
| Weak (local) | Qwen2.5-Coder-7B (Ollama) | local GPU (watch OOM — see §7) |
| Weak-mid (local) | Qwen2.5-Coder-32B or Llama-3.x-70B-coder | local / hosted |
| Mid | GPT-4.1-mini / Gemini Flash tier | Copilot arm |
| Frontier | Claude Sonnet/Opus + GPT/Gemini flagship | Copilot arm / CLI |

**What varies:** ONLY the model (the ladder) × the condition (naive vs GS). Everything else
fixed: same invented spec, same prompts per condition, same infra, same oracle, same static
suite. k≥3 per (model × condition) cell for a dispersion read; k=5 if budget allows.

## 5. Conditions (the treatment)

Two, deliberately (AX2 already showed GS>naive is the clean axis and GS-vs-expert saturates
at the frontier — the ladder is where the *interaction* lives):

- **Naive** — spec + short README, ad-hoc prompts (the AX2 naive recipe, verbatim).
- **GS** — the full authored cascade (the AX2 disciplined recipe, verbatim).

(Optional third arm, only if the enforced-process experiment is folded in: **GS+gate** — the
non-LLM Andon gate forces passing + ratchet. This measures the trust axis and addresses the
AX2 flaw JC caught. Keep separate; do not mix into the capacity-relative comparison.)

## 6. Metrics (objective, automated — reuse the AX2 clean suite)

Metrics of record are the ones AX2 proved measurable on heterogeneous agent-built apps:

1. **Layer-boundary violations** (static: data-client calls in route/controller files).
2. **Duplication** (jscpd, size-normalized).
3. **Cyclomatic complexity** (per function, median + tail).
4. **Test presence** (test files / source files; tests emitted).
5. **Conformance** — pass rate against the **invented-spec oracle** (a convention-tolerant
   Hurl/probe suite authored FROM the spec, checking the temporal business rules of §3, not
   REST cosmetics). This is the metric Conduit could not give us cleanly (contamination +
   convention-vs-function); the invented spec + tolerant oracle is designed to fix that.

Reuse: `experiments/ax/runner/static_ax2.cjs`, `conformance_ax2.cjs`, `aggregate_ax2.cjs`,
`sx_metric.cjs`. New: `benchmark/oracle/` (Pastura probes), `ladder.json` (model roster).

## 7. Analysis plan

- Per (model × condition) cell: median [IQR] of each metric over k runs.
- **Δ(m) per metric** = median(naive, m) − median(GS, m).
- **Test of H1:** report Δ(m) across the ordered ladder; test monotonic trend
  (Jonckheere-Terpstra / Page's trend test) and report the trend statistic + effect size.
  A clean monotone decline of Δ toward the frontier confirms H1.
- Honest resolution limits stated as in §V (small k → coarse p; report direction + size, not
  high power). Report nulls in the same voice as positives.
- **The money figure:** Δ-vs-capability curve, one line per metric, declining left→right.

## 8. Threats / owns

- **Ladder ordering** must be defensible (cite each model's public coding-benchmark rank as
  the a priori order; do not re-order post hoc).
- **Oracle fairness:** the oracle checks the *business rules* the spec states, tolerant to
  naming/framework choices (the AX2 lesson: strict REST-convention oracles measure
  convention, not function). Pre-commit the tolerance rules.
- **Single invented domain** — own it under external validity; a second invented domain is
  the obvious replication if a reviewer pushes.
- **Local-model infra:** Ollama OOM'd twice in AX2. Run the weak rung serially, one
  generation at a time, kill node zombies between runs (`taskkill //F //IM node.exe`, never
  claude.exe), and checkpoint after each cell.

## 9. Pre-registration checklist (commit before running)

- [ ] This file committed (hash logged) before any run.
- [ ] Invented-domain cascade authored + committed under `benchmark/` (spec not published).
- [ ] Oracle authored + committed; tolerance rules fixed.
- [ ] Ladder roster (`ladder.json`) fixed with a priori capability order + citations.
- [ ] k and stopping rule fixed.
- [ ] Canary recall probe run + logged (confirms non-contamination).

## 10. What each outcome means

- **H1 confirmed (Δ declines):** contribution #4 is earned; the master line is proven — the
  frontier absorbs the mechanical delta, and the paper's honest claim becomes "GS's
  *mechanical* value is capacity-relative and receding; its *durable* value is the trust
  axis, which this experiment deliberately does not measure and the frontier does not
  provide."
- **H1 rejected (Δ flat/large at the frontier):** even bigger news — the mechanical benefit
  does NOT recede; re-open the median-quality claim. Either way we learn the real shape.
