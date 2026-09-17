# §V — Study Design (draft v0.1)

> Ported from `GS_Experiment_Supplement.md` §S1-S4, restructured into Kitchenham's six subsections per the IEEE Access house form. Metrics of record are OBJECTIVE and rubric-independent (the Gate); the 7-property audit appears only as a secondary, convergent instrument, never as the evidence of record.
## V.A Research questions

The study evaluates whether a Generative Specification (GS) artifact cascade changes the quality of code an AI coding agent produces, and whether any change is attributable to the specification structure rather than to prompting effort or model capability. Four research questions:

- **RQ1.** Does a GS artifact cascade produce higher-quality code than unstructured ("vibe coding") AI use?
- **RQ2.** Does GS produce higher-quality code than *expert-level prompting without GS artifacts* — i.e., does the structure add value over good prompting alone?
- **RQ3.** Are observed quality gaps *specifiable and recoverable* — i.e., attributable to what the specification did or did not close, rather than to model nondeterminism?
- **RQ4.** Do objective, rubric-independent metrics (mutation score, executed coverage, static-analysis defects) corroborate a blind expert assessment of the same artifacts?

RQ2 is the load-bearing question: the control isolates the value of the artifacts from the value of skilled prompting.

## V.B Design and context

A **pre-registered**, controlled, multi-condition comparison. The design, the scoring rubric, and the point predictions were committed to version control **before any experimental run** (commit `bd2c05b`); no condition, prompt, or metric was altered post hoc except the two explicitly-labelled post-hoc conditions (V.C, Treatment-v2 onward), which are reported separately and never mixed with the pre-registered results.

All conditions generate the **same target system** from the **same published specification**, using the **same model** (`claude-sonnet-4-5`), the **same tool configuration** (no tools, strict MCP config), and the **same infrastructure** (Docker Compose, PostgreSQL 15). The only variable across the three pre-registered conditions is the **specification context** supplied to the agent. Holding model, target, and infrastructure fixed isolates the specification as the independent variable.

## V.C Tasks and instruments

**Target (the task).** The **RealWorld ("Conduit") API** — a standard full-featured REST API (JWT auth, user profiles, articles with slugs, comments, tags, favourites, social following). Chosen because its **published specification permits blind conformance checking**, a standard Postman collection allows independent verification, and it is widely known (aiding reproducibility). The benchmark spec is committed (`experiments/REALWORLD_API_SPEC.md`).

**Conditions (the instrument = the specification context).**

| Condition | Role | Specification context supplied | Prompt style |
|---|---|---|---|
| **Naive** | Unstructured baseline (vibe coding) | Spec + 3-line README | 6 prompts, ~4 lines each; no architecture, error format, or test guidance |
| **Control** | Expert-prompting baseline (no GS artifacts) | Spec + detailed README: stack, layered-architecture boundary rules, error format, naming, 80% coverage target | 7 prompts, ~30 lines each, feature-level architectural requirements |
| **Treatment (GS v1)** | Full GS artifact cascade | 17 files: architectural constitution (`CLAUDE.md`), status tracker, pre-defined Prisma schema, ADR-0001..0004, C4 diagrams, sequence diagrams, 14 use cases with acceptance criteria, test architecture, NFRs, tech spec | 6 prompts, ~8 lines each (brief; the artifacts carry the specification) |

The Control condition is deliberately strong: it encodes what a skilled senior engineer would put in a prompt (hard boundary rules such as *no direct `prisma.*` in route files*, a Zod validation + `{"errors":{"body":[...]}}`/HTTP-422 error contract, a coverage target). The Treatment must beat this, not merely beat the naive baseline.

**Post-hoc conditions** (labelled, not pre-registered): Treatment-v2 onward apply targeted template changes derived from a gap analysis (e.g. explicit repository interfaces; fenced-file hook/CI templates; a First-Response-Requirements list enforcing *"a file referenced but not emitted does not exist"*). They test RQ3 (are gaps specifiable and recoverable) and are reported as post-hoc analysis (§VI), never merged into the pre-registered comparison.

