# Test Architecture

## Test Pyramid

- **Unit tests** — domain logic, pure functions, no I/O
- **Integration tests** — services with real adapters (DB, external APIs)
- **E2E / smoke tests** — critical user journeys via Playwright or equivalent

## TDD Protocol

1. Write the failing test first: `test(scope): [RED] description`
2. Implement minimal code that passes: `feat(scope): [GREEN] description`
3. Refactor: `refactor(scope): description`

Never commit [GREEN] code without a [RED] commit for the same scope.

## Coverage Targets

- Global: ≥80%
- Critical modules (auth, security, payments): ≥90%
- Run: `vitest run --coverage`

## Pre-commit vs Pre-push

- **Pre-commit**: `vitest run --changed --passWithNoTests` (affected tests only)
- **Pre-push**: full test suite (`vitest run`)

## Test Naming

Adversarial naming: `test_rejects_X`, `test_denies_Y`, `test_prevents_Z`.
Not: `test_basic_flow`, `test_happy_path`.

## Test DB vs Dev DB

Always use a separate test database/instance. Never run tests against dev or production.