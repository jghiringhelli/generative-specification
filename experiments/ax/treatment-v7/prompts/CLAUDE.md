# CLAUDE.md

<!-- Conduit RealWorld API — GS Treatment-v7 Condition -->
<!-- Extends treatment-v6: adds §10 Hurl contract conformance gate (resource-scoped error envelope + nullable field coercion), §11 SonarQube quality gate, and enforces ESM-safe jsonwebtoken import pattern -->
<!-- v7 hypothesis: Hurl contract tests expose two specification gaps in v6 (error envelope scoping, bio null coercion). Adding these as explicit quality gates closes both and moves Hurl pass rate from 6/13 to 13/13 -->

> **Execution context**: You are implementing the Conduit RealWorld API in an **interactive Claude Code session**.
> Write files directly to disk using file tools. CodeSeeker MCP is active — use `search_code` before writing any new module (see § MCP-Powered Tooling).
> Apply the Verification Protocol (§1-§11) before ending each response.

## Project Identity
- **Repo**: github.com/jghiringhelli/generative-specification (experiment: `experiments/ax/treatment-v7/output/`)
- **Primary Language**: TypeScript 5 · Node 18+
- **Framework**: Express 4 + Prisma 5 + PostgreSQL
- **Domain**: RealWorld Conduit API — blogging platform backend (GS experiment treatment condition)
- **Sensitive Data**: JWT secrets, argon2 password hashes — never log, never hardcode
- **Project Tags**: `[UNIVERSAL]` `[API]`

## Dependency Registry

`docs/approved-packages.md` is a **living GS artifact** — emit it in P0 and maintain it throughout the project. Its purpose is to ensure every dependency is audited before it reaches `package.json`.

### Format

```markdown
# Approved Package Registry

| Package | Version range | Purpose | Alternatives rejected | Rationale | Audit status |
|---|---|---|---|---|---|
| express | ^4.21 | HTTP server | fastify (heavier), hono (too new) | stable, widely audited | ✅ 0 HIGH/CRITICAL |
| ... | | | | | |
```

### Process Rules (non-negotiable)

1. **Audit before add**: Run the vulnerability scanner appropriate for the detected stack against any new dependency before adding it. If it reports HIGH or CRITICAL, do NOT add the package — choose an alternative and document why.
   - Node/npm: `npm audit --audit-level=high`
   - Python: `pip-audit` or `safety check`
   - Any stack: `trivy fs --exit-code 1 --severity HIGH,CRITICAL .`
2. **Update registry after add**: Every new entry in the project's dependency manifest must have a corresponding row in `docs/approved-packages.md` before the commit is made.
3. **Commit gate**: Zero HIGH/CRITICAL CVEs are permitted to be committed. Use the stack-appropriate scanner. A commit that introduces a HIGH or CRITICAL vulnerability is always wrong — if no safe alternative exists, create a named ADR explaining the exception and the mitigation.
4. **No CVE exceptions without ADR**: ZERO tolerance for HIGH/CRITICAL CVEs without a corresponding `docs/adrs/ADR-XXXX-security-exception.md`.
5. **Check alternatives first**: Before adding any dependency, check if the functionality already exists in Node.js built-ins or an already-approved package. Every new dep is maintenance surface.

### Seed Defaults for This Stack

The following are approved starting points for a TypeScript/Express/Prisma project. Populate the initial rows of `docs/approved-packages.md` with these and verify each via `npm audit` before locking:

**Runtime**
- `express@^4.21` — HTTP framework
- `@prisma/client@^5` — database ORM client
- `argon2@^0.41` — password hashing (preferred over bcrypt — no native deps, no CVE chain)
- `jsonwebtoken@^9` — JWT signing/verification
- `zod@^3` — runtime input validation

**Dev**
- `prisma@^5` — Prisma CLI
- `typescript@^5` — compiler
- `@types/express@^4` — Express types
- `jest@^29` or `vitest@^2` — test runner
- `@typescript-eslint/eslint-plugin@^8` — linting (NOT @^6 — known minimatch CVE chain)
- `husky@^9` — git hooks
- `@commitlint/cli@^19`, `@commitlint/config-conventional@^19` — commit linting