## V.D Subjects (generation runs) and N

The "subjects" are **generation sessions**, not human participants. Each pre-registered condition is run **five times (k=5)** as independent stateless generations of the same model under a fixed configuration, with all session identifiers and their raw outputs committed to the replication package. The design is **single-model and single-benchmark**: a controlled study under pre-registration, not a sampled human study. Its scope limits (one primary model, one benchmark) are owned in Threats to Validity (§VII); the cross-vendor replication of the structural comparison (§VI) tests the single-model limit directly.

## V.E Measurement

**Metrics of record are objective and rubric-independent**, computed by committed automated runners, not by human or model judgement:

1. **Mutation score** (Stryker) — the primary behavioural-verification metric: the fraction of injected faults the test suite actually catches. Chosen over line coverage because coverage rewards executing code, not asserting behaviour.
2. **Executed test coverage** — `jest --coverage` run against a **live PostgreSQL** instance (Docker), materialising the generated code and installing dependencies. This is *executed* coverage, distinct from **AI-reported coverage**, which the study finds to be hallucinated in every condition that reported it (e.g. a claimed 93.1% against a measured value the suite could not support until assertions were added — §VI).
3. **Static-analysis defects** — `tsc --noEmit` (strict) type-error count; ESLint problem count; `npm audit` CVE count. No running server required.
4. **Architectural conformance** — layer-boundary violations (static grep for `prisma.*` in route files) and materialised-artifact completeness (file-presence checks).

**Secondary / convergent instrument (not the evidence of record).** A **blind adversarial audit**: each condition's output was scored by a *separate* model session with **no knowledge of the experiment, the GS methodology, or the paper**, given only the properties as an independent rubric and instructed to score what is *materially present in the output directory*, not what the documentation *claims*. The audit is used solely for **convergent validity** with the objective metrics (RQ4); its numeric rubric is an internal instrument and is not reported as a headline result.

## V.F Analysis procedure and statistics

Each objective metric is compared **across conditions** (Naive vs Control vs Treatment) as observed values; **within-condition** mutation-testing progression (baseline → targeted-assertion rounds) is reported as evidence for RQ3 (specifiability). Convergence between the objective metrics and the blind audit is assessed for RQ4.

**Statistical analysis.** With k=5 independent generations per condition, the study reports distributions rather than point estimates. Pairwise comparisons between conditions use the exact two-sided Mann-Whitney U test with Cliff's delta as the effect size and Holm-Bonferroni correction across the metric family, with a Kruskal-Wallis omnibus across the three conditions reported before the pairwise tests. We state the resolution limits explicitly: at five versus five the minimum achievable exact two-sided p is approximately 0.008, so a corrected-significant cell carries coarse resolution, and a Cliff's delta of 1.0 denotes complete separation in five draws rather than a tightly estimated magnitude (its confidence interval is wide). The basis for confidence is therefore the pre-registration, the objectivity and reproducibility of the metrics, and a blind audit, corroborated by the size and direction of the effects, not high statistical power. Single deep-construction runs (the AX-T8 mutation and coverage progression) are reported separately and labeled as such, never merged into the k=5 distributional claims. Higher-powered replication and a second, non-memorized benchmark are stated as future work in §VII.

## V.G Replication package

Every number is reproducible from committed primary sources: the benchmark spec, the Docker Compose infrastructure, the per-condition session IDs and runner flags, the automated runners (`evaluate.ts`, `run-tests.ts`, `audit.ts`, Stryker config), and the GS artifact cascade. These are packaged with a persistent **Zenodo DOI** (the replication package, distinct from the paper's preprint DOI `10.5281/zenodo.21726017`), so a researcher with the benchmark and model access can reproduce every reported value.
