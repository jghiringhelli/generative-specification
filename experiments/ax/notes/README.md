# White Paper Evidence Package

This folder collects all evidence, data, and artifacts for the paper:
**"Generative Specification: Structured AI Prompting for Production-Quality Code"**

---

## How to Navigate

| Where to look | What you get |
|---|---|
| [RESULTS.md](../RESULTS.md) | Complete results across all sections — the primary evidence document. §14 has treatment-v2 post-hoc data. |
| [data.md](./data.md) | All key numbers in one place, pre-formatted for citation. Four-condition tables. |
| [conclusions.md](./conclusions.md) | **Start here for synthesis.** Defended floor analysis, mutation testing, 12/12 gap analysis, **§8 treatment-v2 confirmation**, **§9 measurement gaps** (E2E/load/pen/lint/audit not run), limitations, next experiments |
| [conditions.md](./conditions.md) | Summary of all four experimental conditions with links to prompts |
| [gs-artifacts.md](./gs-artifacts.md) | What GS actually emits — the treatment artifact set |
| [code-comparison.md](./code-comparison.md) | Side-by-side code quality evidence (interfaces vs concrete, composition root) |
| [experiment-design.md](../../docs/experiment-design.md) | Pre-registered design (pre-dated all experimental runs) |

---

## The Experiment in One Paragraph

Three conditions were run to build the same backend API (RealWorld/Conduit in TypeScript):

1. **Naive** — unstructured prompting: "Build a REST API for Conduit using Node.js and TypeScript."
   No architecture guidance, no error format, no test requirements. Represents *vibe coding*:
   what happens when a junior developer (or non-engineer) hands AI a problem with no scaffolding.

2. **Control** — expert prompting: Full tech stack specification, layered architecture rules,
   error format specification, test naming conventions. Represents *best-practice prompting*
   as a senior engineer might write it — good, but no formal structure (no GS artifacts).

3. **Treatment** — Generative Specification: The full GS artifact cascade: CLAUDE.md, ADRs,
   C4 diagrams, NFRs, use-cases, test architecture doc, pre-defined Prisma schema.
   Same problem, but with GS as the structured specification layer.

4. **Treatment-v2** *(post-hoc, not pre-registered)* — GS v2: Treatment with updated templates
   applying "Emit, Don't Reference" to infrastructure files. First Response Requirements added
   for hooks, CI pipeline, CHANGELOG, and IRepository interfaces.

All four used the same model (claude-sonnet-4-5), same benchmark (RealWorld Conduit API spec),
and same evaluation rubric (blind adversarial GS property audit, real test execution, mutation testing).

---

## Key Findings Summary

### GS Property Audit (0–12, blind adversarial scoring)

| Condition | Score | Notes |
|---|---|---|
| **Naive** | **5/12** | Annotation failure: schema incomplete, 0% real coverage, all test suites fail to compile |
| **Control** | **8/12** | Expert prompting achieves ceiling on 3/6 properties |
| **Treatment** | **9/12** | +1 on Composable only — GS artifacts translated directly to interface-based DI |
| **Treatment-v2** | **12/12** | First perfect score — hooks/CI/CHANGELOG/IRepository emitted in P1 |

**Most important finding:** Expert prompting was *more capable than anticipated*.
It hit the ceiling (2/2) on Self-Describing, Bounded, and Verifiable — the same as GS treatment.
The control condition with explicit architecture instructions produced layered code, proper naming,
custom error classes, and Zod validation — comparable to GS on 5 of 6 properties.

**GS's unique contribution:** The only differentiating dimension was **Composable** (+1).
Treatment's GS artifact: *"Depend on abstractions. Concrete classes are injected, never instantiated inside business logic."*
→ Model emitted: `IUserRepository`, `IArticleRepository` interfaces + explicit composition root in `app.ts`.
Control had constructor injection but against concrete types — functional but not substitutable.

### Defended Property — 0/2 in original three conditions, 2/2 in treatment-v2

The largest finding across the original three conditions. No condition — naive, expert-prompted, or GS —
emitted pre-commit hooks or CI pipelines as actual files. All three described or implied them.
None of them exist in any materialized output.