**Why argon2 over bcrypt:** `bcrypt@5` pulls in `@mapbox/node-pre-gyp` → `tar` CVE chain (3 HIGH). `argon2` has no native compilation dependency chain and is the OWASP-recommended modern algorithm.

## Known Type Pitfalls

Recurring TypeScript type errors that arise from library type definitions. Resolve these exactly as documented below — do not use `any` casts or ignore directives.

### `jsonwebtoken` — ESM named export incompatibility

`jsonwebtoken` is a CommonJS module. In ESM or ESM-interop TypeScript projects (`"module": "NodeNext"` or `"type": "module"` in package.json), named imports fail at **runtime**:

```typescript
// ❌ Runtime error: Named export 'sign' not found. The requested module 'jsonwebtoken'
// is a CommonJS module, which may not support all module.exports as named exports.
import { sign } from 'jsonwebtoken';
import { verify } from 'jsonwebtoken';
```

**Correct pattern — default import with destructuring**:

```typescript
// ✅ Works with both CJS and ESM interop
import pkg from 'jsonwebtoken';
const { sign } = pkg;
import type { SignOptions } from 'jsonwebtoken';
```

Apply this pattern in `AuthService.ts` (for `sign`) and `middleware/auth.ts` (for `verify`). Always test the compiled server starts without error before declaring the infrastructure pass complete.

### `jsonwebtoken` — `expiresIn` is `StringValue`, not `string`

`@types/jsonwebtoken` types `expiresIn` (in `SignOptions`) as `StringValue | number | undefined`.
`StringValue` is a branded type from the `ms` package. It is **not assignable from plain `string`**.

`process.env.JWT_EXPIRY` is `string | undefined` — direct assignment **fails at compile time**:

```typescript
// ❌ TS2322: Type 'string' is not assignable to type 'number | StringValue | undefined'
sign(payload, secret, { expiresIn: process.env.JWT_EXPIRY });
```

**Correct pattern — cast via `SignOptions['expiresIn']`**:

```typescript
import type { SignOptions } from 'jsonwebtoken';

// Resolve once at module level with a safe default
const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];

// Then use JWT_EXPIRY in sign() calls — no further cast needed
sign(payload, secret, { expiresIn: JWT_EXPIRY });
```

**Alternative — use a numeric constant (seconds); no cast required**:

```typescript
// Number satisfies `number` branch of StringValue | number | undefined — no cast needed
const JWT_EXPIRY_SECONDS = parseInt(process.env.JWT_EXPIRY_SECONDS ?? '604800', 10); // 7 days
sign(payload, secret, { expiresIn: JWT_EXPIRY_SECONDS });
```

Use whichever approach you choose consistently. Define it as a named module-level constant — never inline the cast inside a `sign()` call body.

### `prisma.$executeRawUnsafe` — no multi-statement queries

The `pg` driver does **not** allow multiple SQL statements in a single prepared statement. Sending `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` in one call throws:
```
Raw query failed. Code: 42601. Cannot insert multiple commands into a prepared statement
```

**Wrong (causes 42601 runtime failure)**:
```typescript
await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
```

**Correct — one statement per call**:
```typescript
await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
await prisma.$executeRawUnsafe('CREATE SCHEMA public');
```

**Better — in test setup, just clean data; never drop the schema**. The schema is already applied by `prisma db push` before tests run. Use `deleteMany()` calls in `beforeEach` in the correct FK order instead of dropping and recreating the schema. Never call `DROP SCHEMA public CASCADE` in test setup.


- Maximum function/method length: 50 lines. If longer, decompose.
- Maximum file length: 300 lines. If longer, split by responsibility.
- Maximum function parameters: 5. If more, use a parameter object.
- Every public function/method must have a docstring/JSDoc with typed params and returns.
- Delete orphaned code. Do not comment it out. Git has history.
- Before creating a new utility, search the entire codebase for existing ones.
- Reuse existing patterns — check shared modules before writing new.
- No abbreviations in names except universally understood ones (id, url, http, db, api).
- All names must be intention-revealing. If you need a comment to explain what a variable
  holds, the name is wrong.

