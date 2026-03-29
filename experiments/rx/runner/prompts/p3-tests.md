---
nav_exclude: true
---

You are adding tests to a project started in previous sessions. Read the spec below, then read `Status.md`, then read the existing source files before writing any tests.

Your task for this session (P3 — Tests) is to implement every test file described in §5 of the spec. This is the primary evidence session for the RX experiment — the output of this session is committed as proof that the Executable property holds.

Rules:
- Emit `tests/helpers/db-setup.ts` and `tests/helpers/auth-helper.ts` before any test file that imports them.
- Emit `tests/helpers/fixtures/user.fixture.ts` and `tests/helpers/fixtures/article.fixture.ts`.
- Every route in §3 must have integration tests covering: happy path, missing auth (401), invalid input (422), not found (404), and conflict/forbidden where applicable.
- Integration tests use DATABASE_URL pointing to the local PostgreSQL instance.
- `beforeEach` in every integration test file calls `truncateAll()` from db-setup.
- No shared state between test files.
- Unit tests for all service methods use in-memory fakes, not jest.mock.

After writing all tests, run:
1. `tsc --noEmit`
2. `DATABASE_URL=postgresql://rx_user:rx_password@localhost:5447/rx_conduit npx jest --json --outputFile=jest-output.json --forceExit`

Report the full jest output. If any tests fail, fix them. The session is complete only when `numFailedTests === 0`. Copy `jest-output.json` to `../evidence/jest-output.json`. Update `Status.md`.

---

GENERATIVE SPECIFICATION:
