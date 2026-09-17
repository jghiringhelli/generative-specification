# AX Replication Protocol (Option B) — multi-run for inferential statistics

> The k-replication design for §V-VI: five independent generations per condition so the study reports distributions, effect sizes, and significance tests rather than point estimates. This file is the pre-registered design and analysis plan; it was committed before the replication runs and the runs were executed with the harness in `experiments/ax/runner/`.

## Why
The single-run design gives observed deltas but no sampling distribution → no honest inferential test. Replicating each condition k times (varying only the session, i.e. model nondeterminism) yields a distribution per condition per metric → real effect sizes + significance, and directly answers the "single run" reviewer reflex.

## Design
- **Conditions (unchanged, the 3 pre-registered):** Naive · Control (expert prompting) · Treatment (GS v1). Post-hoc conditions stay separate.
- **Replications:** **k = 10 per condition** (minimum k = 5 if budget-constrained; 10 gives usable power for non-parametric tests). Total = 30 (or 15) generation runs.
- **What varies within a condition:** ONLY the model session (nondeterminism). Same model (`claude-sonnet-4-5`), same prompts, same spec context, same tool config, same Docker/PostgreSQL, same runner flags. Seeds/sessions logged.
- **What is fixed:** everything else. This isolates model-nondeterminism as the only within-condition variance, so between-condition differences are attributable to the specification context.
- **Blind adversarial audit:** each of the 30 outputs audited by a fresh context-free session (as before) — now yielding an audit-score distribution per condition too (secondary/convergent instrument).

## Metrics (per run — all objective, automated, the metrics of record)
1. **Mutation score** (Stryker) — primary.
2. **Executed coverage** (`jest --coverage` vs live PostgreSQL) — not AI-reported.
3. **Static defects:** `tsc --noEmit` strict error count · ESLint problems (use a fixed shared config, e.g. `@typescript-eslint/recommended`, NOT `--no-eslintrc`, so the metric is stable across runs) · `npm audit` CVE count.
4. **Architectural conformance:** layer-boundary violations (grep `prisma.*` in route files) · materialised-artifact completeness.
5. **Secondary:** blind-audit score (convergent only).

**Materialisation caveat:** the naive annotation failure (§S8) is a mechanical artifact of unannotated code blocks. Decide up front and pre-register: either (a) score materialisation-as-emitted (naive's 0% is a real GS failure — Self-describing/emit discipline), or (b) add a fallback extractor and report both. Recommend (a) with the mechanism explained — it is a genuine property failure, not a measurement bug — but state it explicitly so it is not read as cherry-picking.

## Analysis plan (finalize against exemplars)
- **Per metric, per condition:** report **mean ± SD** (and median + IQR; distributions may be non-normal at k=10).
- **Between-condition comparisons:** non-parametric given small k — **Kruskal-Wallis** across the three conditions per metric, then **pairwise Mann-Whitney U** for the two contrasts of record (Treatment vs Naive = RQ1; **Treatment vs Control = RQ2, the load-bearing one**), with **Holm-Bonferroni** correction for multiple comparisons.
- **Effect size:** **Cliff's delta** (non-parametric, appropriate for small k) alongside the raw metric delta in %.
- **Report exact p-values and effect sizes together**, and **report nulls explicitly** (e.g. if Treatment vs Control is null on some metric, say so — that is honest and expected on some axes, e.g. npm-audit CVEs were orthogonal in the single run).
- **RQ3 (specifiability):** the within-condition mutation-progression evidence stays as a separate targeted-improvement analysis (not part of the between-condition test).
- **RQ4 (convergence):** correlate the objective metrics with the blind-audit distribution (Spearman) to show the audit tracks the objective signal.

## Pre-registration additions (commit before running)
- [ ] This protocol committed (hash logged) BEFORE any replication run.
- [ ] Point predictions per metric per condition (directional, e.g. "Treatment > Control on mutation score; null-or-small on CVEs").
- [ ] The materialisation-scoring decision (a or b) fixed.
- [ ] k and the stopping rule fixed (no peeking-and-adding runs).

## Runner and execution status
The generation and measurement harness lives in `experiments/ax/runner/` (`generate.cjs`, `materialize.cjs`, `measure.cjs`, `audit.cjs`, `aggregate.cjs`, `stats.py`) with the pinned tool versions in `package.json`. The k=5 study across the three pre-registered conditions was executed with it (per-condition, per-replication session IDs, token/cost, objective metrics, and two blind-audit passes are in the committed `results.csv`, `results.json`, and `stats.json`). The replication package ships this runner so every reported cell is traceable to a runnable script and a logged session; the raw generation outputs and the benchmark spec are committed alongside. Environment: Docker, Claude CLI, Node present per the package manifest.

## Execution (JC's infra — turnkey checklist)
- [ ] **Reconstruct the AX runner first** (it is absent — see above). Then confirm end-to-end on one condition (smoke test).
- [ ] Run k replications × 3 conditions via `experiments/runner/` (log every session ID + flags).
- [ ] Run the automated metric collection + Stryker + jest-coverage + static checks per output.
- [ ] Run the blind audit per output (fresh sessions).
- [ ] Dump per-run metrics to a tidy CSV (one row per run) → feeds the analysis.
- [ ] Package raw outputs + CSV + scripts as the Zenodo replication package (DOI).

**Cost/time note:** 30 generations + 30 audits of Sonnet is modest (Sonnet is cheap and fast per the model-tiering finding). The bottleneck is the runner working end-to-end and the metric harness, not API cost. If budget-tight, k=5 still beats N=1 decisively.

---

## Exemplar validation (from published, verified IEEE/TOSEM/EMSE papers — Sept 2026)

The analysis plan above is **confirmed by what accepted papers in this exact space do**. Fold these in:

**Stats apparatus — matches accepted practice** (ACM TOSEM "Non-determinism of ChatGPT" 10.1145/3697010 uses Kruskal-Wallis; the LLM-secure-code study arXiv 2408.06428 uses Mann-Whitney U + rank-biserial; the EMSE data-science benchmarking paper 10.1007/s10664-026-10927-y uses **Wilcoxon signed-rank + Cliff's delta + Holm** — our exact plan). So: Kruskal-Wallis across conditions → pairwise Mann-Whitney U (or Wilcoxon if paired by task-stratum) → Cliff's delta with **magnitude bands** (negligible/small/medium/large) → Holm correction → exact p + CI, α=0.05. This is the recognized rigor signature.

**Cite as the rigor scaffold** (pre-empts "is this rigorous?"): **Wohlin et al., *Experimentation in Software Engineering*** (the four-bucket threats) + **Kitchenham** (empirical guidelines) + the **"Guidelines for Empirical Studies in SE involving LLMs"** (arXiv 2508.15503, llm-guidelines.org — its checklist: declare model name+version, seeds, prompts+logs, human validation of automated outputs, an open-model baseline) + the **reference framework** arXiv 2510.03862. Citing 2508.15503 explicitly is an uncommon, strong rigor move.

**Results section = per-RQ, each with a boxed Finding** (both TOSEM and the secure-code paper box the takeaway): descriptive table (per-condition medians + dispersion) → test result (exact p, Cliff's δ + band, CI) → a one-line boxed "Answer to RQx." **Report nulls in the SAME voice as positives** — the single biggest credibility move for a proponent-authored study (report where GS ties/loses, e.g. the orthogonal npm-audit result).

**Best two to model on (match their sectioning so reviewers recognize the house style):** (1) ACM TOSEM "Non-determinism of ChatGPT" — cleanest per-RQ Results architecture; (2) **IEEE Access** "Model-Agnostic Empirical Evaluation of Test-Driven Prompt Engineering" (10.1109/ACCESS.2026.3662817) — SAME venue + near-identical shape (a prompting/spec *discipline* evaluated model-agnostically over multiple benchmarks with Wilcoxon). Model the IEEE Access framing on this one.

**Two weaknesses the exemplars expose — decide before running:**
1. **Single benchmark (Conduit).** The strong exemplars run 3 benchmarks (HumanEval + MBPP/APPS + CodeContests) precisely to kill "one dataset." We have one. Two honest options: (a) **stratify Conduit** (by feature-area difficulty: auth / articles / comments / social) and report per-stratum, + own single-benchmark scope under External validity with a "future replication" sentence; or (b) **add a 2nd target** (a different API spec) as a replication — much stronger, more runs. Recommend at least (a); (b) if time allows.
2. **Single model (Sonnet).** The LLM-guidelines checklist wants an **open-model baseline**. Adding one open-weights coder (e.g. a Qwen/Llama coder) as a baseline condition would support any "model-agnostic" framing and pre-empt proponent-bias. Optional but strengthening. If kept single-model, own it under External validity.

**Blind-audit rigor:** with k replications, run the blind audit with ≥2 independent auditor sessions per output and report **inter-rater agreement (Cohen's κ)** — turns the audit from one opinion into a measured instrument.

**Section form (IEEE Access house):** "III. STUDY DESIGN" (Roman numeral, ALL-CAPS, lettered subsections): A. Goal, RQs & Hypotheses (state null hypotheses explicitly) · B. Study Context & Conditions · C. Treatments & Instrumentation · D. Metrics & Operationalization (state each metric's construct limitation HERE, before a reviewer does) · E. Analysis Procedure (tests named up front) · F. Threats to Validity. Align §V (`05-...md`) to this A-F when assembling.