## Production Code Standards — NON-NEGOTIABLE

These apply to ALL code including prototypes. "It's just a prototype" is never a valid
exception. Prototypes become production code within days at CC development speed.

### SOLID Principles
- **Single Responsibility**: One module = one reason to change. Use "and" to describe it? Split it.
- **Open/Closed**: Extend via interfaces and composition. Never modify working code for new behavior.
- **Liskov Substitution**: Any interface implementation must be fully swappable. No isinstance checks.
- **Interface Segregation**: Small focused interfaces. No god-interfaces.
- **Dependency Inversion**: Depend on abstractions. Concrete classes are injected, never instantiated
  inside business logic. **Repository interfaces before concrete classes**: define
  `IUserRepository`, `IArticleRepository`, `ICommentRepository`, `IProfileRepository`
  as interfaces in the domain/service layer. Services depend on the interface. The Prisma
  concrete implementation is in the repository layer and injected at the composition root.
  **Emit these interfaces in P0** alongside the schema — a service that imports a concrete
  class cannot be unit-tested without a real database.

### Zero Hardcoded Values
- ALL configuration through environment variables or config files. No exceptions.
- ALL external URLs, ports, credentials, thresholds, feature flags must be configurable.
- ALL magic numbers must be named constants with documentation.
- Config is validated at startup — fail fast if required values are missing.

### Zero Mocks in Application Code
- No mock objects, fake data, or stub responses in source code. Ever.
- Mocks belong ONLY in test files.
- For local dev: create proper interface implementations selected via config.
- No `if DEBUG: return fake_data` patterns. Use dependency injection to swap implementations.
- No TODO/FIXME stubs returning hardcoded values. Use NotImplementedError with a description.

### Interfaces First
Before writing any implementation:
1. Define the interface/protocol/abstract class
2. Define the data contracts (input/output DTOs)
3. Write the consuming code against the interface
4. Write tests against the interface
5. THEN implement the concrete class

### Dependency Injection
- Every service receives dependencies through its constructor.
- A composition root (main.py / app.ts / container) wires everything.
- No service locator pattern. No global singletons. No module-level instances.

### Error Handling
- Custom exception hierarchy per module. No bare Exception raises.
- Errors carry context: IDs, timestamps, operation names.
- Fail fast, fail loud. No silent swallowing of exceptions.
- Domain code never returns HTTP status codes — that's the API layer's job.

### Modular from Day One
- Feature-based modules over layer-based. Each feature owns its models, service, repository, routes.
- Module dependency graph must be acyclic.
- Every module has a clear public API via __init__.py / index.ts exports.

## Layered Architecture (Ports & Adapters / Hexagonal)

```
┌─────────────────────────────┐
│  API / CLI / Event Handlers │  ← Thin. Validation + delegation only. No logic.
├─────────────────────────────┤     These are DRIVING ADAPTERS (primary).
│  Services (Business Logic)  │  ← Orchestration. Depends on PORT INTERFACES only.
├─────────────────────────────┤
│  Domain Models              │  ← Pure data + behavior. No I/O. No framework imports.
│  (Entities, Value Objects)  │     The inner hexagon. Zero external dependencies.
├─────────────────────────────┤
│  Port Interfaces            │  ← Abstract contracts (Repository, Gateway, Notifier).
│                             │     Defined by the domain, implemented by adapters.
├─────────────────────────────┤
│  Repositories / Adapters    │  ← DRIVEN ADAPTERS (secondary). All external I/O
│                             │     (DB, APIs, files, queues, email, caches).
├─────────────────────────────┤
│  Infrastructure / Config    │  ← DI container, env config, connection factories
└─────────────────────────────┘
```

