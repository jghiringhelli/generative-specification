<!-- CNT branch: lifecycle | 2026-06-04 | load when starting a session or implementing a change -->

## Memory Map — What to Load and When

| Memory type | Artifact | Load when |
| --- | --- | --- |
| **Semantic** — architectural rules | `CLAUDE.md` + `.claude/constitution.md` | Every session (always load) |
| **Procedural** — how to work | `.claude/lifecycle.md` + `.claude/standards/` | Implementing or starting a feature |
| **Episodic** — decisions and state | `docs/adrs/active/` + `docs/status.md` | Starting a session, structural changes |
| **Relationship** — behavioral contracts | `docs/use-cases/` | Before implementing any behavior |
| **Working** — current task | Sub-tasks from Feature Estimation | During implementation (keep minimal) |

Read in this order at session start: `docs/status.md` → relevant use case → relevant ADR → `.claude/constitution.md`

## GS Initialization Cascade

Run `check_cascade` to verify each step before implementing anything:

1. **Functional spec** — `docs/PRD.md` exists with real content (not stubs)
2. **Architecture** — `docs/TechSpec.md` + `docs/architecture/` present
3. **Constitution** — `CLAUDE.md` + `.claude/constitution.md` loaded
4. **Decision records** — at least one ADR in `docs/adrs/active/`
5. **Behavioral contracts** — use cases in `docs/use-cases/` with acceptance criteria

If any step fails: fix it before generating code. The cascade IS the specification.

## Feature Estimation (required before any requested change)

Before writing any code:
1. **Read** the relevant use case in `docs/use-cases/` or spec in `docs/specs/`
2. **Identify** all files that will be touched (source, tests, docs)
3. **Break into sub-tasks** — each sub-task: ≤3 files, one clear acceptance criterion
4. **State the scope boundary** — explicitly list what this change does NOT touch
5. **Confirm** the breakdown with the user before writing any code

Sub-task granularity prevents context window degradation. Each sub-task must be
completable without reloading the full spec. This is not optional ceremony.

## Tool Sequencing

| Task type | Recommended sequence |
| --- | --- |
| New feature | Read PRD → Read use-case → Write test ([RED]) → Implement ([GREEN]) → Commit |
| Bug fix | Grep error → Read failing test → Fix → Add regression test → Commit |
| Refactor | Read architecture → Check layers → Change → Run tests → Commit |
| Schema change | Read data-model → Write migration → Regen types → Update UC → Commit |
| <!-- FILL: custom task --> | <!-- FILL: sequence --> |

## Gate Awareness — Detect When a Quality Gate Is Needed

Recognize gate-worthy moments WHILE working — don't wait for close_cycle:

- **Same bug class fixed twice** in a session or across recent commits
- **User corrects you** about something a structural check could have caught
- **You repeat a manual verification** ("let me check X didn't break") more than once
- **A convention exists only in prose** — if a rule lives in docs but nothing enforces it

When detected, immediately create a draft gate at `.forgecraft/gates/drafts/<id>.yaml`
with `origin: organic` and the trigger as evidence. Also log the moment in
`.claude/corrections.md` — the close_cycle genesis scan is the safety net for
moments you miss, and its drafts carry `origin: genesis`.

Drafts are proposals — the dev reviews and moves them to `gates/active/` to enforce.
If a gate would help other projects, set `generalizable: true` so close_cycle
proposes it to the community registry.

## Working Memory Protocol (mid-session context management)

Context windows degrade. When a session grows long:

1. **Checkpoint before continuing.** Update `docs/status.md` with completed sub-tasks
   and the exact next step — specific enough to resume cold.
2. **Don't reload what contracts already answer.** If tests pass and types compile,
   trust the contract — do not re-read implementations to "refresh" your memory.
3. **One sub-task at a time.** If the current sub-task's context no longer fits cleanly,
   finish it, commit, checkpoint, and start the next sub-task fresh.
4. **Never hold unsaved decisions in working memory.** A decision worth remembering
   goes to an ADR or status.md the moment it's made — not at session end.

## Session Loop Invariant (close-of-session gate)

Before closing any session, verify:

1. ✅ Typecheck passes — no type errors
2. ✅ Lint passes — no promoted warnings
3. ✅ Affected tests pass
4. ✅ If schema changed: types regenerated and staged
5. ✅ If structural decision: ADR written in `docs/adrs/active/`
6. ✅ Commits are atomic Conventional Commits
7. ✅ `docs/status.md` updated — current state, open items, recent decisions
8. ✅ If UC acceptance criteria changed: `docs/use-cases/` updated

If any item is incomplete: document it in `docs/status.md` before stopping.
