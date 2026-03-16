# Copilot Instructions

<!-- ForgeCraft managed | 2026-03-12 | target: copilot -->
> **This project is managed by [ForgeCraft](https://github.com/jghiringhelli/forgecraft-mcp).** Generated for GitHub Copilot.
> Tags: `UNIVERSAL`, `API`
>
> Available commands:
> - `setup_project` — re-run full setup (detects tags, generates instruction files)
> - `refresh_project` — detect drift, update tags/tier after project scope changes
> - `audit_project` — score compliance, find gaps
> - `review_project` — structured code review checklist
> - `scaffold_project` — generate folders, hooks, docs skeletons
>
> Config: `forgecraft.yaml` | Tier system: core → recommended → optional

## Project Identity
- **Repo**: {{repo_url}}
- **Primary Language**: typescript
- **Framework**: {{framework}}
- **Domain**: {{domain}}
- **Sensitive Data**: {{sensitive_data}}
- **Project Tags**: `[UNIVERSAL]` `[API]`

## Code Standards
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
  inside business logic.

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
- **Repository ports**: `UserRepository`, `OrderRepository` — data persistence contracts.
- **Gateway ports**: `PaymentGateway`, `EmailSender` — external service contracts.
- Ports are defined in the domain/service layer, never in the adapter layer.
- Port interfaces specify WHAT, never HOW.

### Adapters (Implementations of ports)
- **Driving adapters** (primary): HTTP controllers, CLI handlers, message consumers
  — they CALL the application through port interfaces.
- **Driven adapters** (secondary): PostgresUserRepository, StripePaymentGateway,
  SESEmailSender — they ARE CALLED BY the application through port interfaces.
- Adapters are interchangeable. Swap `PostgresUserRepository` for `InMemoryUserRepository`
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
- Before:
  ```
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        // actual logic buried 3 levels deep
  ```
- After:
  ```
  if (!user) throw new NotFoundError(...);
  if (!user.isActive) throw new InactiveError(...);
  if (!user.hasPermission) throw new ForbiddenError(...);
  // actual logic at top level
  ```

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
- Factories are the natural companion to dependency injection — the DI container
  IS the top-level factory.

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

### Deployment Strategy
- Default: **rolling deployment** with health checks (zero downtime).
- For critical services: **blue-green** or **canary** with automated rollback on error rate spike.
- Every deploy is tagged with git SHA. Rollback = redeploy a previous SHA.
- Deployment must be one command or one button. No multi-step manual runbooks.

### Preview Environments
- Pull requests get ephemeral preview deployments where feasible (Vercel, Netlify, Railway).
- Preview URLs in PR comments for stakeholder review before merge.

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
- Every test name is a specification: `test_rejects_duplicate_member_ids` not `test_validation`
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

### Test Data Builders
- Use Builder or Factory pattern for test data: `UserBuilder.anAdmin().withName('Alice').build()`.
- One builder per domain entity. Builders provide sensible defaults so tests only specify what matters.
- No raw object literals scattered across tests. Centralize in `tests/fixtures/` or `tests/builders/`.

### Property-Based Testing
- For pure functions with wide input ranges, add property tests (fast-check, Hypothesis, QuickCheck).
- Define invariants, not examples: "sorting is idempotent", "encode then decode = identity".
- Property tests complement, not replace, example-based tests.

## Data Guardrails ⚠️
- NEVER sample, truncate, or subset data unless explicitly instructed.
- NEVER make simplifying assumptions about distributions, scales, or schemas.
- State exact row counts, column sets, and filters for every data operation.
- If data is too large for in-memory, say so — don't silently downsample.

## Commit Protocol
- Conventional commits: feat|fix|refactor|docs|test|chore(scope): description
- Commits must pass: compilation, lint, tests, coverage gate, anti-pattern scan.
- Keep commits atomic — one logical change per commit.
- Commit BEFORE any risky refactor. Tag stable states.
- Update Status.md at the end of every session.

## MCP-Powered Tooling
### CodeSeeker — Graph-Powered Code Intelligence
CodeSeeker builds a knowledge graph of the codebase with hybrid search
(vector + text + path, fused with RRF). Use it for:
- **Semantic search**: "find code that handles errors like this" — not just grep.
- **Graph traversal**: imports, calls, extends — follow dependency chains.
- **Coding standards**: auto-detected validation, error handling, and state patterns.
- **Contextual reads**: `get_file_context` returns a file with its related code.
Indexing is automatic on first search (~30s–5min depending on codebase size).
Most valuable on mid-to-large projects (10K+ files) with established patterns.
Install: `npx codeseeker install --vscode` or see https://github.com/jghiringhelli/codeseeker

## Engineering Preferences
These calibrate the AI assistant's judgment on subjective trade-offs.
- **DRY is important** — flag repetition aggressively.
- **Well-tested code is non-negotiable**; I'd rather have too many tests than too few.
- **"Engineered enough"** — not under-engineered (fragile, hacky) and not over-engineered
  (premature abstraction, unnecessary complexity).
- **Handle more edge cases**, not fewer; thoughtfulness > speed.
- **Bias toward explicit over clever** — readability wins over brevity.
- When in doubt, ask rather than assume.

## Corrections Log
When I correct your output, record the correction pattern here so you don't repeat it.
### Learned Corrections
- [AI assistant appends corrections here with date and description]

## API Standards

### Contract First
- Define OpenAPI/JSON Schema spec before implementing endpoints.
- Generate types from spec — don't manually duplicate.
- Spec is the source of truth. Implementation must match.

### Design Rules
- Version from day one: /api/v1/...
- Proper HTTP semantics: GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes.
- Pagination on ALL list endpoints. Never return unbounded results.
- Consistent response envelope: { data, meta, errors }.
- Async operations return job ID + polling endpoint, not blocking results.
- Rate limiting on all public endpoints.

### Validation
- Input validation at API boundary — reject malformed requests before they reach services.
- Use schema validation (Pydantic, Zod, Joi) not manual if-checks.
- Validate request body, query params, path params, and headers.
- Return 422 with specific field errors, not generic 400.

### Authentication & Authorization
- Auth middleware/guards at router level, not checked inside handlers.
- Role-based or policy-based access control via decorators/middleware.
- Never trust client-sent user identity — always verify from token/session.

### Database & Migrations
- Schema changes managed through migration files (Prisma Migrate, Knex, Flyway, Alembic).
- Every migration must be reversible (up + down). Test rollbacks.
- Never modify a deployed migration — create a new one.
- Seed data separate from migrations. Test seeds run in CI.

### Security (OWASP Top 10)
- **Injection**: Parameterized queries only. No string concatenation for SQL, commands, or LDAP.
- **Broken Auth**: Rate-limit login attempts. Enforce strong passwords. Rotate tokens.
- **Sensitive Data Exposure**: Encrypt at rest (AES-256). Never log PII, tokens, or passwords.
- **XXE/XSS**: Sanitize all user-generated HTML. Content-Security-Policy headers on all responses.
- **Broken Access Control**: Enforce ownership checks — users can't access other users' resources.
- **Security Misconfiguration**: No default credentials. No verbose error messages in production.
  Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy.
- **CSRF**: Token-based protection on all state-changing endpoints (unless using SameSite cookies + bearer tokens).
- **Audit logging**: Log WHO did WHAT, WHEN, to WHICH resource. Separate from application logs.
  Immutable. Retained per compliance requirements.

### Graceful Shutdown
- Handle SIGTERM: stop accepting new requests, drain in-flight requests, close DB connections, exit.
- Kubernetes: readiness probe fails immediately, liveness continues during drain.
- Shutdown timeout configurable (default: 30s). Force exit after timeout.

## API Deployment

### Container-Based (Production)
- Multi-stage Dockerfile: builder stage (install + compile) → runtime stage (minimal image, non-root).
- Pin base image digests, not just tags. Scan images for CVEs in CI (Trivy, Grype).
- Push to container registry (ECR, GCR, GHCR) on every merge to main.
- Orchestrate with Kubernetes, ECS, or Cloud Run. Define resource limits for every container.

### PaaS / Quick Deploy
- **Railway**: Git-push deploy with auto-detected Dockerfile or Nixpacks. Ideal for staging and side projects.
- **Render**: Free tier + auto-deploy from Git. Native cron jobs, managed Postgres.
- **Fly.io**: Edge deployment with Firecracker VMs. Good for low-latency APIs. `fly deploy` from CI.
- All PaaS platforms: use platform env vars for secrets, connect managed DB add-ons, enable auto-sleep
  for non-production to control cost.

### Environment Management
- One Dockerfile, many environments. Same image runs in dev, staging, prod.
- Health check endpoint (`/health`) returns: status, version, uptime, dependency connectivity.
- Database connection pooling configured per environment (dev: 5, staging: 20, prod: 50+).
- Migrations run automatically on deploy (pre-deploy hook or init container). Never manually.

### Scaling
- Horizontal scaling by default. No in-memory session state — use Redis or DB.
- Auto-scaling rules based on CPU + request queue depth, not just CPU alone.
- Database read replicas for read-heavy workloads. Connection pooler (PgBouncer) in front of Postgres.