### Ports (Interfaces owned by the domain)
- **Repository ports**: `IUserRepository`, `IArticleRepository` — data persistence contracts.
- **Gateway ports**: `PaymentGateway`, `EmailSender` — external service contracts.
- Ports are defined in the domain/service layer, never in the adapter layer.
- Port interfaces specify WHAT, never HOW.

### Adapters (Implementations of ports)
- **Driving adapters** (primary): HTTP controllers, CLI handlers, message consumers
  — they CALL the application through port interfaces.
- **Driven adapters** (secondary): `PrismaUserRepository`, `PrismaArticleRepository`
  — they ARE CALLED BY the application through port interfaces.
- Adapters are interchangeable. Swap `PrismaUserRepository` for `InMemoryUserRepository`
  in tests without changing a single line of business logic.

### Data Transfer Objects (DTOs)
- Use DTOs at layer boundaries — never pass domain entities to/from the API layer.
- **Request DTOs**: validated at the API boundary (Zod schema → typed object).
- **Response DTOs**: shaped for the consumer, not mirroring the domain model.
- **Domain ↔ Persistence mapping**: repositories map between domain entities and DB rows/documents.
- DTOs are plain data objects — no methods, no behavior, no framework decorators.

### Layer Rules
- Never skip layers. API handlers do not call repositories directly.
- Dependencies point INWARD only. Inner layers never import from outer layers.
- Domain models have ZERO external dependencies.
- The domain layer does not know HTTP, SQL, or any framework exists.

## Clean Code Principles

### Command-Query Separation (CQS)
- **Commands** change state but return nothing (void).
- **Queries** return data but change nothing (no side effects).
- A function should do one or the other, never both.
- Exception: stack.pop() style operations where separation is impractical — document why.

### Guard Clauses & Early Return
- Eliminate deep nesting. Handle invalid cases first, return early.
- The happy path runs at the shallowest indentation level.

### Composition over Inheritance
- Prefer composing objects via interfaces and delegation over class inheritance.
- Inheritance creates tight coupling and fragile hierarchies.
- Use inheritance ONLY for genuine "is-a" relationships (rare).
- When in doubt, compose: inject a collaborator, don't extend a base class.

### Law of Demeter (Principle of Least Knowledge)
- A method should only call methods on: its own object, its parameters, objects it creates,
  its direct dependencies.
- Do NOT chain through objects: `order.getCustomer().getAddress().getCity()` — BAD.
- Instead: `order.getShippingCity()` or pass the needed data directly.

### Immutability by Default
- Use `const` over `let`. Use `readonly` on properties and parameters.
- Prefer `ReadonlyArray<T>`, `Readonly<T>`, `ReadonlyMap`, `ReadonlySet`.
- When you need to "modify" data, create a new copy with the change.
- Mutable state is the #1 source of bugs. Restrict it to the smallest possible scope.

### Pure Functions
- A pure function: same inputs → same outputs, no side effects.
- Domain logic, validation, transformation, and calculation should be pure.
- Side effects (I/O, logging, database) are pushed to the edges (adapters).
- Pure functions are trivially testable — no mocks needed.

### Factory Pattern
- Use factories to encapsulate complex object construction.
- Factory methods on the class itself for simple cases: `User.create(dto)`.
- Factory classes/functions when construction involves dependencies or conditional logic.

## CI/CD & Deployment

### Pipeline
- Every push triggers: lint → type-check → unit tests → build → integration tests.
- Merges to main additionally run: security scan → deploy to staging → smoke tests → promote.
- Pipeline must complete in under 10 minutes. Parallelize test suites, cache dependencies.
- Failed pipelines block merge. No exceptions.

### Environments
- Minimum three environments: **development** (local), **staging** (mirrors prod), **production**.
- Environment config is injected — same artifact runs everywhere with different env vars.
- Staging is a faithful replica of production (same provider, same DB engine, same services).

## Testing Pyramid

```
         /  E2E  \          ← 5-10% of tests. Core journeys only.
        / Integration \      ← 20-30%. Real dependencies at boundaries.
       /    Unit Tests   \   ← 60-75%. Fast, isolated, every public function.
```

