# Operation Classification — Tier 0–3 Gate

> Referenced by CLAUDE.md and pre-tool-use hook.
> Every AI-initiated operation must be classified before execution.
> Tier 2+ requires human awareness. Tier 3 requires explicit authorization.

## Tier 0 — Reversible (no confirmation needed)

- Read operations (no side effects)
- File edits with git history
- Test runs (no DB side effects)
- Documentation updates
- Adding code / new files

## Tier 1 — Recoverable with effort (warn, proceed)

- `git push` to feature branch (can be reverted via revert commit)
- Adding/updating dependencies
- Environment variable changes (non-production)
- Schema migrations on dev/test (reversible via rollback migration)
- Config file changes

## Tier 2 — Hard to recover (require human awareness)

- `git push` to main (use PR — direct push blocked)
- Full data resync / backfill operations
- Schema migrations on production
- Mass update queries with broad WHERE conditions
- Adding dependencies >100 KB
- Changing core architecture decisions (require ADR)

## Tier 3 — Irreversible (blocked without FORGECRAFT_ALLOW_DESTRUCTIVE=1)

- `DROP TABLE`, `TRUNCATE`, `DELETE` without specific WHERE
- `git push --force` to main/master
- `rm -rf` on source directories
- Disabling security constraints (RLS, auth guards) in production
- Hard delete of domain entities (use soft delete + audit log instead)
- Dropping databases or clearing all data

## Override Protocol

For legitimate Tier 3 operations (emergency fixes, database resets):
1. Document the reason in `docs/status.md`
2. Get explicit human confirmation
3. Run with: `FORGECRAFT_ALLOW_DESTRUCTIVE=1 <command>`
4. Create an ADR if the operation represents a structural change