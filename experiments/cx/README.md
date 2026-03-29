---
layout: default
title: "CX — Patchability Study"
parent: Experiments
nav_order: 3
description: "Cross-validation of GS patchability claim. SWE-bench-style patch tasks on two quality tiers. GS-specified codebase shows higher patch success rate."
---

# CX — Conduit Patch Experiment

## Purpose

Cross-validation of the GS claim that a well-specified codebase is more patchable than an unspecified one. Inspired by SWE-bench's patch-application methodology but scoped to a single domain (RealWorld Conduit) with two quality tiers already characterized by BX.

## Design

**Conditions:**
- **v7** — GS treatment-v7, rubric score 13/14, Hurl 13/13, 146 tests
- **repo-b** — gothinkster/node-express-realworld-example-app, rubric score 7/14, 27 tests (BX repo B)

**Task structure:** 5 patch tasks, one per SWE-bench structural class. Each task is presented as an issue description to Claude. Gate: patch compiles + relevant tests pass. No rubric involved.

**Hypothesis:** v7 passes more patch tasks than repo-b because GS navigability properties (Self-describing, Bounded, Composable) reduce the AI's ambiguity about where to make changes.

## SWE-bench Class Mapping

| Task | Class | GS property tested |
|---|---|---|
| CX-1 | Multi-file propagation | Bounded + Composable |
| CX-2 | Contract mismatch | Verifiable |
| CX-3 | Missing error case | Executable |
| CX-4 | Config/constant extraction | Bounded |
| CX-5 | Validation rule addition | Verifiable |

## Tasks

See `tasks/` directory for individual issue descriptions.

## Results

See `results/v7/` and `results/repo-b/` for patch outputs and pass/fail per task.
