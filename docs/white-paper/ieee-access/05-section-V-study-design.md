# §V — Study Design (draft v0.3)

> Kitchenham-style subsections. Metrics of record are static and emission counts; the seven-property audit is secondary. Every number traces to `experiments/ax/runner/` (`results.csv`, `stats.json`).

## V. STUDY DESIGN

### A. Research questions

RQ1 to RQ4 are stated in Section I. RQ2 is load-bearing: the expert-prompt control separates the value of the artifacts from the value of skilled prompting.

### B. Design and context

A controlled three-condition comparison in two stages. **Stage 1 (March 2026):** one generation per condition, with the design, the rubric and ten point predictions committed to version control before the runs. The commit identifiers (for example `bd2c05b`) are recorded in the Supplement but are not present in the public repository, whose history begins on 16 March 2026, so this registration is author-attested and not independently timestamped. **Stage 2 (replication):** the same conditions re-run as five independent generations each. Its analysis plan (supplement S1) cannot be shown from commit history to precede the runs, so Stage 2 is pre-specified in intent and not registered. Conditions after the first three are post-hoc, single runs, each designed after a gap analysis of its predecessors; they are reported separately as a diagnostic series (VI.C, VI.E) and never mixed with the comparison. All conditions generate the same system from the same published specification with the same model (`claude-sonnet-4-5`), no tool use during generation, and the same infrastructure (Docker Compose, PostgreSQL 15). Only the specification context varies.

### C. Task and conditions

The task is the RealWorld "Conduit" backend [46]: JWT authentication, profiles, articles with slugs, comments, tags, favourites and following, in TypeScript, Express and Prisma. Files are emitted as path-annotated code blocks that a runner materializes; a block without a path header is a file that does not exist.

| Condition | Role | Context supplied | Prompts |
|---|---|---|---|
| **Naive** | Unstructured baseline | Specification and a three-line README | 6 of about 4 lines |
| **Control** | Expert prompt, no GS artifacts | Specification and a README stating the stack, the layering boundary (no direct database-client calls in route files), the error contract, naming and an 80% coverage target | 7 of about 30 lines |
| **Treatment (GS v1)** | Full GS cascade | 17 files: constitution, status file, predefined schema, four ADRs, C4 and sequence diagrams, fourteen use cases with acceptance criteria, test architecture, non-functional requirements, technical specification | 6 of about 8 lines |

The control is deliberately strong and contains the layering rule that the layer-violation metric counts. The emit rule was imposed in the two structured conditions and not in the naive one.

### D. Subjects and N

The subjects are generation sessions, not people: five independent stateless generations per condition (k = 5), with session identifiers and raw outputs in the replication package.

### E. Measurement

Replicated metrics: layer-boundary violations (a count of `prisma.*` calls in route files, normalized also per TypeScript file), files and test files emitted, `tsc --strict` errors, ESLint problems (also per file), `npm audit` vulnerabilities, and generation cost. Each is computed by committed scripts. **Collected versus planned:** mutation score (Stryker) and executed coverage were planned as metrics of record but were not obtained for the control and treatment runs of the replication (the fields are empty in `results.csv`); they exist only for single deep runs (VI.C, VI.E). In the original single run, AI-reported coverage far exceeded measured coverage (a claimed 93.1% against a measured line coverage of 27.6% for the treatment), which is why self-reported figures are excluded.

**Secondary instrument.** A seven-property audit (0 to 2 each): two fresh sessions of the same model family (`claude-sonnet-4-5`) scored each output directory with one prompt, with no knowledge of the study or of GS, scoring what is materially present. "Blind" is limited: the artifacts usually reveal the condition, the auditor shares a model family with the generator, and the two auditors are two runs of one prompt and not independent raters.

### F. Analysis

Per metric and condition we report median and quartiles (medians of the lower and upper halves). Pairwise comparisons use the exact two-sided Mann-Whitney U test [51] with Cliff's delta [52] and Holm correction [56] within each metric's three comparisons. At five against five the smallest exact p is about 0.008, so a delta of 1.0 means no overlap in five draws and not a tightly estimated magnitude. Auditor agreement is a quadratic-weighted kappa [53] over 105 property-level pairs, read with the conventional bands [54]. Single deep runs are labelled and never merged into the distributional claims.

### G. Replication package

The benchmark specification, the Docker Compose infrastructure, per-condition session identifiers and flags, the runners (`generate.cjs`, `materialize.cjs`, `measure.cjs`, `audit.cjs`, `stats.py`) and the GS cascade are public in the repository; a Zenodo DOI for the package, distinct from the preprint DOI `10.5281/zenodo.21726017`, is to be created at submission.
