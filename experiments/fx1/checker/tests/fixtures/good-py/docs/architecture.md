# Architecture

Derived from docs/spec/SPEC.md (REQ-001 to REQ-003).

## Layers

- `src/ledger.py` holds the pure functions `balance` and `largest_debit`.
- `src/ledger_cli.py` is a thin command-line wrapper around the ledger functions.
- There is no I/O inside `src/ledger.py`.

## Dependencies

- No runtime dependencies.
- The test runner is pytest (see docs/decisions/0001-use-pytest.md).

## Boundaries

- The command-line wrapper may call the ledger. The ledger never calls the wrapper.
