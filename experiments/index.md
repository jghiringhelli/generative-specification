---
layout: default
title: Experiments
nav_order: 2
has_children: true
description: "GS methodology experiments — adversarial, benchmark, patchability, replication, and human practitioner studies"
---

# Experiments

Six studies establish the validity and generalizability of the GS methodology.

| Experiment | What It Tests | Status |
|---|---|---|
| [**AX — Adversarial**](ax/) | Quality as a function of specification completeness. Eight conditions, naive through ForgeCraft treatment v7. RealWorld Conduit benchmark. | ✅ Complete |
| [**BX — Benchmark**](bx/) | Rubric validity. Three Conduit implementations scored blind against the GS rubric — two never exposed to GS. Establishes the rubric captures real quality. | ✅ Complete |
| [**CX — Patchability**](cx/) | GS-specified codebases are more patchable. SWE-bench-style patch tasks on two quality tiers characterized by BX. | ✅ Complete |
| [**RX — Replication**](rx/) | Any reader can reproduce 104 passing tests against a live PostgreSQL instance from a GS document alone. No ForgeCraft required. | ✅ Complete |
| [**DX — Human Practitioner**](dx/) | 40 developers, two conditions. Tests between-practitioner replication across engineers of varying GS skill. Crossover design. | 🗓 April 2026 |
| [**EX — Executable Sprint**](ex/) | Full L1–L4 tier proof on the live RealWorld Conduit benchmark. 13/13 behavioral probes, 3/3 env probes, k6 ramp — all green on Railway production. Single session. | ✅ Complete |

---

## Validation Structure

The five experiments address a three-layer validity problem:

| Layer | Threat | Closed By |
|---|---|---|
| **Output measurement** | External checks use criteria the author defined | BX: rubric applied to non-GS implementations |
| **Rubric validity** | Rubric rewards GS compliance, not objective quality | BX + CX: congruent with CVE count, test count, patchability |
| **Guidance circularity** | GS guided the implementation AND scored it | DX: blind evaluator, 40 external practitioners |

Layers 1 and 2 are closed. Layer 3 closes April 2026.

EX addresses a complementary validity question: **does the methodology produce working, deployable software at all four tiers?** AX proves quality increases with specification completeness — EX proves the toolchain closes the loop from specification to production-verified behavior.

---

## Pre-Registration Policy

AX and DX rubrics, hypotheses, and evaluation criteria were committed to this repository before any experimental run. Commit timestamps are cryptographically signed by GitHub. This prevents post-hoc rubric adjustment.

---

## Reproduce RX Yourself

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d postgres
./runner/run.sh
cat evidence/jest-output.json   # numFailedTests === 0
```
