---
layout: default
title: Migration
parent: Workflow Recipes
nav_order: 6
description: "Migrate a ForgeCraft project to a new dependency, framework version, or infrastructure"
---

# Migration

**Scenario**: Upgrading a major dependency, migrating to a new database, changing cloud providers, or adopting a new framework version. This is high-risk: large surface area, many implicit assumptions, hard to test completely.

---

## Step 1 — Run full audit before touching anything

```
forgecraft_actions({
  action: "audit_project",
  project_dir: "/path/to/your-project"
})
```

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

Get a clean baseline. A migration on top of pre-existing drift produces compounding failures that are hard to attribute. Fix all existing blockers first.

Record current test count and coverage. These are your regression floor.

---

## Step 2 — Write an ADR

Migrations always require an ADR. Minimum content:

```markdown
# ADR-XXXX: Migrate from [Old] to [New]

## Status
Accepted

## Context
[Why the migration is necessary. What problem the current version has.]

## Decision
Migrate to [New] version/technology.

## Migration Strategy
[How you will migrate: strangler fig / big bang / dual-write. Why you chose this approach.]

## Rollback Plan
[How to revert if the migration fails in production.]

## Consequences
[What changes for developers and operators. Any known behavioral differences.]
```

---

## Step 3 — Create a migration branch

Never migrate on main. Create a branch:

```bash
git checkout -b feat/migrate-to-<target>
```

---

## Step 4 — Apply the migration incrementally

For dependency upgrades:
1. Update the version in `package.json` / `requirements.txt` etc.
2. Run `npm install` / `pip install`
3. Run the full test suite immediately. Address each failure before proceeding.

For infrastructure migrations:
1. Add the new infrastructure alongside the old (dual-write or strangler fig)
2. Write tests that exercise both paths
3. Migrate incrementally, deleting old code only when new code passes all tests

The principle: at every step, all tests must pass. A migration is a sequence of small safe steps, not one large unsafe step.

---

## Step 5 — Run cascade after migration

```
forgecraft_actions({
  action: "check_cascade",
  project_dir: "/path/to/your-project"
})
```

Migrations sometimes change file locations or configuration patterns. Cascade catches structural issues.

---

## Step 6 — Run hardening before merging

For major migrations, run the hardening cycle before merging to main:

```
forgecraft_actions({
  action: "start_hardening",
  project_dir: "/path/to/your-project"
})
```

The hardening session prompt focuses on security and edge cases — exactly the areas most likely to behave differently after a migration.

---

## Step 7 — Merge and tag

After all gates green:

```bash
git checkout main
git merge feat/migrate-to-<target>
git tag -a v<MAJOR.MINOR.PATCH> -m "Migrated to <target>"
git push origin main --tags
```

For breaking changes, increment the major version. For compatible upgrades, increment minor.
