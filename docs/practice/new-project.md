---
layout: default
title: New project
parent: Practice
nav_order: 1
permalink: /practice/new-project/
description: "Seven steps from an empty folder to a running project under full Generative Specification discipline: interview, spec, cascade documents, sentinel, verification, first feature, ongoing work."
---

# Start a new project

> **Self-contained version:** [Formulas 1, Greenfield](/formulas/greenfield/) turns a spec you already wrote into the substrate and the first feature in one prompt, with a check for each step. This page is the step-by-step version.

> In the workshop this is called **Greenfield**, and it spans the workshop stages Mold, Temple and Temper.


Seven steps from empty folder to a running project under full GS discipline — **spec**, **cascade documents**, **sentinel**, **harness**, first feature, and the ongoing workflow for features, fixes, and refactors.

## Step 01: Interview

*Specify: New project, 9 questions, one at a time*

Open a new AI session in an empty project folder. Paste the interview prompt. The AI asks nine questions one at a time — waiting for your answer before asking the next. The answers become the raw material for your specification.

**Open a new AI session** in your empty project folder. Paste the prompt below.

**Prompt: Interview**

```
Before writing any files, ask me the following questions one at a time.
Wait for my answer before asking the next. Do not guess or fill in defaults.

1. What is this project? One sentence: what it does and who uses it.
2. What does "done" look like in 6–12 months?
3. Current phase: 0=idea · 1=early dev · 2=prototype · 3=production
4. The 3–5 most important features in scope for the current phase.
5. What should this system never do? Explicit non-goals.
6. Tech stack: language, runtime, framework, database, deployment target.
7. Module structure: the main areas of the codebase, one sentence each.
8. Performance requirements: latency, concurrent users, throughput SLA.
9. What must the AI never do? (e.g. never delete records without confirmation,
   never bypass authentication, never run migrations automatically)

When I have answered all nine questions, say "Ready to generate" and wait.
```

**For an existing project,** skip the interview — go to [Existing project](../existing-project/). That flow reads your codebase first and generates the spec from what it finds.

## Step 02: Generate Spec

*Specify: SPEC.md + STATUS.md, the canonical spec*

Paste this in the same session. The AI generates SPEC.md — your canonical specification — with vision, functional features in F-NNN format, non-functional requirements, tech stack, module map, quality gates, and constraints. Plus STATUS.md for session continuity. One prompt, no further questions.

The specification the AI will write. Sections map directly to the interview answers.

| Section | Content |
| --- | --- |
| `Vision / Overview` | What the system is, who uses it, what "done" looks like |
| `Phase + Scope` | Current phase, in-scope features, explicit non-goals |
| `F-NNN Features` | Actor / Precondition / Flow / Postcondition / Acceptance criteria ([ ] testable) |
| `NFRs` | Performance P-001, Reliability R-001, Security S-001, Scalability SC-001 — each numbered |
| `Tech Stack` | Language, runtime, framework, database, deployment, test framework, CI |
| `Module Map` | One row per module — name, responsibility, key interfaces |
| `Quality Gates` | Coverage minimum, file/function length limits, commit format, CI rules |
| `Constraints` | The AI Must Never — explicit prohibitions derived from interview Q9 |

**Prompt: Generate spec**

