# Ledger library: sentinel

Read this first. Everything else is routed from here.

## Where things are

- Behaviour and acceptance criteria: `docs/spec/SPEC.md` (ids REQ-nnn and AC-nnn).
- Architecture: `docs/architecture.md`
- Data model: `docs/data-model.md`
- Conventions: `docs/conventions.md`
- Decision records: `docs/decisions/0001-use-node-test-runner.md`
- Criteria coverage: `docs/coverage.md`
- Ratchet floor: `docs/ratchet.json` (a number in it may only go up)
- Gates: `scripts/gate.js`, installed as git hooks by `npm install`
- How to run it from a clean clone: `README.md`

## Tool sequence

1. Read the spec section for the criterion you are changing.
2. Write a failing test whose name cites the criterion id.
3. Implement until `npm test` passes.
4. Commit with a conventional message that cites the criterion id.

## Rules

- An `OPEN:` marker in the spec blocks the commit until it is resolved.
- A change under `src/` needs a criterion id in the message or a change under `docs/`.
- Never lower the ratchet floor.
