---
layout: default
title: Post-Setup First Cycle
parent: Workflow Recipes
nav_order: 3
description: "Run the first full GS loop after project setup is complete"
---

# Post-Setup First Cycle

**Scenario**: The project was just set up (via either spec recipe). The spec documents are filled, cascade passes, scaffold is in place. Now run the first implementation loop.

---

## Prerequisites

- `check_cascade` passes all 5 steps
- `docs/PRD.md` has ≥1 numbered goal
- `docs/use-cases.md` has ≥1 use case in UC-NNN format
- At least one ADR in `docs/adr/`

---

## Step 1 — Generate Loop 1 session prompt

```
forgecraft_actions({
  action: "generate_session_prompt",
  project_dir: "/path/to/your-project",
  loop: 1
})
```

The session prompt is written to `docs/session-prompts/LOOP-001.md`. It contains:
- Your PRD goals for this loop
- The first 2–3 use cases
- Active quality gates for your tags
- Explicit TDD instructions
- Loop exit criteria

---

## Step 2 — Open a fresh AI session

Open a new Claude or Copilot session. Paste the content of `LOOP-001.md` as the first message (or attach the file). Do not carry over prior context — the session prompt is self-contained.

---

## Step 3 — Follow strict TDD

For each behavior in the session prompt:

1. **Write the test first** — name it as a specification: `it('returns 404 when user not found', ...)`
2. **Run the test** — it must fail (RED)
3. **Commit the failing test**: `git commit -m "test(scope): [RED] <behavior>"`
4. **Write minimum code** to pass the test
5. **Run all tests** — all must pass
6. **Commit the implementation**: `git commit -m "feat(scope): <behavior>"`
7. **Refactor** if needed, run tests, commit separately

Never collapse RED and GREEN into a single commit. The commit log is evidence of TDD discipline.

---

## Step 4 — Close the cycle

When all Loop 1 behaviors have passing tests:

```
forgecraft_actions({
  action: "close_cycle",
  project_dir: "/path/to/your-project"
})
```

`close_cycle` checks:
- Cascade still green
- New tests added (test count increased)
- No stub implementations in `src/`
- Coverage ≥ configured threshold

If blocked, fix the specific issue reported and re-run.

---

## Step 5 — Proceed to Loop 2

```
forgecraft_actions({
  action: "generate_session_prompt",
  project_dir: "/path/to/your-project",
  loop: 2
})
```

Loop 2 session prompt focuses on integration, error handling, and edge cases from your use cases. Repeat Steps 2–4.

---

## Loop 3 and Hardening

Loop 3 focuses on completeness: all use cases covered, all gate checks green, Playwright/pty smoke tests passing. After Loop 3:

```
forgecraft_actions({
  action: "start_hardening",
  project_dir: "/path/to/your-project"
})
```

See [Post-Hardening](../post-hardening/) for the hardening recipe.
