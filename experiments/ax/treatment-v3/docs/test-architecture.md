# Test Architecture — Conduit API

## Philosophy

Tests are specifications, not documentation. Every test name is a falsifiable claim.
The test suite is an adversarial audit: tests are designed to catch incorrect code, not confirm assumed-correct code.

## Pyramid

```
                  [E2E]
                /       \
          API / integration tests
        /                     \
    Unit tests (services, utils)
```

- **Unit tests** — service layer, utility functions, error classes. No HTTP, no DB.
- **Integration tests** — full route → service → repository → test DB stack via Supertest.
- **E2E tests** — out of scope for this benchmark (consumed by upstream test suite).

## Coverage Thresholds

| Scope | Threshold |
|---|---|
| Overall | 80% line coverage |
| New/changed code | 90% |
| Auth middleware, permission checks | 95% |

## Test Naming Convention

Format: `<what>_<condition>_<expected outcome>`

Examples:
- `register_with_duplicate_email_returns_422`
- `createArticle_without_auth_returns_401`
- `getFeed_with_no_follows_returns_empty_list`
- `deleteComment_by_non_author_returns_403`

## Tools

- **Jest** — test runner
- **Supertest** — HTTP integration testing
- **jest.fn()** — service-layer mocks for unit tests
- **Test DB** — separate PostgreSQL DB (from env `DATABASE_URL_TEST`)

## File Organization

```
src/
  services/
    user.service.ts
    user.service.test.ts     ← unit tests co-located
  repositories/
    user.repository.ts
    user.repository.test.ts  ← unit tests co-located
tests/
  integration/
    auth.test.ts             ← route-level tests
    articles.test.ts
    comments.test.ts
    profiles.test.ts
    tags.test.ts
```

## Setup/Teardown

- Before all integration tests: run migrations on test DB
- After each test: rollback or truncate all tables
- Never share state between test cases

## Adversarial Test Cases (required)

For every authenticated endpoint, include tests for:
- Missing Authorization header → 401
- Invalid/expired token → 401
- Token for different user attempting mutation → 403

For every resource endpoint:
- Non-existent resource → 404
- Valid resource, wrong owner → 403

For every creation endpoint:
- Missing required fields → 422 with field-level error message
- Duplicate unique field → 422