```
Generate the GS specification for this project.
Write the files to these exact paths. Use our interview answers.
State any assumptions as comments inside the files.

FILE 1: docs/spec/SPEC.md
# [Project Name] Specification

## Overview
[One paragraph]

## Vision
[What "done" looks like in 6–12 months — concrete]

## Phase [N] — [Name]
In scope: [features]
Explicitly out of scope: [non-goals]

## Functional Features

### F-001: [Name]
Actor: [who]
Precondition: [what must be true]
Flow: 1. [step] 2. [step]
Postcondition: [observable result]
Acceptance criteria:
  - [ ] [testable criterion]

[Repeat for each feature]

## Non-Functional Requirements
### Performance
- P-001: [endpoint] responds within [X ms] at [Y] concurrent users
### Reliability
- R-001: Error rate below [X]% over any 24h window
### Security
- S-001: All routes require authentication except [public routes]
- S-002: All user input validated at the trust boundary
- S-003: Secrets in env vars, never in code or logs
### Scalability
- SC-001: Supports [X] concurrent users without horizontal scaling changes

## Tech Stack
Language / Runtime / Framework / Database / Deployment / Test framework / CI

## Module Map
| Module | Responsibility | Key interfaces |

## Quality Gates
- Coverage minimum: 80%
- Max file length: 400 lines · Max function length: 50 lines
- Commit format: Conventional Commits
- Pre-commit: lint + type check
- CI: full test suite on every PR

## Constraints — The AI Must Never
[From interview answer 9]

FILE 2: STATUS.md
# [Project Name] — Status
> Updated: [today]
## Current Phase: Phase [N] — [Name]
## Last Session: [to be filled]
## In Progress: [to be filled]
## Completed: [empty at start]
## Next Session Entry Point
Read docs/spec/SPEC.md → the sentinel → STATUS.md → begin at F-001.

After writing both files, print the first-session entry prompt.
```

## Step 03: Cascade Documents

*Specify: ADRs, schemas, manifest, everything that derives from the spec*

The cascade documents are the full document hierarchy derived from your spec. They give the sentinel something concrete to point to, and give every future session a complete picture of the project's decisions, schemas, and constraints. Paste this in the same session.

**Prompt: Cascade documents**

```
Create the cascade document structure for this project. Use the content of SPEC.md.

1. CREATE FOLDER STRUCTURE (with .gitkeep):
   docs/adrs/active/     open architecture decisions
   docs/adrs/done/       closed or superseded ADRs
   docs/specs/           feature-level spec files (F-NNN)
   docs/use-cases/       UC-NNN detailed use case files
   docs/schemas/         data schemas and ER diagrams
   docs/decisions/       code-only change justifications
   docs/edrs/            engineering decision records (spec changes)

2. CREATE docs/adrs/ADR-000-initial-architecture.md:
   Date / Status: Accepted / Context (why these choices) /
   Decision (the architecture — reference SPEC.md Module Map) /
   Consequences (easier/harder) / Constraints Accepted (from SPEC.md)

3. CREATE docs/manifest.yaml:
   ---
   project: "[name]"
   version: "0.1.0"
   phase: [N]
   stack: { language, framework, database, deployment }
   disciplines:
     - solid
     - tdd
     - conventional-commits
     - doc-first-cascade
     - hexagonal-architecture
     - adr-on-arch-change
   cascade-rules:
     feat: write spec in docs/specs/ before any code
     fix: write failing test before patch
     refactor: ADR in docs/adrs/active/ first
     docs: documentation only, no production code
   ai-never:
     [list from SPEC.md Constraints]

Confirm: "Cascade documents ready. docs/ structure ✓ ADR-000 ✓ manifest.yaml ✓"
```

## Step 04: Generate Sentinel

*Specify (final part) · the sentinel — CNT on docs + code + disciplines*

The sentinel is the complete AI navigation system for your project, and it is where everything starts. It can only be generated now — after the cascade documents exist — because it points to them. It contains three things: a bounded context tree (CNT) on your cascade documents, a CNT on your code folder structure, and the structural disciplines manifesto that the AI reads every session. The sentinel is your tool's entry file: **CLAUDE.md** (Claude Code), **AGENTS.md** (OpenAI / most tools), **.cursor/rules/** (Cursor), or **.github/copilot-instructions.md** (Copilot). After it, the team can keep any other files it wants, as long as the sentinel references them, directly or indirectly. (Older versions of this recipe called the sentinel CONSTITUTION.md; that is not a required name.)

**Prompt: Generate sentinel**

