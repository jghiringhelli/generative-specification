<!-- ForgeCraft sentinel: architecture | 2026-06-04 | npx forgecraft-mcp refresh . --apply to update -->

## Project Identity
- **Repo**: <!-- FILL: add your repository URL -->
- **Primary Language**: typescript
- **Domain**: api
- **Sensitive Data**: NO
- **Project Tags**: `[UNIVERSAL]` `[API]`
- **Release Phase**: development

## Code Standards
- Maximum function/method length: 50 lines. If a function reads like it does two things, decompose it.
- Split a file when you find yourself using "and" to describe what it does — not when it hits a line count.
- Maximum function parameters: 5. If more, use a parameter object.
- No circular imports — module dependency graph must be acyclic (hook-enforced).
- `tsconfig.json` must include `"strict": true` AND `"noUncheckedIndexedAccess": true`.
  `strict: true` alone does not narrow `process.env.*` from `string | undefined` — the second flag is required
  to catch unguarded environment variable access at compile time.
- Every public function/method must have a JSDoc comment with typed params and returns.
- Delete orphaned code. Do not comment it out. Git has history.
- Before creating a new utility, search the entire codebase for existing ones.
- Reuse existing patterns — check shared modules before writing new.
- No abbreviations in names except universally understood ones (id, url, http, db, api).
- All names must be intention-revealing. If you need a comment to explain what a variable
  holds, the name is wrong.

## Language Stack Constraints — Seed Defaults for typescript
Seed rows for `docs/approved-packages.md` in P1; apply audit-before-add for anything not listed.

### TypeScript / Node.js
- Node.js `^20 LTS` min. NOT `^16`/`^18` (EOL).
- TypeScript `^5.4` min. `tsconfig.json`: `"strict": true` AND `"noUncheckedIndexedAccess": true`.
- `eslint@^9` + `@typescript-eslint/*@^8`. NOT `^5`/`^6` (minimatch CVE). NOT `tslint` (deprecated).
- `vitest@^2` or `jest@^29`. NOT `mocha`+`chai` (weak TS). NOT `jasmine` (unmaintained).
- `prettier@^3` via `.prettierrc` + `eslint-config-prettier`.

## Production Code Standards — NON-NEGOTIABLE
Apply to ALL code including prototypes.

- **SOLID**: SRP (one reason to change), OCP (extend, don't modify), LSP (swappable, no isinstance), ISP (small interfaces), DIP (depend on abstractions; inject concretes at composition root).
- Define port interfaces (`IUserRepository`, `IEmailSender`) in the domain/service layer in P1; concrete impls live in adapters, injected at the root.
- Zero hardcoded values: all config via env/config files, validated at startup (fail fast). Magic numbers → named constants.
- Zero mocks in source: mocks only in test files. No `if DEBUG: return fake_data`. Stubs use NotImplementedError, not hardcoded returns.
- Interfaces first: interface → DTOs → consuming code → tests → concrete impl.
- DI via constructor; composition root wires everything. No service locator, global singletons, module-level instances.
- Error handling: custom exception hierarchy per module, errors carry context (IDs, timestamps, op name), fail loud. Domain never returns HTTP status codes.
- Feature-based modules (own models/service/repo/routes), acyclic graph, public API via index.ts.

## Layered Architecture (Ports & Adapters / Hexagonal)
Layers (outer→inner): API/CLI/Handlers (thin, validate+delegate) → Services (orchestrate, depend on ports only) → Domain models (pure, no I/O, no framework) → Port interfaces → Repositories/Adapters (external I/O) → Infrastructure/Config (DI, env).

### Ports & Adapters
- Ports (`UserRepository`, `PaymentGateway`, `EmailSender`) defined in domain/service layer, never in adapters. Specify WHAT, not HOW.
- Driving adapters (HTTP/CLI/consumers) call through ports; driven adapters (PostgresUserRepository, StripePaymentGateway) are called through ports.
- Adapters interchangeable: swap Postgres for InMemory in tests with zero logic changes.

### DTOs
- DTOs at every layer boundary — never pass domain entities to/from the API layer.
- Request DTOs validated at boundary (Zod); Response DTOs shaped for consumer; repos map domain ↔ persistence.
- DTOs are plain data — no methods, no framework decorators.

### Layer Rules
- Never skip layers (handlers never call repos directly). Dependencies point INWARD only.
- Domain models have ZERO external dependencies; the domain does not know HTTP/SQL/frameworks exist.

## Clean Code Principles
- **CQS**: commands change state return void; queries return data no side effects. A function does one, not both.
- **Guard clauses**: handle invalid cases first, return early; happy path at shallowest indent.
- **Composition over inheritance**: compose via interfaces/delegation; inheritance only for genuine "is-a".
- **Law of Demeter**: no chaining through objects (`order.getCustomer().getAddress()` — bad); add `order.getShippingCity()`.
- **Immutability by default**: `const`/`readonly`, `ReadonlyArray<T>`; copy-on-modify; restrict mutable state to smallest scope.
- **Pure functions**: domain logic/validation/calculation pure; push I/O to adapters.
- **Factory pattern**: encapsulate construction (`User.create(dto)`); the DI container is the top-level factory.

> Design reference patterns (DDD, CQRS, GoF) on demand via `get_design_reference` tool.