This is the "Emit vs. Reference" failure at its most consequential: a developer receiving
any of these outputs would have documentation claiming enforcement exists. No enforcement exists.

**Post-hoc resolution:** Treatment-v2 applied "Emit, Don't Reference" to infrastructure files
directly — providing fenced file templates in CLAUDE.md for `.husky/pre-commit`, `.husky/commit-msg`,
`commitlint.config.js`, and a complete `.github/workflows/ci.yml` with `npx stryker run`.
Result: Defended 0→2. The auditor found every hook and CI artifact emitted as a real file in P1.

**Key question answered in [conclusions.md §3 and §8](./conclusions.md):**
Once told to *emit* rather than *describe*, the model emits. The failure was not capability — it was
instruction precision.

### Coverage Hallucination (both expert conditions)

Both conditions reported 90%+ test coverage in documentation.
Real measured coverage: **34% (control)**, **27% (treatment)**.

This is not a GS-specific finding — it's a model-level finding.
Models report aspirational outcomes, not measured ones.

**Corrective action:** Mutation testing added as a hard quality gate to GS templates (commit `482a111`).
Validated by running Stryker on the treatment project post-experiment: 58.62% → 93.10% MSI
in 3 rounds of test improvement. See [RESULTS.md §12](../RESULTS.md).

### Timing: GS was slower per prompt

| Condition | Total time | Avg per prompt |
|---|---|---|
| Control | 747s | 106.7s/prompt |
| Treatment | 766s | 127.6s/prompt |

Treatment generated 13% more code per turn. GS did not reduce generation cost —
it increased output density. The hypothesis (GS pre-resolves decisions, saving time) was falsified.
More accurate framing: GS shifts model behavior toward producing more comprehensive implementations.

### Naive Condition — Why It Matters

This is not primarily a comparison point for GS. It is an honest baseline.

The de facto deployment pattern for AI in most organizations is: senior engineers are behind
on AI adoption, and juniors/non-engineers are using it without structure ("vibe coding").
The naive condition is that pattern. It documents what the cost of no structure is —
in terms of architecture quality, testability, and code reliability — on a real-world benchmark.

**The annotation failure** is the naive condition's most important specific finding:
the model described four Prisma models in non-path-annotated prose blocks. The materializer
extracted zero of them. The test suite references all four. Every test suite fails to compile.
Real coverage: 0%. See [conclusions.md §5](./conclusions.md) for the full analysis.

GS is one answer to that cost. Expert prompting is another. The naive baseline makes the
magnitude of the problem visible before discussing solutions.

---

## Honest Limitations

- **Single model**: claude-sonnet-4-5 only. A stronger or weaker model may shift all scores.
- **Single run per condition**: Not replicated. Results are direction indicators, not statistical facts.
- **Author bias**: GS was designed by the same team running the experiment.
  Expert prompting control (Amendment A) was added specifically to narrow the expected GS advantage.
- **n=1 on Naive**: Run completed (session `236a3efd`). Single run only — not replicated.
- **Ceiling/floor effects**: The GS property rubric saturates at 2/2 per dimension.
  A higher-resolution rubric would likely show larger treatment-control differences.

---

## File Inventory

### This folder (`experiments/white-paper/`)
- `README.md` — this file
- `conclusions.md` — **analytical synthesis: Defended floor, mutation testing, perfect score analysis, limitations** (start here)
- `data.md` — all numeric results, pre-formatted for citation
- `conditions.md` — three-condition comparison with prompts summary
- `gs-artifacts.md` — the GS artifact set (what treatment received)
- `code-comparison.md` — illustrative code quality differences

### Parent folder (`experiments/`)
- `RESULTS.md` — complete 12-section results document (primary evidence)
- `REALWORLD_API_SPEC.md` — the benchmark specification used
- `docker-compose.yml` — DB infrastructure for all three conditions
- `control/`, `treatment/`, `naive/` — condition inputs + outputs
- `runner/` — automated experiment infrastructure (run-experiment.ts, audit.ts, etc.)

### Repository root (`forgecraft-mcp/`)
- `templates/universal/instructions.yaml` — GS template (post-experiment improvements included)
- `docs/experiment-design.md` — pre-registered design document
- `docs/adrs/` — ADRs for ForgeCraft itself (GS self-applies)
