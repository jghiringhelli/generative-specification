# project — Architecture Sentinel
<!-- ForgeCraft CNT root | 2026-06-04 | npx forgecraft-mcp refresh . --apply to regenerate -->

> **CNT root** — loaded every session, routing only (≤80 lines).
> Always load the files below, then navigate to the relevant branch.
> If anything contradicts `docs/PRD.md`, PRD wins. Raise an ADR to change course.

## Context Discipline (the prime directive)

**Less harness, more task.** For any roadmap item, run `generate_session_prompt`
and work from THAT bound prompt — it contains everything the step needs.
Load AT MOST one branch + one standards file per task. Never graze the harness
"to be thorough" — every line of methodology you load displaces the task.
`.claude/reference/` is background reading: NEVER load it during work.

## Always Load

- `.claude/constitution.md` — non-negotiables: SOLID, invariants, prohibited ops
- `docs/status.md` — current project state and open items
- `.claude/corrections.md` — past AI mistakes on this project (read before acting)

## Navigate by Task

| You're about to... | Load these branches |
| --- | --- |
| Implement a feature | `.claude/lifecycle.md` → `docs/use-cases/` → `.claude/routes/docs.md` |
| Fix a bug | `.claude/lifecycle.md` → linked test → `.claude/routes/code.md` |
| Change architecture / layers | `.claude/constitution.md` → `docs/architecture/layers.md` → `docs/adrs/` |
| Change a module boundary | `.claude/constitution.md` → `docs/architecture/modules.md` |
| Change data model / schema | `docs/architecture/data-model.md` → `.claude/routes/docs.md` |
| Add / change API surface | `.claude/standards/api.md` → `docs/use-cases/` |
| Write / fix tests | `.claude/standards/testing.md` → `.claude/routes/code.md` |
| Review architecture | `.claude/constitution.md` → `.claude/routes/code.md` → `docs/architecture/` |
| Start a new session | `.claude/lifecycle.md` → `docs/status.md` → relevant use case |

## Project Identity

- **Name**: project
- **Tags**: API
- **Stack**: TypeScript/Node.js REST/GraphQL API

## Doc Obligation Table

| Change type | Read first | Produce after |
| --- | --- | --- |
| New feature | `docs/PRD.md` + relevant use case | Spec decision record in `docs/specs/` |
| Architecture change | `docs/architecture/layers.md` + ADR index | ADR in `docs/adrs/active/` |
| Schema change | `docs/architecture/data-model.md` | Update schema + ERD |
| Module boundary | `docs/architecture/modules.md` | Update modules.md + ADR if non-obvious |
| Bug fix | Linked use case + failing test | Regression note in use case |

## @gs-links Convention

`// @gs-links: docs/use-cases/UC-NNN.md, docs/adrs/active/NNNN-slug.md`
Source files that implement a decision carry this. Linked docs must be staged with code.
The `pre-commit-gs-links.sh` hook enforces this; escape with `docs/change-manifest.md`.
