# Conventions

Derived from docs/spec/SPEC.md and docs/architecture.md.

## Code

- Pure functions, no global state.
- Throw `TypeError` for invalid entries.

## Tests

- Every test name starts with the criterion id it verifies (for example AC-001).
- Every criterion id appears in docs/coverage.md.

## Commits

- Conventional commit messages. A change under `src/` cites a criterion id or changes a document.