### Coverage Targets
- Overall minimum: 80% line coverage (blocks commit)
- New/changed code: 90% minimum (measured on diff)
- Critical paths: 95%+ (data pipelines, auth, PHI handling, financial calculations)

### Test Rules
- Every test name is a specification: `returns_422_when_email_is_already_registered` not `test_validation`
- No empty catch blocks. No `assert True`. No tests that can't fail.
- Test files colocated: `[module].test.[ext]` or in `tests/` mirroring src structure.
- Flaky tests are bugs — fix or quarantine, never ignore.

### Test Doubles Taxonomy
Use the correct double for the job:
- **Stub**: Returns canned data. No assertions on calls. Use when you need to control input.
- **Spy**: Records calls. Assert after the fact. Use to verify side effects.
- **Fake**: Working implementation with shortcuts (in-memory DB). Use for integration-speed tests.
- **Mock**: Pre-programmed expectations. Assert call patterns. Use sparingly — they couple to implementation.
Prefer stubs and fakes over mocks. Tests that mock everything test nothing.

## API Contract Rules (Conduit RealWorld Spec)

These rules are derived from the official Conduit Hurl contract test suite (`gothinkster/realworld/specs/api/hurl`). Violations cause contract test failures even when unit tests pass.

### Error Envelope — Resource-Scoped (not generic body)

The generic `errors.body[]` format is **NOT** what the Conduit spec requires. Each domain produces errors under its own key:

| Domain | Error key | Example |
|---|---|---|
| User registration/update | `errors.username`, `errors.email`, `errors.password` | `{"errors": {"username": ["can't be blank"]}}` |
| Article operations | `errors.article` | `{"errors": {"article": ["not found"]}}` |
| Authorization failures | `errors.article` | `{"errors": {"article": ["forbidden"]}}` |
| Comment operations | `errors.comment` | `{"errors": {"comment": ["is missing"]}}` |
| Profile operations | `errors.profile` | `{"errors": {"profile": ["not found"]}}` |

**Implementation rule**: The error handler must map error types to resource-scoped keys, not dump all messages into `errors.body`. Implement a `formatError(resource: string, messages: string[])` utility that produces `{ errors: { [resource]: messages } }`.

For **validation errors** (422), use field-level scoping: `{ errors: { fieldName: ["message"] } }`.
For **not-found** (404), scope to the resource: `{ errors: { article: ["not found"] } }`.
For **authorization** (403), scope to the resource: `{ errors: { article: ["forbidden"] } }`.

The Verification Protocol §5 is updated to enforce this (see below).

### Nullable Field Coercion

Fields typed as `string | null` in the domain (`bio`, `image`) must coerce empty string to `null`:

```typescript
// In service/repository update methods:
// ❌ Stores empty string — contract test will fail
bio: input.bio

// ✅ Coerces empty string to null per spec
bio: input.bio === '' ? null : input.bio
image: input.image === '' ? null : input.image
```

Apply this coercion in `UserService.updateUser()` (and any other update path that accepts `bio` or `image`). The Prisma schema types these as `String?` — the coercion must happen in the service layer before the repository call.


- NEVER sample, truncate, or subset data unless explicitly instructed.
- NEVER make simplifying assumptions about distributions, scales, or schemas.
- State exact row counts, column sets, and filters for every data operation.

## Clarification Protocol
All architectural decisions for this project are pre-recorded in `docs/adrs/`.
**Do not ask for architectural clarification** — consult the ADRs and implement.
For ambiguous domain behavior only (e.g. exact pagination semantics), check the RealWorld API spec.
Maximum one clarification per session. If genuinely unresolved, choose the conservative option and note the assumption in a comment.

## Verification Protocol

Before ending each response, scan your own code output and verify ALL of the following (§1-§11):

**1. Bounded** — Route handler files (`src/routes/*.ts`) contain **no** `prisma.` calls.
Route handlers call service functions only. Services call repositories only.
*Fix: move any `prisma.` call in a route file into a service or repository.*

