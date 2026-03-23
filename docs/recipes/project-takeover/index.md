---
layout: default
title: Project Takeover
parent: Workflow Recipes
nav_order: 7
description: "Apply GS methodology retroactively to an existing codebase you're inheriting"
---

# Project Takeover

**Scenario**: You are taking over an existing project that was not built with GS methodology. The codebase may have minimal documentation, inconsistent testing, and no spec documents. Apply GS retroactively.

This is a brownfield retrofit. Expect it to take 2–4 sessions before the first cascade passes cleanly.

---

## Step 1 — Run setup (it will not overwrite existing files)

```
forgecraft_actions({
  action: "setup_project",
  project_dir: "/path/to/existing-project"
})
```

ForgeCraft setup does not overwrite existing files. It creates the missing GS infrastructure:
- `forgecraft.yaml` (if absent)
- `CLAUDE.md` (if absent)
- `.claude/` CNT structure (if absent)
- Stub `docs/PRD.md`, `docs/use-cases.md` (if absent)

---

## Step 2 — Discover what the project actually does

Before writing any spec, read the codebase. You are reverse-engineering the spec from the implementation.

Ask an AI session:
> "Read this codebase and help me write a `docs/PRD.md` that describes what it actually does, not what it should do. List the real behaviors as goals, the real limitations as non-goals, and the real failure modes as constraints."

This produces a *descriptive* spec, not a *prescriptive* one. That's fine — it's the starting point.

---

## Step 3 — Write use cases from existing behavior

For each significant user-facing behavior, write a use case. Derive them from:
- Existing tests (if any)
- Route handlers / CLI commands
- Database schemas
- API contracts (OpenAPI spec, Postman collections)

Write use cases for what the system *does*, not what you wish it did.

---

## Step 4 — Write ADRs for the significant decisions already made

The previous team made architectural decisions. Document them retroactively:
- Framework choice
- Database choice
- Auth strategy
- Deployment model

Even if you disagree with the decisions, document them so future changes are deliberate.

---

## Step 5 — Run cascade

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/existing-project"
})
```

Fix each blocker. The most common issues on a takeover:
- PRD goals too vague (reverse-engineered specs need sharpening)
- No ADR files (Step 4 addresses this)
- Stubs detected in `docs/` (fill them)

---

## Step 6 — Run audit

```
forgecraft_actions({
  action: "audit_project",
  project_dir: "/path/to/existing-project"
})
```

The audit will identify gaps between the spec you wrote and the actual code. Use these gaps to:
1. Add missing use cases (behavior exists but isn't documented)
2. Identify untested behaviors (code exists but no tests)
3. Find spec violations (code does something different from what the spec says)

---

## Step 7 — Begin the standard loop cycle

Once cascade passes, treat the project as if it were newly set up. Start from [Post-Setup First Cycle](../post-setup-first-cycle/).

The difference: some Loop 1 behaviors may already have implementations. In that case, write the test first (RED commit), verify it fails, then verify the existing implementation makes it pass (GREEN commit without writing new code). This is **characterization testing** — documenting existing behavior before changing it.

---

## Managing Technical Debt

The takeover recipe is not a license to rewrite everything. GS methodology works incrementally:

1. Document what exists (this recipe)
2. Add new features the GS way (brownfield recipe)
3. Refactor existing code only when changing its behavior, and only with a RED test first

Rewrites without spec coverage produce the same drift you inherited.
