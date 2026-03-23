---
layout: default
title: Experiments
nav_order: 2
has_children: false
description: "GS methodology experiments — adversarial, replication, and human practitioner studies"
---

# Experiments

Three studies establish the quality gradient produced by GS methodology under controlled and field conditions.

| Experiment | Description | Status |
|---|---|---|
| [**AX — Adversarial**](ax/) | Seven prompting conditions from naive to ForgeCraft treatment v5. RealWorld Conduit API benchmark. Establishes quality as a function of specification completeness. | Complete |
| [**RX — Replication**](rx/) | Any reader can independently reproduce 104 passing tests against a live PostgreSQL instance using only the committed GS document and Docker. | Complete |
| [**DX — Human Practitioner**](dx/) | 40 developers. Group A: prompt-driven. Group B: GS + ForgeCraft. Dual rubric evaluation. | April 2026 |

---

## Pre-Registration Policy

AX and DX rubrics, hypotheses, and evaluation criteria were committed to this repository before any experimental run. Commit timestamps are cryptographically signed by GitHub. This prevents post-hoc rubric adjustment — a standard confound in AI evaluation studies.

---

## AX Summary

The adversarial experiment varied specification completeness across seven conditions:

| Condition | Description |
|---|---|
| Naive | Free-form prompting, no methodology |
| Control | Expert prompt engineering, no GS document |
| Treatment v1–v5 | Progressive GS document completeness under ForgeCraft |

Key finding: quality score is a monotonic function of specification completeness. The gap between expert prompt engineering (control) and ForgeCraft treatment v5 was statistically significant on the RealWorld Conduit rubric.

Full evidence: [`experiments/ax/`](ax/)

---

## RX: Reproduce It Yourself

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d postgres
./runner/run.sh
cat evidence/jest-output.json   # numFailedTests === 0
```

The GS document (`experiments/rx/spec/conduit-gs.md`) is the reproducible artifact. ForgeCraft produced it, but you do not need ForgeCraft to run this experiment.

---

## DX: What to Expect

40 developers split into two groups. Both groups implement the same feature from the same requirements document. Group B receives the GS methodology and ForgeCraft tooling. Evaluation uses the same dual rubric as AX.

If you are a developer interested in participating, contact [jcghiri@gmail.com](mailto:jcghiri@gmail.com).
