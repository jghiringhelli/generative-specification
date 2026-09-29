---
layout: default
title: Remediate an existing system
parent: Practice
nav_order: 7
permalink: /practice/remediation/
description: "Oracle tests, prioritized remediation and strangler-style replacement for an existing system that is already under a spec, sentinel and verification layer."
---

# Remediate an existing system

> In the workshop this is called **Anneal** (Stage 6).

This is how an existing system is renewed: protect it with oracle tests, remediate in priority order under cascade discipline, and, for large systems, replace it module by module rather than rewriting it. When remediation is done, the remediated module can be treated as a new project.

For the recurring part, when each structural check runs and how a finding is fixed without weakening the gate, see [Run structural gates and remediate](../structural-gates/).

## Prerequisites

You cannot safely remediate code that isn't yet protected. This page assumes the existing project already has the three things below. If it doesn't, install them first: [Existing project](../existing-project/) walks all three in sequence (steps 03 to 06), starting from the audit you ran in [Orient](../orient/).

| Prerequisite | What it is | Where |
| --- | --- | --- |
| **Spec from code** | `docs/spec/SPEC.md` generated from what exists | [Existing project, step 03](../existing-project/) |
| **Sentinel** | `CONSTITUTION.md`: navigation tree over docs, code and disciplines | [Existing project, step 05](../existing-project/) |
| **Verification layer** | hooks, CI and quality gates | [Existing project, step 06](../existing-project/) |

**Already have all three?** Continue with step 01. The oracle tests you write next are the one piece of the verification layer that remediation itself adds: characterization tests that pin current behavior before you change it.

## Step 01: oracle tests

*Boundary tests before touching structural code.*

Before changing anything structural, install oracle tests at the system boundary. These tests verify the existing behavior, not the intended behavior. They are your safety net during remediation. If a remediation breaks an oracle test, you have changed behavior, not just structure.

**Prompt: install oracle tests**

```
Read docs/spec/SPEC.md and CONSTITUTION.md.
Install oracle tests at the system boundary BEFORE any structural changes.

For each HTTP endpoint (or equivalent system boundary):
1. Write an integration test that verifies the current behavior — what it
   actually does today.
2. Write an error-path test for each failure mode.
3. Place all oracle tests in: tests/oracle/
4. These tests must NOT change during remediation. If one fails after a
   refactor, stop.

Commit: test(oracle): install boundary tests before remediation

After all oracle tests pass: run the GS audit again — the score is
your baseline.
```

## Step 02: remediation

*Priority order, cascade discipline throughout.*

Apply the remediation plan from your audit under full cascade discipline. Work in priority order: highest-impact, lowest-score properties first. Each item is one of three operation types: refactor, fix, or new spec entry. The verification layer rejects any commit that skips the discipline.

**Prompt: execute the remediation plan**

```
Read docs/spec/SPEC.md, CONSTITUTION.md, and the GS audit report from
the audit step.
Apply the remediation plan in priority order.

Rules:
1. Work one item at a time. Complete and commit before starting the next.
2. Each remediation item is one of:
   - REFACTOR: ADR first → structural change → oracle tests still pass
   - FIX: failing test first → patch → oracle tests still pass
   - SPEC UPDATE: add missing F-NNN or NFR to SPEC.md → derive code from it
3. After every 3 items, run the full test suite including oracle tests.
4. Update STATUS.md after each session.
5. Pause before: any DB schema change, any public API change, any change
   touching more than 10 files.

After completing the remediation plan, run the GS audit again for the
after-score.
```

## Step 03: large codebases, replace incrementally

*Replace the old system module by module, never as a big-bang rewrite.*

**For large existing systems,** don't apply Tier 2 to the whole codebase at once. Identify the seam: the boundary where new GS-disciplined code will grow. Apply NFR gates and a CD pipeline to the new module only. Route a percentage of traffic to it. The old code degrades gracefully as the new module grows. This is the strangler fig pattern applied to GS adoption: the new system gradually replaces the old one without a big-bang rewrite.

## Step 04: start the next module

*Remediation feeds back into orientation.*

Once remediated, the module is spec-governed, verified and disciplined. New work on it follows the ongoing loop from [New project](../new-project/). Then repeat from [Orient](../orient/) for the next seam or the next phase: re-audit, orient, specify, build, remediate.
