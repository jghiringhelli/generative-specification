<!-- CNT branch: constitution | 2026-06-04 | always loaded alongside root -->
<!-- Non-negotiables. No exceptions. Disagreement → write an ADR. -->

## The 7 GS Properties

Every artifact must satisfy all seven:

1. **Self-describing** — artifacts explain themselves; no implicit human memory.
2. **Bounded** — files ≤300 lines, functions ≤50 lines, one file = one concern.
3. **Verifiable** — typecheck + lint + tests pass = "done". "Wrote the file" ≠ done.
4. **Defended** — destructive ops structurally blocked (`docs/operation-classification.md`).
5. **Auditable** — Conventional Commits + ADRs for every non-trivial structural decision.
6. **Composable** — dependencies always inward, explicit interfaces at layer seams.
7. **Executable** — tests run against real runtime, not just compilation.

## Architecture Invariants

**Layer stack** (dependencies point INWARD ONLY):
Routes → Services → Domain → Repositories → Adapters

- A layer never imports from a layer above it. No lateral imports between domains.
- Shared utilities go to `shared/` — never duplicated across domains.
- Strict typing: no `any` — use `unknown` + narrowing.
- Explicit return types on all exported functions.
- No circular imports (hook-enforced).
- ESM imports: all local imports use `.js` extensions.
- Files ≤300 lines, functions ≤50 lines. Extract when exceeded.

## Commit Protocol (Conventional Commits, strict)

`type(scope): subject` — type ∈ `feat|fix|refactor|docs|test|chore|perf|build|ci`

- **Atomic**: one commit = one logical change. No "WIP", "fixes", "asdf".
- Every commit must pass typecheck + lint + affected tests.
- TDD sequence: `test(scope): [RED]` → `feat(scope): [GREEN]` → `refactor(scope)`
- A pre-commit hook enforces quality; a commit-msg hook validates format + TDD phase.

## Prohibited Operations

See `docs/operation-classification.md` for Tier 0–3 classification.

**Blocked without `FORGECRAFT_ALLOW_DESTRUCTIVE=1`:**
- `DROP TABLE`, `TRUNCATE`, `DELETE` without specific `WHERE`
- Disabling any security constraint (RLS, auth guards)
- `git push --force` to main/master
- `rm -rf` on src/, docs/, or database paths
- Hard delete of domain entities (use soft delete + audit log instead)

**Require human confirmation (never proceed silently):**
- Direct push to main (use PR)
- Schema migrations on production
- Adding dependencies >100 KB
- Full data resync / backfill operations
