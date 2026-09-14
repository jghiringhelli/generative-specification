# AX2 — Cross-Model, Powered Replication of AX (mature GS v5.0)

> The IEEE flagship. AX showed disciplined output scores better on one model, one blind rubric. AX2 answers
> the two things reviewers of the current competitive set (traceSDD: cross-model + powered) will demand:
> does the effect **hold across models**, and does it **hold on objective, author-independent metrics** (not
> a self-defined rubric). Spec-first; not run until the IEEE project is committed. Derives evidence for
> Compendium §7.8.B and the IEEE §V/§VI spine (Kitchenham structure).

## Research questions
- **RQ1 — quality.** Holding behaviour constant (same passing conformance oracle), does GS v5.0 produce code
  of higher **objective** quality than naive prompting and than expert prompting (control)?
- **RQ2 — cross-model.** Does the GS advantage hold across models of different capability (frontier, mid,
  weak-local)? (This is the axis AX lacked and the competitive set now requires.)
- **RQ3 — capacity-relative (the novel claim).** Does the GS-versus-naive gap **widen as model capability
  falls**? TX predicts it should; AX2 tests it directly, cross-model. A confirmed widening is a distinctive
  result no competitor reports.

## Design
- **Conditions (per model, prospectively registered):** C1 naive prompt · C2 expert prompt (control) · C3
  GS v5.0 (sentinel + spec + gates, the mature discipline). Optionally C4 GS v5.0 with gates enforced in the
  loop (rework caught), to separate authoring from enforcement.
- **Models (the cross-model axis) — cross-VENDOR, not just cross-capability** (this is what the competitive
  set has and what makes RQ2 credible): a current **Claude** (frontier), a **GPT** family model (JC has
  Copilot access; use the API or Copilot), and **Gemini** if reachable — three vendors defeats the
  "single-vendor artifact" objection. Plus a **weak-local tier via Ollama** (a small code model + a small
  general model, ~3B/8B) for the capacity axis (RQ3). Minimum viable: Claude + GPT + one Ollama model; add
  Gemini and a second Ollama size if access allows.
- **Benchmark:** RealWorld/Conduit (consistent with AX/EX/KX/TX/SX). **Stretch (addresses the single-benchmark
  risk):** a second, different spec (a non-CRUD domain) for generalization; mark as stretch, not required.
- **n and power:** enough independent stateless runs per (condition x model) cell to report effect sizes with
  a real interval, not n=1-2. Target n >= 12-15 per cell; pre-register the target. This is the single biggest
  difference from AX.

## What we measure (chosen deliberately: objective, author-independent, headline-worthy)
Behavioural ground truth (the gate, not a score):
- **Conformance:** the shared Hurl oracle pass rate (functional correctness). A run that does not pass is not
  scored on quality; correctness is the precondition, quality is the question.

Primary objective quality metrics (the headline — NOT the 14-point rubric; these defend against guidance
circularity and author-rubric distrust):
- **Mutation score** (stryker) — the strongest single quality signal.
- **Branch coverage** (real, not line) via c8/istanbul.
- **Cyclomatic complexity** distribution (eslint) — mean and tail.
- **Duplication %** (jscpd) and **dead-code %** (ts-prune).
- **Type health:** tsc --strict passes; count of explicit `any`.
- **Security:** npm audit high/critical count.
- **Size/bounding:** file- and function-length violations.

Secondary (kept, but not the headline):
- The seven-property rubric score (reported for continuity with AX, explicitly NOT the primary claim).
- Per-run cost (tokens) — as context, framed as cost-per-accepted-output, never a reduction %.

## Analysis
- **Effect sizes** (Cliff's delta or Cohen's d) with confidence intervals + **exact p-values** (non-parametric,
  Mann-Whitney/Kruskal-Wallis across conditions), per RQ, one results subsection per RQ (Kitchenham).
- **Report nulls** (GS already does; lean in). If C3 does not beat C2 on a metric, say so.
- **RQ3 test:** regress the (C3 - C1) quality gap on model capability; a negative slope (gap grows as capability
  falls) confirms capacity-relative scaffolding cross-model.
- **Blind:** objective metrics are tool-computed, so scoring is inherently blind; record tool versions + configs.

## Honesty / scope (still bounded)
Two benchmarks at most, a handful of models, one practitioner authoring the specs. The cross-model + powered +
objective-metric design lifts AX2 to the competitive bar, but generalization beyond these benchmarks/models
stays future work. Pair every conceded limit with the result beside it (IEEE reviewer discipline).

## Status
Designed Sep 2026, **not yet run.** It is the deliberate un-park trigger for the IEEE project (see
`project_ieee_strategy_calibration`). First run step: freeze C1/C2/C3 prompts + the model list + the n target,
then run cell by cell (memory-safe, one at a time, the SX lesson). Reuse the SX harness pattern
(`experiments/sx/run_sx.sh`) and the token-visibility parser.
