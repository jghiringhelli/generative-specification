# CLAUDE.md — [Module Name] Module Constraints
#
# TIER: Module directory (e.g., src/payments/, src/auth/, src/repositories/)
# JOB:  Local constraints for this directory. Narrows what the project constitution
#       established. States what this module does, what it must not do, and what
#       belongs somewhere else.
#
# Usage: Place in any module directory that needs specific constraints as CLAUDE.md.
#        Do not repeat rules already in the workspace or project CLAUDE.md.
#        Only what is unique to this module.

---

## This Module's Job

[One sentence: what this directory is responsible for.]

[One sentence: what it is NOT responsible for. Be specific — name the boundary.]

---

## What Lives Here

- [File type or concern]: [what it contains]
- [File type or concern]: [what it contains]

Example (for a repository module):
- `*.repository.ts` — Data access implementations. One file per entity.
- `interfaces.ts` — Repository interface definitions. Defined here, owned by the domain.
- `in-memory/*.ts` — In-memory implementations for use in tests.

---

## What Does NOT Live Here

[Name the concerns that belong in other modules. Be explicit. The AI should refuse
to generate code in this directory that crosses these lines.]

- No [concern] — that belongs in [other module]
- No [concern] — that belongs in [other module]

Example (for a repository module):
- No business rules — those belong in `src/services/`
- No HTTP concerns — those belong in `src/api/`
- No state machine logic — that belongs in `src/domain/`

---

## Local Conventions

[Any naming, structure, or pattern conventions specific to this module that are not
already covered by the project constitution.]

Example (for a repository module):
- Every repository has an `InMemory[Entity]Repository` alongside the concrete implementation.
- Interface is always defined before implementation. No implementation without an interface.
- Tests use the in-memory variant. Production uses the database-backed variant.

---

## Test Strategy for This Module

[How are things in this directory tested? What kind of doubles are used? What is NOT mocked?]

Example (for a repository module):
- Use real in-memory database (`:memory:` SQLite). Do not mock the database.
- Test every query path: happy path, not-found, constraint violation.
- No Jest mocks for repository tests.

---

*Generative Specification methodology: https://doi.org/10.5281/zenodo.19073543*
