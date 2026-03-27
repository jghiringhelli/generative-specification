# Ax Experiment — Multi-Agent Adversarial Study

**Ax** is a controlled, multi-agent adversarial experiment measuring the effect of
[Generative Specification (GS)](https://github.com/jghiringhelli/generative-specification)
artifacts on AI-assisted software development quality. The study runs eight conditions —
from a completely artifact-free naive baseline through six progressively richer treatment
levels (v1–v6) — all against the same benchmark task.

## Conditions

| Directory | Label | Description |
|---|---|---|
| `naive/` | Naive | No prompting strategy, no GS artifacts. Raw capability baseline. |
| `control/` | Expert-prompting control | Expert prompt engineering only — no GS artifacts. Isolates prompting skill. |
| `treatment/` | Treatment v1 | GS artifact cascade (CLAUDE.md, ADRs, diagrams, schema). |
| `treatment-v2/` | Treatment v2 | v1 + ForgeCraft pre-commit hooks and verification protocol. |
| `treatment-v3/` | Treatment v3 | v2 + full ForgeCraft scaffold (Status.md, C4 diagrams, Mermaid flows). |
| `treatment-v4/` | Treatment v4 | v3 + adversarial review agent (second model challenges each commit). |
| `treatment-v5/` | Treatment v5 | v4 + multi-turn correction loop (agent self-repairs on reviewer feedback). |

## Benchmark

**RealWorld (Conduit) API** — the standard fullstack benchmark used across the industry:
<https://github.com/realworld-apps/realworld>

All eight conditions implement the same backend API from the same specification
(`REALWORLD_API_SPEC.md`). Evaluation is automated and human-reviewed against a shared
rubric (`RESULTS.md`).

## Verifying Pre-Registration

Pre-registration commit hashes in the source repository
(`github.com/jghiringhelli/forgecraft-mcp`):

| Commit | Event |
|---|---|
| `bd2c05b` | Naive condition pre-registered |
| `7661e62` | Control condition pre-registered |
| `7e06e78` | Treatment v1 pre-registered |
| `6c24f6d` | Treatment v2–v3 pre-registered |
| `482a111` | Treatment v4–v5 pre-registered |

To verify: clone the `forgecraft-mcp` repository and inspect each commit timestamp.
The implementation sessions for each condition began only after the corresponding
pre-registration commit. The supplement documents the full chain of custody.

## Evidence Location

Each condition directory contains an `evaluation/` subdirectory with:

- `evaluation/scores.md` — per-endpoint pass/fail scores and aggregate totals
- `evaluation/metrics.md` — code quality metrics (coverage, lint, type errors, test counts)

Aggregate results across all conditions are in `RESULTS.md`.

## White Paper & Supplement

The full experiment design, statistical analysis, and conclusions are in:

- [`white-paper/README.md`](white-paper/README.md) — entry point
- [`white-paper/conditions.md`](white-paper/conditions.md) — condition definitions and protocol
- [`white-paper/data.md`](white-paper/data.md) — raw data tables
- [`white-paper/metrics.md`](white-paper/metrics.md) — metric definitions
- [`white-paper/scores.md`](white-paper/scores.md) — scoring rubric
- [`white-paper/conclusions.md`](white-paper/conclusions.md) — findings and implications
- [`white-paper/gs-artifacts.md`](white-paper/gs-artifacts.md) — GS artifact inventory
- [`white-paper/code-comparison.md`](white-paper/code-comparison.md) — side-by-side code analysis
