<!-- CNT branch: routes/code | 2026-06-04 | load when navigating source or adding a module -->

## Folder Map — Where Code Lives

```
src/routes/       — request handlers (thin: auth + validation + delegate)
src/services/     — business logic (depends only on interfaces)
src/domain/       — pure domain models and types
src/repositories/ — data access layer
src/adapters/     — external APIs, infrastructure
src/middleware/   — auth, logging, rate limiting
docs/             — PRD, use-cases, architecture, data-model, ADRs
tests/            — mirrors src/ structure
.claude/          — core.md, index.md, hooks/, standards/
```

## Module Addition Protocol

When adding a new module:
1. Determine which layer it belongs to (see `.claude/constitution.md`)
2. Check `docs/architecture/modules.md` — verify no existing module already owns this concern
3. Name the file using the conventions below
4. Add a `@gs-links` comment referencing the use case or ADR it implements
5. If the addition represents a structural decision: write an ADR first

## Naming Conventions

| Artifact | Convention | Example |
| --- | --- | --- |
| Files | `kebab-case.ts` | `user-service.ts` |
| Classes / Types / Interfaces | `PascalCase` | `UserService` |
| Variables / Functions | `camelCase` | `getUserById` |
| Database columns / JSON keys | `snake_case` | `created_at` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Allowed abbreviations | — | id, url, http, db, api, ctx, err |

## Code Standards

- Strict typing — no `any`, use `unknown` + narrowing
- Explicit return types on all exported functions
- Files ≤300 lines, functions ≤50 lines — extract when exceeded
- Absolute imports with path aliases (`@/` → `src/`)
- No dead code, unused imports, or `console.log` in production files