```
Read docs/spec/SPEC.md and docs/adrs/ADR-000-initial-architecture.md.
Generate the sentinel — the complete AI navigation system for this project.

Write it as your tool's entry file:
  CLAUDE.md               (Claude Code)
  AGENTS.md               (OpenAI Agents and most other tools)
If the team uses several tools, write identical copies. Other files are fine
as long as this file references them, directly or indirectly.

# [Project Name] — Sentinel

> Read docs/spec/SPEC.md before every session. This file is the grammar.
> SPEC.md is the source of truth. When in conflict, SPEC.md wins.

## Project
[One sentence from SPEC.md Overview]

## Document Navigation (CNT on cascade documents)
- Specification: docs/spec/SPEC.md
- Active ADRs: docs/adrs/active/
- Closed ADRs: docs/adrs/done/
- Feature specs: docs/specs/F-NNN-[name].md
- Use cases: docs/use-cases/UC-NNN-[name].md
- Schemas: docs/schemas/
- Engineering decisions: docs/edrs/
- Code-only change notes: docs/decisions/

## Code Navigation (CNT on code structure)
[Derive from SPEC.md Module Map and tech stack]
- [module-name]/: [responsibility] — interfaces: [key contracts]
[One line per module. Match the dependency direction from ADR-000.]
Dependency direction: [e.g. domain → application → infrastructure, never reversed]

## Structural Disciplines Manifesto
Apply these at all times. No exceptions.
- SOLID: interfaces + dependency inversion. AI reads contracts, not implementations.
- Single Responsibility: one reason to change per class/module.
- Hexagonal / consistent structure: [module-name]/ always has [type]. First search hits.
- TDD: write failing test first. Every fix starts with a failing test.
- Conventional Commits: feat/fix/chore/refactor/test/docs/style/ci/perf
- ADR on arch change: any architectural decision gets an ADR before implementation.
- Doc-first cascade: feat → spec file first. fix → test first. refactor → ADR first.
- Intentional naming: function names carry domain, operation, inputs, output.

## Architecture
[From ADR-000: layered structure, key constraints]

## Standards
[From SPEC.md: language, framework, coverage 80%, and the size limits the team declares (for example max file 400 lines, max fn 50 lines)]

## The AI Must Never
[Mirror from SPEC.md Constraints]

## Session Protocol
1. Read docs/spec/SPEC.md
2. Read this file (the sentinel)
3. Read STATUS.md
4. Confirm you have read all three before beginning work.

## Session Closing Checklist
- [ ] All tests pass
- [ ] No linting errors
- [ ] STATUS.md updated
- [ ] Commit follows Conventional Commits format
```

## Step 05: Install Harness

*Build (start): enforcement infrastructure*

The harness is the enforcement layer. It makes the cascade rules mechanical: conventional commits are rejected at the git level, code changes without doc updates require a decision note, CI runs the full test suite on every push. Needs the sentinel to be complete first — the hooks reference the cascade rules defined in manifest.yaml.

**Prompt: Install harness**

```
Read docs/manifest.yaml and the sentinel.
Install the harness enforcement infrastructure.

1. .git/hooks/commit-msg — enforce Conventional Commits:
#!/usr/bin/env bash
msg=$(cat "$1")
pattern="^(feat|fix|chore|refactor|test|docs|style|ci|perf)(\(.+\))?: .{1,72}"
if ! echo "$msg" | grep -qE "$pattern"; then
  echo "ERROR: Commit message must follow Conventional Commits."
  echo "  Format: type(scope): description"
  echo "  Types: feat fix chore refactor test docs style ci perf"
  exit 1
fi

2. .git/hooks/pre-commit — cascade check:
#!/usr/bin/env bash
staged=$(git diff --cached --name-only)
src_changed=$(echo "$staged" | grep -E "^(src|app|lib|components|pages)/")
doc_changed=$(echo "$staged" | grep -E "^docs/")
if [ -n "$src_changed" ] && [ -z "$doc_changed" ]; then
  today=$(date +%Y-%m-%d)
  decision=$(ls docs/decisions/${today}-*.md 2>/dev/null | head -1)
  if [ -z "$decision" ]; then
    echo "⚠  Code changed without a doc update."
    echo "   Option A: update or create a file in docs/ in this commit."
    echo "   Option B: create docs/decisions/${today}-[reason].md"
    exit 1
  fi
fi

chmod +x .git/hooks/commit-msg .git/hooks/pre-commit

3. .github/workflows/ci.yml:
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install
        run: [install command for this stack]
      - name: Lint
        run: [lint command]
      - name: Test
        run: [test command]
      - name: Coverage
        run: [coverage command — fail below 80%]

Confirm: "Harness installed. commit-msg hook ✓ pre-commit cascade check ✓ CI workflow ✓"
```

