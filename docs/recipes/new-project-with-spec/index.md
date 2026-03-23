---
layout: default
title: New Project with Spec
parent: Workflow Recipes
nav_order: 1
description: "Start a new project from an existing requirements document using ForgeCraft"
---

# New Project with Spec

**Scenario**: You have a requirements document, design notes, or an existing spec. You want to turn it into a structured GS project that ForgeCraft can guide.

**Time to first passing test**: ~30 minutes.

---

## Step 1 — Initialize the project

Create the project directory with your language/framework of choice, then run setup:

```
forgecraft_actions({
  action: "setup_project",
  project_dir: "/path/to/your-project"
})
```

This generates:
- `forgecraft.yaml` — project identity and tag registry
- `docs/PRD.md` — product requirements scaffold
- `docs/use-cases.md` — use case template
- `docs/roadmap.md` — milestone scaffold
- `.claude/` — CNT context navigation tree
- `CLAUDE.md` — 3-line redirect to `.claude/index.md`

---

## Step 2 — Fill the spec documents

Open `docs/PRD.md` and `docs/use-cases.md`. Fill them with your existing requirements.

**Critical fields — the AI cannot infer these:**
- Goals (numbered, testable)
- Non-goals (explicit scope boundary)
- Use cases (UC-NNN with precondition, actor, action, postcondition)
- Constraints (performance, regulatory, platform)

If your existing document is a prose description, paste it into the PRD and then use an AI session to restructure it into the GS format. The [spec document format](../../experiments/ax/) is described in the AX experiment materials.

---

## Step 3 — Run cascade check

Before writing code, verify the spec is complete enough to proceed:

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

Cascade checks 5 steps in order. All must pass before implementation begins:
1. `forgecraft.yaml` present and parseable
2. `CLAUDE.md` redirects to CNT
3. PRD exists and is not a stub
4. Use cases are defined (not template placeholder text)
5. At least one ADR exists

Fix each blocker before proceeding. The cascade output tells you exactly what is missing.

---

## Step 4 — Scaffold the project

```
forgecraft_actions({
  action: "scaffold_project",
  project_dir: "/path/to/your-project"
})
```

This emits:
- Folder structure matching your tags (API → `src/routes/`, CLI → `src/commands/`, etc.)
- Test scaffold (`tests/` mirroring `src/`)
- GitHub Actions workflow (lint → test → build)
- Pre-commit hooks

---

## Step 5 — Generate the session prompt (Loop 1)

```
forgecraft_actions({
  action: "generate_session_prompt",
  project_dir: "/path/to/your-project",
  loop: 1
})
```

Open the generated session prompt in a new Claude session. It contains:
- Your spec in full
- The quality gates active for your tags
- The TDD instruction sequence
- The loop exit criteria

Follow the TDD workflow: RED commit → GREEN commit → refactor → next behavior.

---

## Step 6 — Close Loop 1

When all Loop 1 behaviors have passing tests:

```
forgecraft_actions({
  action: "close_cycle",
  project_dir: "/path/to/your-project"
})
```

`close_cycle` validates:
- Cascade still passes
- Test count increased
- No new stubs in source
- Coverage threshold met

If it passes, you're ready for Loop 2. If not, it tells you what to fix.

---

## Loops 2 and 3

Repeat Steps 5–6 for loops 2 and 3. By loop 3:
- Full feature implementation
- Playwright/pty smoke tests passing
- All quality gates green
- ADR for each significant decision

After loop 3, run `start_hardening` for pre-release hardening gates.

---

## What to Expect

A well-filled spec produces ~85% of the implementation with minimal back-and-forth. The main sources of AI drift are:
- Absent non-goals (AI adds features you didn't ask for)
- Vague use case postconditions (AI chooses a plausible but wrong behavior)
- Missing constraints (AI picks a default that violates your requirements)

The cascade check catches the first two categories before you write a line of code.
