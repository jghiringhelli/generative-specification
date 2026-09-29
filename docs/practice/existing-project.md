---
layout: default
title: Existing project
parent: Practice
nav_order: 2
permalink: /practice/existing-project/
description: "Eight steps to bring an existing codebase under Generative Specification discipline: cold read, audit, spec from code, sentinel, verification, oracle tests, remediation."
---

# Introduce GS to an Existing Project

> In the workshop this is called **Brownfield**, and it spans the workshop stages Heating, Mold, Temple, Anneal and Temper.


Eight steps to bring an existing codebase under GS discipline — starting with a cold read to expose the gap, then a 7-property audit, spec derived from code, complete sentinel, harness installation, oracle tests before touching anything, and prioritized remediation.

## Step 01: Cold Read

*Orient: what does the AI know about your system right now?*

Open a fresh AI session with no context — no CONSTITUTION.md (CLAUDE.md / AGENTS.md for your tool), no briefing. Ask it three questions in sequence. The answers reveal exactly what's implicit vs. what needs to be written down. This is the diagnostic gap.

**Open a new AI session** in your project folder with no prior context. Paste the cold read prompt below.

**Prompt: Cold Read Diagnostic**

```
Ask me these three questions about this codebase, one at a time.
Wait for my confirmation before asking the next.
Read the codebase to answer — do not ask me.

1. In one paragraph: what does this system do and who uses it?
2. Pick any structural decision visible in the code — a module boundary, a data
   model choice, a service separation. Explain why it was made that way.
3. What should this system never do? What are its explicit architectural
   constraints and non-goals?
```

**Where the AI answers with silence, invention, or low confidence** — that is where your sentinel needs to be explicit. Those gaps are what Step 02 grades.

## Step 02: GS Audit

*Orient: SAVED report card, structural disciplines, architecture issues*

Run the GS Audit Report on your codebase. Grades all seven GS properties (a letter grade each, A–F), structural disciplines (SOLID, TDD, hexagonal, doc-first cascade), test pyramid, and documentation health. Produces an overall grade with Strengths, Weaknesses, and a prioritized remediation plan. No tools required — one prompt.

