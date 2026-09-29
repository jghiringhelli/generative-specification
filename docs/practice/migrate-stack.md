---
layout: default
title: Migrate to a new stack
parent: Practice
nav_order: 4
permalink: /practice/migrate-stack/
description: "A three-stage flow for cross-stack moves: audit the source, refine through a structured conversation, bootstrap the target."
---

# Migrate to a new stack

> In the workshop this is called **Migration**.

You are moving an existing system to a new stack, platform, or modernized architecture. Done naively, you reproduce every wart. Done well, you drop unused features, modernize, and add the non-functional requirements that were missing. This is a three-stage flow: **audit the source**, **refine through a structured conversation**, **bootstrap the target**.

For in-place dependency or framework-version upgrades (same repo, same architecture, newer versions), use the [Existing project](../existing-project/) audit and remediation flow instead. This page is for cross-stack moves where the target is a separate codebase.

## The flow

About 3 to 5 hours. Existing project in, new project out.

### 01. Open your AI assistant

You need both repos available: the existing source system and an empty target folder for the new system.

### 02. Branch the source repo before any audit

The migration audit lands in the source repo as artifacts (specs, ADRs, decisions). Even though no source code is modified, those artifacts go on a branch so they can be reviewed before merging back. Paste a branch-and-stay-off-main commitment before any analysis starts:

```
Before any analysis, create a branch named migration-audit in the
source repo using git CLI. Confirm the branch is active. Do not touch
main in the source repo during this session.
```

### 03. Start the migration

Three stages: (1) audit the source and extract a stack-independent specification; (2) a refinement conversation; (3) bootstrap the target folder with the refined spec under GS discipline. The prompt names the artifacts explicitly, because nothing else will produce them by default.

**Prompt: three-stage migration**

```
Migrate this project to a new stack. The source system is the
current folder (on the migration-audit branch). The target folder is
at: [absolute path to empty folder].

Run in three stages, pausing between each so I can review:

STAGE 1 — Source audit (~30 min)
  Read the source codebase. Produce a stack-independent specification at
  source/reports/migration-spec.md. Cover: behavioral contracts (what
  each endpoint / use case does), data model (entities, relationships),
  integration points (external systems, APIs, queues), use cases in
  UC-NNN form with pre/post-conditions, NFRs (performance, security,
  regulatory). Keep framework-specific notes separate in
  migration-spec-impl-notes.md — the primary spec should be portable.

STAGE 2 — Refinement (~1 hour, conversational)
  Walk me through five passes:
    1. Feature triage — for each feature: keep / drop / modernize.
    2. Tech stack decision — bundled (language + framework + DB +
       deployment), not piecemeal.
    3. NFR additions — logging, rate limits, encryption, audit
       trail, anything missing in the source.
    4. Modernization opportunities — polling → WebSocket, homegrown
       queue → managed, etc.
    5. What stays the same — API contracts, schemas, regulated
       business logic that cannot drift.
  Propose defaults; I override what I want. Write the refined spec
  to source/reports/migration-spec-refined.md.

STAGE 3 — Bootstrap target (~1-3 hours)
  In the target folder, set up GS discipline from scratch (see
  New project, steps 03 to 05: docs/manifest.yaml, the doc directories, the
  hooks, the CI workflow). Then generate code from the refined spec
  under that discipline. Pause and ask before any decision that
  contradicts the refined spec.
```

### 04. Stage 1: source audit (about 30 minutes)

The AI extracts what the source system actually does into a stack-independent spec: behavioral contracts, data models, integration points, use cases. Framework-specific implementation notes stay separate from the primary spec.

### 05. Stage 2: refinement conversation (about 1 hour)

The AI walks you through five passes:

- **Feature triage.** For each feature in the source: keep, drop, modernize?
- **Tech stack decision.** A bundled choice, not piecemeal.
- **NFR additions.** Logging, rate limits, encryption, audit trail.
- **Modernization opportunities.** Polling to WebSocket, homegrown queue to managed, and so on.
- **What stays the same.** Preserved API contracts, schemas, regulated logic.

The AI proposes defaults for each. You override what you want. Don't re-confirm the defaults; keep moving.

### 06. Stage 3: bootstrap the target (about 1 to 3 hours)

The refined spec lands in the target folder. The cascade is set up for the chosen target stack. The AI generates code under that discipline.

### 07. Verify parity

You now have the new system. Use the verification layer from [New project](../new-project/) (step 05) to drive the new system through the source system's behavioral contracts. Anything that doesn't match is a refinement decision to revisit, not a bug to chase.

If you want a literal port (preserve every wart, change only the stack), say so in step 03 and the AI will skip the refinement conversation.

## What you have at the end

- **A working new system in the target folder,** generated under GS discipline from a refined version of the source spec.
- **An ADR trail of migration decisions:** what you kept, what you dropped, what you modernized, with rationale. Defensible at the next architecture review.
- **The source system unchanged on its main branch.** The migration audit lands on a separate branch.
- **A migration-context document:** the slice of source-system context the new system needs to know about (legacy data shapes, integration contracts, and so on).
- **Optional parity verification** of the new system against the source system's behavioral contracts.

## Next

- [New project](../new-project/): spec, cascade, sentinel, verification, build, from an empty folder.
- [Existing project](../existing-project/): audit, spec from code, sentinel, verification, remediation.
- [Score a codebase on the seven GS properties](https://pragmaworks.dev/diagnose) (free diagnostic).