**2. Verifiable** — Every implemented endpoint has tests for:
- Success path (correct status + response shape)
- 422 validation error (at least one invalid input case)
- 401 unauthorized (for auth-required endpoints)
- 404 not found (where applicable)
Test names describe behavior: `returns 422 when email is already registered` (not `test POST /api/users`).
*Fix: add missing test cases inline before ending the response.*

**3. Composable** — Services receive repository interfaces via constructor injection.
No `new PrismaClient()` inside a service function body.
*Fix: refactor constructor to accept injected dependency.*

**4. Zero Hardcoded Values** — No magic numbers or strings:
- JWT expiry: named constant using the pattern from § Known Type Pitfalls (cast via `SignOptions['expiresIn']`)
- Pagination defaults: named constants
- All secrets: from `process.env` only
*Fix: extract to named constant at module top using the documented cast pattern.*

**5. Error Format — Resource-Scoped** — ALL error responses are resource-scoped per the Conduit contract:
- Validation errors (422): `{"errors": {"fieldName": ["message"]}}` — field names as keys, NOT `errors.body`
- Not found (404): `{"errors": {"resourceName": ["not found"]}}` — resource name as key
- Authorization (403): `{"errors": {"resourceName": ["forbidden"]}}` — resource name as key
- Use a shared `formatError(resource: string, messages: string[])` utility for all error responses.
*Fix: replace any `errors.body` with the appropriate resource-scoped key. Extract formatError utility.*

**6. Defended** — Commit gates exist on disk with actual enforcement content, not just documentation:
- `.husky/pre-commit` is present and contains `npx tsc --noEmit`, the test command, **and the vulnerability scanner** for this stack (zero HIGH/CRITICAL CVEs required)
- `.github/workflows/ci.yml` is present and contains both `npm test`, a Stryker mutation gate step, **and a vulnerability scan step**
*Fix: emit these files as fenced code blocks. A gate described only in prose provides zero enforcement. See § Commit Hooks — Emit, Don't Reference.*

**7. Auditable** — Decision trail is recoverable from the repository alone:
- `docs/adrs/` contains at least two ADR files with full content: Context, Decision, Alternatives Considered, Consequences — not stubs
- `CHANGELOG.md` exists and contains at least an `## Unreleased` section
*Fix: emit ADR-0001 (stack: TypeScript + Express + Prisma) and ADR-0002 (auth: JWT + argon2) as full documents. Emit CHANGELOG.md.*

**8. DRY** — No structurally duplicated code that could have been found via `search_code` and reused:
- Run `search_code` for any utility or helper written in this response before the response ends.
- If a match exists that you did not reuse, extract to shared module now.
- Target: jscpd duplication < 4% on the overall project.
- **No duplicate string literals**: route paths, error messages, and domain names must be named constants. No inline strings repeated across files.
*Fix: extract duplicated logic to a shared utility and import it.*

**9. Interface Completeness** — Every declared repository interface method has a concrete implementation:
- For each `I*Repository.ts`, verify the corresponding `Prisma*Repository.ts` implements every method signature.
- Missing implementations are silent runtime failures — they are always wrong.
*Fix: implement the missing method before ending the response.*

**10. Nullable Field Coercion** — All nullable string fields coerce empty string to null:
- In every update operation that accepts `bio` or `image`: apply `value === '' ? null : value` before the repository call.
- Verify: if `PUT /api/user` receives `{ "user": { "bio": "" } }`, the response must contain `"bio": null`, not `"bio": ""`.
*Fix: add `=== '' ? null : value` coercion in the service update method.*

**11. ESM-Safe Imports** — No named imports from CommonJS modules:
- `jsonwebtoken`: must use `import pkg from 'jsonwebtoken'; const { sign } = pkg;` and `import pkg from 'jsonwebtoken'; const { verify } = pkg;`
- Verify: start the compiled server (`node dist/server.js`) and confirm it reaches the listening log line before declaring the infrastructure pass complete.
*Fix: replace named imports with default import + destructure.*

A feature is not done until all 11 checks pass. Fix any violations before ending the response.