- [Run the GS Audit](https://pragmaworks.dev/audit): grade your codebase on all seven properties. 30 minutes, one prompt (also available in Spanish).

**Graded low?** Start at Step 03 now — the audit gives you enough to generate a working spec. Don't wait for a perfect codebase before introducing discipline.

## Step 03: Generate Spec from Code

*Specify: SPEC.md derived from what the AI found*

Generate the specification from what exists. The AI reads the codebase first, then generates SPEC.md — filling gaps with [TODO] markers where intent isn't clear from code. This is your starting spec: accurate about what is, honest about what's missing.

**Prompt: Spec from Code**

```
Read the entire codebase. Then generate docs/spec/SPEC.md and STATUS.md.

Rules:
- Derive every section from what you actually find in the code.
- Where intent is ambiguous or missing, write [TODO: clarify with team]
  instead of inventing.
- Flag any section where the cold read (Step 01) revealed a gap.

Use this exact structure for SPEC.md:

# [Project Name] Specification

## Overview
[One paragraph: what it is, what it does, who uses it — derived from code]

## Vision
[What "done" looks like — derive from existing features + gaps]

## Current Phase: Phase [N] — [Phase Name]

**In scope:**
- [Feature 1 — derived from code]
- [TODO: clarify with team if needed]

**Explicitly out of scope (this phase):**
- [Non-goal — derived from what the system clearly does not do]

## Functional Features

### F-001: [Feature Name — derived from code]
Actor: [who triggers this]
Precondition: [what must be true before]
Flow:
  1. [step — derived from code]
Postcondition: [observable result]
Acceptance criteria:
  - [ ] [testable criterion — derived from existing behavior]
  - [ ] [TODO: criterion unclear — clarify with team]

[Repeat F-002, F-003... for each feature found in code]

## Non-Functional Requirements

### Performance
- P-001: [TODO: no performance targets found in code — define with team]

### Reliability
- R-001: [TODO: no SLA found — define with team]

### Security
- S-001: [derive from existing auth patterns found in code]
- S-002: [TODO: input validation patterns unclear — audit boundary]

### Scalability
- SC-001: [TODO: no scaling targets found — define with team]

## Tech Stack
- Language: [derive from code]
- Runtime: [derive]
- Framework: [derive]
- Database: [derive]
- Deployment: [derive or TODO if not found]
- Test framework: [derive or TODO]
- CI: [derive or TODO]

## Module Map

| Module | Responsibility | Key interfaces |
|--------|---------------|----------------|
| [name — from folder structure] | [one sentence — derive] | [TODO if unclear] |

## Quality Gates
- Test coverage minimum: 80%
- Max file length: 400 lines
- Max function length: 50 lines
- Commit format: Conventional Commits (feat/fix/chore/refactor/test/docs)
- Pre-commit: lint + type check
- CI: full test suite on every PR

## Constraints — The AI Must Never
- [Derive from existing auth guards, validation layers, guard clauses]
- Never delete records without an explicit confirmation step in the prompt
- Never run database migrations without human review
- Never bypass authentication for convenience
- [TODO: add project-specific constraints from team]

────────────────────────────────────────────────
STATUS.md
────────────────────────────────────────────────
# [Project Name] — Status

> Updated: [today's date]

## Current Phase
Phase [N]: [Phase Name]

## Existing-Code Baseline
GS Audit overall grade from Step 02: [B-]
[TODO] markers requiring team clarification: [count]

## Last Session
[To be filled after first GS discipline session]

## In Progress
[To be filled when remediation begins]

## Completed
[Empty at the existing-code baseline]

## Next Session Entry Point
Read docs/spec/SPEC.md → read CONSTITUTION.md → begin at Step 04 cascade documents.

────────────────────────────────────────────────
After writing both files, list every [TODO] marker and why it needs
human clarification.
```

**The [TODO] markers are your remediation roadmap.** They reveal what the team carries in their heads that the AI can't read — exactly what the sentinel needs to capture.

## Step 04: Cascade Documents

*Specify (continued) · ADRs + schemas + manifest*

Create the cascade document structure from the spec you just generated. For a brownfield project, ADR-000 documents the architecture that already exists — it's descriptive, not prescriptive. Future ADRs will document changes from this baseline.

**Prompt: Cascade Document Structure**

```
Read docs/spec/SPEC.md. Now set up the cascade document infrastructure.
Use the project name, stack, and constraints from SPEC.md.

─────────────────────────────────────────────
1. FOLDER STRUCTURE
─────────────────────────────────────────────
Create these directories (add .gitkeep to each):
  docs/specs/        feature-level spec files
  docs/adrs/active/  open architecture decisions
  docs/adrs/done/    closed or superseded ADRs
  docs/use-cases/    UC-NNN detailed use case files
  docs/schemas/      data schemas and ER diagrams
  docs/decisions/    code-only change justifications
  docs/edrs/         engineering decision records (spec changes)

─────────────────────────────────────────────
2. docs/manifest.yaml
─────────────────────────────────────────────
---
project: "[project name from SPEC.md]"
version: "0.1.0"
phase: [phase number from SPEC.md]
stack:
  language: [from SPEC.md]
  framework: [from SPEC.md]
  database: [from SPEC.md]
  deployment: [from SPEC.md]
disciplines:
  - solid
  - tdd
  - conventional-commits
  - doc-first-cascade
  - hexagonal-architecture
  - adr-on-arch-change
cascade-rules:
  feat: must touch docs/specs/ or create docs/edrs/ entry before code
  fix: must add failing test before patch
  refactor: should have docs/adrs/active/ entry
  docs: documentation only — no production code changes
  chore: tooling and config only
ai-never:
  [list each item from SPEC.md Constraints section]

─────────────────────────────────────────────
3. docs/adrs/ADR-000-existing-architecture.md
─────────────────────────────────────────────
# ADR-000: Existing Architecture Baseline

Date: [today's date]
Status: Accepted

## Context
This ADR documents the architecture that EXISTS today in the existing codebase.
It is descriptive — capturing decisions already made — not prescriptive.
Derived from cold read (Step 01), GS Audit (Step 02), and spec generation (Step 03).

## Decision
[The architecture found in the code — reference SPEC.md Module Map]

## Consequences
Easy: [what the existing architecture makes easy]
Hard: [what the existing architecture makes hard — architectural debt]

NOTE: Document the architecture that exists, not an ideal future state.
Note any architectural debt in this Consequences section.

## Constraints Accepted
[The explicit non-goals from SPEC.md that shaped these choices]

─────────────────────────────────────────────
4. docs/schemas/  (one file per major data model found in code)
─────────────────────────────────────────────
For each data model identified in SPEC.md:
  docs/schemas/[entity-name].md
  Content: field names, types, constraints, relationships — derived from code.
  Mark any field with [TODO: type unclear] if the schema is ambiguous.

─────────────────────────────────────────────
After creating all files, confirm:
"Cascade infrastructure ready.
 docs/ structure ✓  manifest.yaml ✓
 ADR-000 (existing architecture) ✓  schemas ✓"
```

## Step 05: Generate Sentinel

*Specify (final part) · CONSTITUTION.md — CNT on docs + existing code structure + disciplines*

Same as [New project](../new-project/), but now the sentinel's code navigation CNT describes the real structure that exists, not an ideal. The structural disciplines manifesto sets the target: where the code doesn't meet it today, the harness and remediation will close the gap.

**Prompt: Generate Sentinel**

```
Read docs/spec/SPEC.md and docs/manifest.yaml.
Generate the complete sentinel: CONSTITUTION.md (CLAUDE.md / AGENTS.md for your tool).

For the code navigation CNT: describe the structure that EXISTS today.
Note any deviations from the target discipline in square brackets:
[currently: X — target: Y]

The sentinel must include all four sections:

────────────────────────────────────────────────
SECTION 1 — Project identity and spec pointer
────────────────────────────────────────────────
# [Project Name] — Architectural Constitution

> Read docs/spec/SPEC.md before every session. This file is the grammar.
> SPEC.md is the source of truth. When in conflict, SPEC.md wins.

## Project
[One sentence from SPEC.md Overview]

────────────────────────────────────────────────
SECTION 2 — CNT on cascade documents
────────────────────────────────────────────────
## Cascade Documents Navigation

| Document | Location | Purpose |
|----------|----------|---------|
| Spec | docs/spec/SPEC.md | Canonical specification |
| Status | STATUS.md | Session continuity |
| ADRs | docs/adrs/ | Architecture decisions |
| Feature specs | docs/specs/ | F-NNN feature detail |
| Use cases | docs/use-cases/ | UC-NNN flows |
| Schemas | docs/schemas/ | Data model definitions |
| Manifest | docs/manifest.yaml | Disciplines and cascade rules |
| EDRs | docs/edrs/ | Spec change records |

────────────────────────────────────────────────
SECTION 3 — CNT on existing code structure
────────────────────────────────────────────────
## Code Navigation

[For each module/folder found in the codebase:]
- [folder/]: [one sentence — what lives here]
  [currently: X — target: Y] (only if deviation exists)

Example:
- src/controllers/: HTTP handlers — one file per resource
  [currently: mixed business logic present — target: handlers only, delegate to services]
- src/services/: Business logic
- src/models/: Data layer
- tests/: Test suite [currently: 34% coverage — target: 80%]

────────────────────────────────────────────────
SECTION 4 — Structural disciplines manifesto + AI constraints
────────────────────────────────────────────────
## Structural Disciplines

- SOLID: Single responsibility enforced. One class, one reason to change.
- TDD: Write failing tests before implementation. No patch without a test.
- Hexagonal: Business logic does not import infrastructure. Dependency direction: domain → application → infrastructure.
- Doc-first cascade: feat commits touch docs/specs/ first. Refactors get an ADR.
- Conventional Commits: feat / fix / chore / refactor / test / docs
- ADR on architecture change: any structural change gets docs/adrs/active/ entry first.

## The AI Must Never
[Mirror every constraint from SPEC.md Constraints section]

## Session Closing Checklist
- [ ] Tests pass (including oracle tests)
- [ ] No linting errors
- [ ] STATUS.md updated
- [ ] Commit follows Conventional Commits format
- [ ] If feat: docs/specs/F-NNN exists
- [ ] If refactor: ADR exists in docs/adrs/active/

────────────────────────────────────────────────
Generate CLAUDE.md and AGENTS.md with identical content.
Also generate .cursor/rules/constitution.md and
.github/copilot-instructions.md with the same content.

After writing all files, confirm:
"Sentinel generated.
 CLAUDE.md ✓  AGENTS.md ✓
 .cursor/rules/constitution.md ✓
 .github/copilot-instructions.md ✓
 Deviations flagged: [N] [currently: X — target: Y] notes"
```

## Step 06: Install Harness

*Build (start): hooks + CI + quality gates*

Same harness as [New project](../new-project/), but install it on a separate working branch, not main. The cascade check hook will flag many existing commits as non-compliant; that's expected. From this point forward, all new work follows the cascade discipline.

**Prompt: Harness Installation**

```
First create a working branch:
git checkout -b gs-discipline-[date]

Install the harness on this branch. Note: existing code does not need to
be compliant — the hooks apply to commits made FROM NOW.

Read CONSTITUTION.md and docs/spec/SPEC.md.
Now install the enforcement harness.

─────────────────────────────────────────────
1. .git/hooks/commit-msg  (Conventional Commits)
─────────────────────────────────────────────
#!/usr/bin/env bash
msg=$(cat "$1")
pattern="^(feat|fix|chore|refactor|test|docs|style|ci|perf)(\(.+\))?: .{1,72}"
if ! echo "$msg" | grep -qE "$pattern"; then
  echo "ERROR: Commit message must follow Conventional Commits."
  echo "  Format:  type(scope): description"
  echo "  Types:   feat fix chore refactor test docs style ci perf"
  echo "  Example: feat(auth): add JWT refresh token endpoint"
  exit 1
fi

─────────────────────────────────────────────
2. .git/hooks/pre-commit  (cascade check)
─────────────────────────────────────────────
#!/usr/bin/env bash
staged=$(git diff --cached --name-only)
src_changed=$(echo "$staged" | grep -E "^(src|app|lib|components|pages)/")
doc_changed=$(echo "$staged" | grep -E "^docs/")
if [ -n "$src_changed" ] && [ -z "$doc_changed" ]; then
  today=$(date +%Y-%m-%d)
  decision=$(ls docs/decisions/${today}-*.md 2>/dev/null | head -1)
  if [ -z "$decision" ]; then
    echo "  Code changed without a doc update."
    echo "   Option A: update or create a file in docs/ in this commit."
    echo "   Option B: create docs/decisions/${today}-[reason].md"
    echo "             (one paragraph explaining why no doc update is needed)."
    exit 1
  fi
fi

Make both hooks executable:
chmod +x .git/hooks/commit-msg .git/hooks/pre-commit

─────────────────────────────────────────────
3. .github/workflows/ci.yml
─────────────────────────────────────────────
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: [install command from SPEC.md Tech Stack]
      - name: Lint
        run: [lint command]
      - name: Test
        run: [test command]
      - name: Coverage
        run: [coverage check — fail below 80%]
      - name: Oracle Tests
        run: [test command for tests/oracle/]

─────────────────────────────────────────────
After all files are created, confirm:
"Harness installed on branch gs-discipline-[date].
 commit-msg hook ✓  pre-commit cascade check ✓
 CI workflow ✓ (includes oracle test step)
 Hooks apply to new commits only — existing code not affected."
```

## Step 07: Oracle Tests

*Remediate: boundary tests BEFORE touching structural code*

**Steps 07 and 08 are the remediation stage.** By now you have the spec, sentinel and harness from steps 03 to 06, the prerequisites remediation needs. The standalone version of this stage (oracle tests, remediation, incremental replacement, next module) is [Remediate an existing system](../remediation/).

Before changing anything structural, install oracle tests at the system boundary. These tests verify the existing behavior — not the intended behavior. They are your safety net during remediation. If a remediation breaks an oracle test, you've changed behavior, not just structure.

**Prompt: Install Oracle Tests**

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

After all oracle tests pass: run the GS audit again — the overall grade is
your baseline.
```

## Step 08: Remediation

*Remediate: priority order, cascade discipline throughout*

Apply the remediation plan from Step 02 under full cascade discipline. Work in priority order: highest-impact, lowest-grade properties first. Each item is one of three operation types: refactor, fix, or new spec entry. The harness rejects any commit that skips the discipline.

**Prompt: Remediation Plan Execution**

```
Read docs/spec/SPEC.md, CONSTITUTION.md, and the GS audit report from Step 02.
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
after-grade.
```

## Ongoing Work

*Disciplines · same three operations as a new project*

Once remediation is complete, all future work follows the same three patterns as a new project. The discipline is now structural — the harness enforces it, not willpower.

### Feature

**Feature prompt**

```
Read docs/spec/SPEC.md, then CONSTITUTION.md, then STATUS.md. Confirm you have read all three.

New feature request: [describe the feature in one sentence].

Before writing any code:
1. Check if this feature fits the current phase scope in SPEC.md. If not, flag it and stop.
2. Write the feature spec at docs/specs/F-[NNN]-[slug].md:
   Actor / Precondition / Flow / Postcondition / Acceptance criteria (testable, [ ] format)
3. Show me the spec. Wait for my approval before proceeding.
4. Once approved:
   - Generate unit tests from the acceptance criteria (failing first)
   - Generate the implementation
   - Run tests — all must pass
5. Update STATUS.md.
Commit: feat(scope): [description]
```

### Fix

**Fix prompt**

```
Read CONSTITUTION.md.
Bug: [describe the bug — what happens, what should happen instead].
1. Write a failing test that reproduces the bug exactly. Commit: test(scope): reproduce [bug-slug]
2. Create docs/decisions/[YYYY-MM-DD]-fix-[bug-slug].md — one paragraph: root cause.
3. Patch the code. The failing test must now pass. No other tests may break.
4. Commit: fix(scope): [description]
```

### Refactor

**Refactor prompt**

```
Read CONSTITUTION.md and docs/spec/SPEC.md.
Refactoring task: [describe what to clean up — duplication / dead code / structure / rename].
1. Write ADR at docs/adrs/active/ADR-[NNN]-[slug].md:
   Context (why this refactor) / Decision (what changes) / Consequences (easier/harder)
2. Rules: no behavior changes — structural only. All existing tests must pass after.
3. If removing dead code: confirm each deletion is outside SPEC.md scope first.
4. Commit: refactor(scope): [description]
5. Move ADR to docs/adrs/done/ when complete.
```

**New phase** = update SPEC.md Phase section → proceed with features, fixes, and refactors above. The harness enforces all three operation types from the first commit.

