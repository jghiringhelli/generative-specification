---
nav_exclude: true
---

# CLAUDE.md — [Project Name] Architectural Constitution
#
# TIER: Project root
# JOB:  The architectural constitution for this project. Names the domain, the layers,
#       the entities, the error classes, and the dependency rules. Prevents the AI from
#       re-opening decisions that have already been made.
#
# Usage: Place at project root as CLAUDE.md. Fill in every section with your domain.
#        Replace ALL placeholders in [brackets]. Commit before the first session begins.
#        This file is read alongside the workspace-level CLAUDE.md — do not repeat
#        cross-project standards here. Only what is specific to this project.

---

## Project Identity

- **Name**: [Project Name]
- **Domain**: [One sentence describing what this system does and for whom]
- **Stack**: [Language, framework, database, runtime]

---

## Architecture

### Layer Map

```
[API Layer (src/api/)]           ← Validates input. Returns responses. NO business logic.
[Service Layer (src/services/)]  ← Orchestrates rules. Depends on interfaces only.
[Domain (src/domain/)]           ← Pure data + behavior. NO I/O. NO framework imports.
[Repository Interfaces]          ← Contracts owned by the domain layer.
[Repository Implementations]     ← Data access. Implements interfaces. NO business rules.
[Config (src/config/)]           ← All env vars. Validated at startup.
```

### Dependency Rules

- [API layer] imports [service interfaces] only. Never repositories.
- [Service layer] imports [repository interfaces] only. Never concrete classes.
- [Domain] imports nothing. Not even language built-ins.
- Concrete classes are wired in `src/index.ts` (composition root). Nowhere else.

---

## Domain Model

### Core Entities

```
[EntityName]
  - [field]: [type]    ← [what it represents]
  - [field]: [type]

[EntityName]
  - [field]: [type]
```

### State Machine (if applicable)

```
[Status]: [STATE_A] → [STATE_B] → [STATE_C]
[STATE_A] → [STATE_CANCELLED] (condition: [when])
No other transitions are valid.
```

---

## Error Hierarchy

```
[AppError] (base)
  ├── [EntityNotFoundError]    { [entityId], operation }
  ├── [InvalidStateError]      { from, to, [entityId] }
  └── [BusinessRuleViolation]  { rule, context }
```

Every error carries: the entity id, the operation name, a human-readable message.

---

## Naming Conventions

- Files: `kebab-case.ts` — `[entity]-service.ts`, `[entity]-repository.ts`
- Interfaces: `PascalCase` — `[Entity]Repository`, `[Entity]Service`
- Entities/types: `PascalCase` — `[Entity]`, `[ValueObject]`
- Functions: `camelCase`, verb-first — `create[Entity]`, `find[Entity]ById`
- Constants: `UPPER_SNAKE_CASE` — `MAX_[THING]`, `DEFAULT_[THING]`

---

## Architecture Decision Records

Document significant decisions in `docs/adr/`. Stubs:

- **ADR-001**: Why [architecture choice]?
- **ADR-002**: Why [technology choice]?

When the AI is about to make a significant architectural decision, it must create an ADR first. ADRs record what was decided and why. The AI reads them at session start and does not re-open closed decisions.

---

## What This Constitution Protects

- Layer boundaries — the AI never skips a layer or imports across boundaries.
- State machine transitions — only allowed transitions are generated.
- Error types — no bare throws, no string-based errors, no generic `Error`.
- Naming conventions — consistent across every file in the project.
- Composition root — dependencies are wired in one place.

If the AI proposes something that violates any of the above, reject it and reference this file.

---

*Generative Specification methodology: https://doi.org/10.5281/zenodo.19637142*