## Feature Completion Checklist
After the Verification Protocol passes, your response is complete when:
1. All requested endpoints are implemented with route + service + repository files.
2. Tests are written (see Verification Protocol §2).
3. A brief summary lists what was implemented and which files were created.

## Commit Protocol
- Conventional commits: feat|fix|refactor|docs|test|chore(scope): description
- Commits must pass: compilation, lint, tests, coverage gate, mutation score gate (Stryker on changed modules), anti-pattern scan.
- Keep commits atomic — one logical change per commit.
- Commit BEFORE any risky refactor. Tag stable states.
- Update Status.md at the end of every session.

### Commit Hooks — Emit, Don't Reference
Commit hooks and the CI pipeline must be **emitted as fenced code blocks** — not described in prose or README text. A hook that exists only in documentation provides zero enforcement. If the file is not written to disk, the gate does not exist.

Emit these files in **P0** (the infrastructure prompt):

**`.husky/pre-commit`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
# Security gate: zero HIGH/CRITICAL CVEs required — use stack-appropriate scanner
# (npm audit --audit-level=high | pip-audit | trivy fs --exit-code 1 --severity HIGH,CRITICAL .)
<vulnerability-scanner-command-for-this-stack>
npx tsc --noEmit && npm run lint && npm test -- --passWithNoTests
```

**`.husky/commit-msg`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"
npx commitlint --edit "$1"
```

**`commitlint.config.js`**:
```js
module.exports = { extends: ['@commitlint/config-conventional'] };
```

### CI Pipeline — Emit, Don't Reference
**`.github/workflows/ci.yml`** must be emitted as a fenced code block in **P0**.
The mutation gate step is non-negotiable — it is the only gate that verifies test quality.

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_USER: conduit, POSTGRES_PASSWORD: conduit, POSTGRES_DB: conduit_test }
        options: >-
          --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      # Security gate: zero HIGH/CRITICAL CVEs required
      # Replace with stack-appropriate scanner (npm audit / pip-audit / trivy)
      - run: npm audit --audit-level=high
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npx prisma migrate deploy
        env: { DATABASE_URL: postgresql://conduit:conduit@localhost:5432/conduit_test }
      - run: npm test -- --coverage
        env: { DATABASE_URL: postgresql://conduit:conduit@localhost:5432/conduit_test, JWT_SECRET: ci-test-secret, NODE_ENV: test }
      - name: Mutation gate
        run: npx stryker run
        env: { DATABASE_URL: postgresql://conduit:conduit@localhost:5432/conduit_test, JWT_SECRET: ci-test-secret, NODE_ENV: test }
```

## MCP-Powered Tooling
**CodeSeeker v2.0.0 is active in this session.**

> **Conflict of interest disclosure**: CodeSeeker is the author's own tool, built under Generative Specification methodology. Its use in this condition is a declared experimental variable — testing whether GS-built semantic tooling compounds GS specification quality. This is disclosed in the experiment record.

### Available Tools
- `search_code` — semantic + graph hybrid search over the project codebase
- `get_file_context` — read a file with its imported-by/imports graph

### Mandatory Search-First Rule
**Before writing any new module, utility, or service method:**
1. Call `search_code` with a description of what you are about to implement.
2. If a matching pattern exists, reuse or extend it. Do NOT duplicate.
3. If no match, proceed. Document your first encounter of each pattern type with a brief inline comment.

This rule applies to: error classes, validation helpers, middleware, repository patterns, test fixtures, and any utility function.

## Engineering Preferences
- **DRY is important** — flag repetition aggressively.
- **Well-tested code is non-negotiable**; I'd rather have too many tests than too few.
- **"Engineered enough"** — not under-engineered (fragile, hacky) and not over-engineered (premature abstraction, unnecessary complexity).
- **Handle more edge cases**, not fewer; thoughtfulness > speed.
- **Bias toward explicit over clever** — readability wins over brevity.
- When in doubt, ask rather than assume.

## Corrections Log
When I correct your output, record the correction pattern here so you don't repeat it.
### Learned Corrections
- [AI assistant appends corrections here with date and description]


