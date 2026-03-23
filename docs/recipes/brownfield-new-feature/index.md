---
layout: default
title: Brownfield — New Feature
parent: Workflow Recipes
nav_order: 4
description: "Add a new feature to an existing ForgeCraft project without breaking the GS contract"
---

# Brownfield: New Feature

**Scenario**: The project already uses ForgeCraft. You need to add a feature. This recipe ensures the new feature is spec-first, gate-compliant, and doesn't drift from the existing architecture.

---

## Step 1 — Refresh the spec context

Before adding anything, verify the project is in a clean state:

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

If cascade is blocked, fix it first. Adding a feature on top of a broken cascade compounds the drift.

---

## Step 2 — Extend the spec documents

Add the new feature to `docs/PRD.md` and `docs/use-cases.md`:

**PRD**: Add a new numbered goal for the feature. Add non-goals that scope it explicitly.

**Use cases**: Add UC-NNN entries. Each use case needs:
- Precondition (what state the system is in)
- Actor (who initiates)
- Action (what they do)
- Postcondition (what the system state is after)

**ADR (if applicable)**: If the feature requires an architectural decision (new dependency, changed data model, new integration), write an ADR before implementing.

---

## Step 3 — Run audit to check for drift

```
forgecraft_actions({
  action: "audit_project",
  project_dir: "/path/to/your-project"
})
```

Audit compares the spec against the current codebase. It will flag:
- Use cases with no corresponding test coverage
- Spec goals with no implementation path
- Gates that are newly failing due to the spec addition

Fix any audit failures before implementing the new feature.

---

## Step 4 — Generate a feature session prompt

```
forgecraft_actions({
  action: "generate_session_prompt",
  project_dir: "/path/to/your-project",
  loop: 1,
  feature: "UC-NNN"
})
```

The session prompt is scoped to the new use cases. It includes the existing architecture context so the AI doesn't reinvent patterns.

---

## Step 5 — Implement via TDD

Same as [Post-Setup First Cycle](../post-setup-first-cycle/) Steps 2–4. The key constraint: no changes to existing tests unless you are fixing a regression caused by the new feature.

If implementing the feature requires changing an existing test, that means you are changing behavior. Write an ADR for the behavior change before modifying the test.

---

## Step 6 — Close the cycle

```
forgecraft_actions({
  action: "close_cycle",
  project_dir: "/path/to/your-project"
})
```

`close_cycle` for a brownfield feature also checks:
- No existing tests regressed
- New use cases have corresponding tests
- Gate compliance maintained

---

## Common Pitfalls

**Pitfall**: Adding code without updating the spec. The audit will catch this on the next run, but the drift accumulates silently between runs.
**Fix**: PRD and use-cases first. Always.

**Pitfall**: Reusing an existing service for the new feature in a way that changes its behavior.
**Fix**: Open/Closed Principle. Extend via new method or new service; do not modify existing behavior.

**Pitfall**: Skipping the ADR for a significant architectural change ("it's just a small feature").
**Fix**: If you used "and" to describe what the feature does, it needs a use case. If you chose between two valid implementation approaches, it needs an ADR.
