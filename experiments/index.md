---
layout: default
title: Experiments
nav_order: 2
has_children: true
description: "GS methodology experiments — adversarial, benchmark, patchability, replication, and human practitioner studies"
---

# Experiments

The controlled studies below establish the validity and generalizability of the GS methodology; two
June-2026 pilots (MX, RND-1) extend it to model-cost economics and to behaviour under delivery pressure.

| Experiment | What It Tests | Status |
|---|---|---|
| [**AX — Adversarial**](ax/) | Quality as a function of specification completeness. Eight conditions, naive through ForgeCraft treatment v7. RealWorld Conduit benchmark. | ✅ Complete |
| [**BX — Benchmark**](bx/) | Rubric validity. Three Conduit implementations scored blind against the GS rubric — two never exposed to GS. Establishes the rubric captures real quality. | ✅ Complete |
| [**CX — Patchability**](cx/) | GS-specified codebases are more patchable. SWE-bench-style patch tasks on two quality tiers characterized by BX. | ✅ Complete |
| [**RX — Replication**](rx/) | Any reader can reproduce 104 passing tests against a live PostgreSQL instance from a GS document alone. No ForgeCraft required. | ✅ Complete |
| [**EX — Executable Sprint**](ex/) | Full L1–L4 tier proof on the live RealWorld Conduit benchmark. 13/13 behavioral probes, 3/3 env probes, k6 ramp — all green on Railway production. Single session. | ✅ Complete |
| [**KX — Knowledge Retrieval**](kx/) | Routed navigation-tree retrieval beats RAG-dump and no-structure on accuracy and token cost; the CKG divergence replicates on software. | ✅ Complete |
| [**MX — Model Cost & Tiering**](mx/) | Once GS-specified, a mid-tier model (Sonnet) matches a strong model (Opus) at ~6× lower cost on the full Conduit; model-tiering is unjustified when the mid model one-shots the task. | ✅ Pilot (Jun 2026) |
| [**RND-1 — Spec / Verify / Context under Pressure**](rnd-1/) | Which GS arm suppresses under-pressure failure modes (literal-minimum under-spec; test-faking). Prescriptive spec confirmed; verification & bounded-context arms return honest, bounding nulls. | ✅ Pilot (Jun 2026) |

---

## Validation Structure

The experiments address a three-layer validity problem:

| Layer | Threat | Closed By |
|---|---|---|
| **Output measurement** | External checks use criteria the author defined | BX: rubric applied to non-GS implementations |
| **Rubric validity** | Rubric rewards GS compliance, not objective quality | BX + CX: congruent with CVE count, test count, patchability |
| **Guidance circularity** | GS guided the implementation AND scored it | BX: blind evaluator on peer implementations; RX: independent replication; plus observational field corroboration |

Layers 1 and 2 are closed. Layer 3 is addressed by BX/RX and observational field corroboration; a controlled human-participant study is future work.

EX addresses a complementary validity question: **does the methodology produce working, deployable software at all four tiers?** AX proves quality increases with specification completeness — EX proves the toolchain closes the loop from specification to production-verified behavior.

---

## Pre-Registration Policy

AX rubrics, hypotheses, and evaluation criteria were committed to this repository before any experimental run. Commit timestamps are cryptographically signed by GitHub. This prevents post-hoc rubric adjustment.

---

## Reproduce RX Yourself

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d postgres
./runner/run.sh
cat evidence/jest-output.json   # numFailedTests === 0
```
