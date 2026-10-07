# Architecture

Derived from docs/spec/SPEC.md (REQ-001 to REQ-003).

## Layers

- `src/ledger.js` holds the pure functions `balance` and `largestDebit`.
- `src/cli.js` is a thin command-line wrapper around the ledger functions.
- There is no I/O inside `src/ledger.js`.

## Dependencies

- No runtime dependencies.
- The test runner is the one built into Node (see docs/decisions/0001-use-node-test-runner.md).

## Boundaries

- The command-line wrapper may call the ledger. The ledger never calls the wrapper.