**Note on NFR gates:** NFR enforcement (P-001, R-001, S-001 thresholds from SPEC.md) activates at Tier 2 — see the [Tier 2 hardening reference](https://pragmaworks.dev/harden). The harness installed here covers commit discipline and test coverage only.

## Step 06: First Feature

*Build: F-NNN → spec → tests → code → green*

Open a new AI session. Paste the entry prompt first — the AI reads your three files and confirms before doing anything. Then paste the first feature prompt. The AI writes the feature spec, gets your approval, then generates tests first and implementation second. The harness verifies the output.

**Open a new session.** Paste the entry prompt, then the feature prompt.

**Prompt: session entry (paste first)**

```
Read docs/spec/SPEC.md, then the sentinel, then STATUS.md.
Confirm you have read all three before beginning work.
```

**Prompt: first feature**

```
Implement F-001 from SPEC.md following the doc-first cascade.

Before writing any code:
1. Write the feature spec at docs/specs/F-001-[name].md using this format:
   Actor / Precondition / Flow (numbered steps) / Postcondition /
   Acceptance criteria ([ ] testable format)
2. Show me the spec. Wait for my approval.

Once I approve:
3. Generate unit tests from the acceptance criteria. They must fail first (red).
4. Generate the implementation.
5. Run the tests. All must pass (green).
6. Update STATUS.md: mark F-001 as completed, set next entry point.
7. Commit: feat(scope): implement F-001 [feature name]
```

The green test is the signal. The spec said what correct means. The AI built it. The harness verified it. You did not read the code.

## Smallest change that works

Before closing the change, check that it is the smallest one that does the job: nothing unnecessary added, no second copy of something that already exists, nothing left dead behind, and the structure where a reader would look for it. Smaller and ordered is cheaper to read and to change. This is a design principle of the method, not a measured result; see [Smallest change that works](/practice/structural-gates/#step-03-smallest-change-that-works).

---

## Ongoing Work

*Build + disciplines · three operation types*

Once the harness is running, all future work follows one of three patterns. Each enforces the doc-first cascade at the git level — the hooks reject commits that skip the discipline.

### New Feature

Every new feature starts with a spec file. The AI reads SPEC.md first to check phase scope, then writes F-NNN before touching code. Your approval gates the implementation.

**Feature prompt**

```
Read docs/spec/SPEC.md, then the sentinel, then STATUS.md. Confirm you have read all three.

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

### Bug Fix

Every fix starts with a failing test that reproduces the bug. The test is committed first — this proves the bug exists and proves the fix worked. A one-paragraph decision note in docs/decisions/ explains root cause.

**Fix prompt**

```
Read the sentinel.
Bug: [describe the bug — what happens, what should happen instead].
1. Write a failing test that reproduces the bug exactly. Commit: test(scope): reproduce [bug-slug]
2. Create docs/decisions/[YYYY-MM-DD]-fix-[bug-slug].md — one paragraph: root cause.
3. Patch the code. The failing test must now pass. No other tests may break.
4. Commit: fix(scope): [description]
```

### Refactor, Dedup, Dead Code

Structural changes always start with an ADR. No behavior changes — only structural. All existing tests must pass. Dead code is removed only after confirming it's outside SPEC.md scope. The ADR moves to docs/adrs/done/ when complete.

**Refactor prompt**

```
Read the sentinel and docs/spec/SPEC.md.
Refactoring task: [describe what to clean up — duplication / dead code / structure / rename].
1. Write ADR at docs/adrs/active/ADR-[NNN]-[slug].md:
   Context (why this refactor) / Decision (what changes) / Consequences (easier/harder)
2. Rules: no behavior changes — structural only. All existing tests must pass after.
3. If removing dead code: confirm each deletion is outside SPEC.md scope first.
4. Commit: refactor(scope): [description]
5. Move ADR to docs/adrs/done/ when complete.
```

**New phase** = update SPEC.md (add Phase N+1 section with scope + features) + proceed with features/fixes/refactors as above. The three operations cover the full ongoing lifecycle.

