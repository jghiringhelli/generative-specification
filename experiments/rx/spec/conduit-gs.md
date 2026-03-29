---
nav_exclude: true
---

# Generative Specification — Conduit API (RX Subset)

**Version:** 1.0  
**Date:** 2026-03-15  
**Release Phase:** `development`  
**Experiment:** RX — Replication Experiment  
**Rubric:** GS Unified Seven-Property Rubric (AX v5)  
**Authored by:** Generative Specification methodology (Ghiringhelli, 2026)

> This document is the single source of truth for the RX Conduit implementation.  
> Everything the AI coding agent produces must be derivable from this document alone.  
> No external context, no runtime lookups, no references to files that are not emitted.  
> **Emit. Do not reference.**

---

## 1. Architectural Constitution

### 1.1 System Identity

A REST API implementing a subset of the RealWorld Conduit specification:  
- User registration, login, and JWT-authenticated profile management  
- Article creation, retrieval, update, deletion, and tag filtering  
- Profile follow/unfollow  
- No comments, no favourites in this subset (RX scope boundary)

**Stack (non-negotiable — emit exactly these packages):**
- Runtime: Node.js 20 LTS
- Language: TypeScript 5.x, strict mode, no `any`
- Framework: Express 4.x
- ORM: Prisma 5.x
- Database: PostgreSQL 16
- Auth: `jsonwebtoken` 9.x + `bcrypt` 5.x
- Validation: `zod` 3.x
- Testing: Jest 29.x + Supertest 6.x
- Linting: ESLint 8.x + `@typescript-eslint`

### 1.2 Layer Boundaries (Ports and Adapters)

```
src/
  api/          ← Driving adapters: Express routes + request/response DTOs
  services/     ← Business logic: depends on port interfaces only
  domain/       ← Entities and value objects: zero external imports
  ports/        ← Interface contracts: defined here, implemented in adapters
  adapters/     ← Driven adapters: PrismaUserRepository, etc.
  infrastructure/ ← DI container, env config, Prisma client factory
  index.ts      ← Composition root only: wire dependencies, start server
```

**Absolute layer rules (the AI must enforce these — violations block commit):**
- `domain/` imports nothing outside `domain/`
- `services/` imports from `domain/` and `ports/` only — never from `adapters/` or `api/`
- `api/` imports from `services/` and DTOs only — never from `adapters/` or `domain/` directly
- `adapters/` imports from `ports/`, `domain/`, and `infrastructure/` only
- Circular imports: zero tolerance — `tsc --noEmit` will catch these

### 1.3 Seven GS Properties — Enforcement Constraints

The implementation must satisfy all seven properties. Each property maps to a concrete gate:

| Property | Gate | Blocking? |
|---|---|---|
| Self-describing | Every public function has JSDoc; every module has a header comment | Lint |
| Bounded | No feature crosses its module boundary; `ports/` defines all contracts | Code review |
| Verifiable | 80% line coverage enforced; all public service methods have unit tests | Jest --coverage |
| Defended | `npm audit --audit-level=high` exits 0; no hardcoded secrets | CI |
| Auditable | All ADRs emitted as files with substantive content (not referenced, not stubs) | Audit |
| Composable | No circular deps; clean port/adapter separation | tsc |
| Executable | `tsc --noEmit` exits 0 AND `jest --json` numFailedTests === 0 against live PostgreSQL | CI — **hard gate** |

### 1.4 What This Project Must NOT Do

- No GraphQL endpoint
- No WebSocket
- No file upload
- No comment endpoints (out of RX scope)
- No favourite/unfavourite endpoints (out of RX scope)
- No rate limiting (deferred to production hardening)
- No multi-tenancy

---

## 2. Domain Model

### 2.1 Entities

**User**
```typescript
interface User {
  id: string;          // UUID v4
  email: string;       // unique, lowercase, trimmed
  username: string;    // unique, 3–20 chars, alphanumeric + underscores
  passwordHash: string;
  bio: string | null;
  image: string | null; // URL or null
  createdAt: Date;
  updatedAt: Date;
}
```

**Article**
```typescript
interface Article {
  id: string;          // UUID v4
  slug: string;        // unique, derived from title at creation, immutable
  title: string;       // 1–200 chars
  description: string; // 1–500 chars
  body: string;        // 1–50000 chars
  authorId: string;    // FK → User.id
  tagList: string[];   // stored as Tag join table
  createdAt: Date;
  updatedAt: Date;
}
```

**Tag**
```typescript
interface Tag {
  id: string;
  name: string;        // unique, lowercase
}
```

**Follow**
```typescript
interface Follow {
  followerId: string;  // FK → User.id
  followingId: string; // FK → User.id
  createdAt: Date;
  // Composite PK: (followerId, followingId)
}
```

### 2.2 Value Objects

**Slug** — derived from Article title at creation using kebab-case + UUID suffix. Immutable after creation. Format: `{kebab-title}-{8-char-uuid-suffix}`.

**JWT Payload**
```typescript
interface JWTPayload {
  sub: string;   // User.id
  iat: number;
  exp: number;   // iat + 7 days (604800 seconds)
}
```

### 2.3 Business Rules (enforce in service layer, not in routes)

1. A user cannot follow themselves — throws `SelfFollowError`
2. A duplicate follow is idempotent — no error, no duplicate row
3. An article slug is derived at creation and never updated, even if the title changes
4. Article deletion is hard delete — no soft delete
5. A user can only delete or update their own articles — throws `ForbiddenError`
6. Email comparison is case-insensitive

---

## 3. API Contract

All routes return `Content-Type: application/json`. All authenticated routes require `Authorization: Token {jwt}` header.

### 3.1 Auth Routes

**POST /api/users** — Register
- Body: `{ user: { email, username, password } }`
- Success: 201 `{ user: { email, token, username, bio, image } }`
- Errors: 422 (validation), 409 (email or username conflict)

**POST /api/users/login** — Login
- Body: `{ user: { email, password } }`
- Success: 200 `{ user: { email, token, username, bio, image } }`
- Errors: 422 (validation), 401 (invalid credentials)

**GET /api/user** — Get current user (auth required)
- Success: 200 `{ user: { email, token, username, bio, image } }`
- Errors: 401 (missing/invalid token)

**PUT /api/user** — Update current user (auth required)
- Body: `{ user: { email?, username?, password?, bio?, image? } }` — all optional
- Success: 200 `{ user: { email, token, username, bio, image } }`
- Errors: 422 (validation), 409 (conflict), 401

### 3.2 Profile Routes

**GET /api/profiles/:username** — Get profile
- Success: 200 `{ profile: { username, bio, image, following } }`
- `following` is `false` for unauthenticated requests
- Errors: 404 (not found)

**POST /api/profiles/:username/follow** — Follow user (auth required)
- Success: 200 `{ profile: { username, bio, image, following: true } }`
- Errors: 401, 404, 422 (self-follow)

**DELETE /api/profiles/:username/follow** — Unfollow user (auth required)
- Success: 200 `{ profile: { username, bio, image, following: false } }`
- Errors: 401, 404

### 3.3 Article Routes

**GET /api/articles** — List articles
- Query params: `tag?`, `author?`, `limit?` (default 20, max 100), `offset?` (default 0)
- Success: 200 `{ articles: [...], articlesCount: number }`
- No auth required; `favorited` query param not implemented (out of scope)

**POST /api/articles** — Create article (auth required)
- Body: `{ article: { title, description, body, tagList? } }`
- Success: 201 `{ article: { slug, title, description, body, tagList, author, createdAt, updatedAt } }`
- Errors: 401, 422

**GET /api/articles/:slug** — Get article
- Success: 200 `{ article: { slug, title, description, body, tagList, author, createdAt, updatedAt } }`
- Errors: 404

**PUT /api/articles/:slug** — Update article (auth required, own articles only)
- Body: `{ article: { title?, description?, body? } }` — all optional
- Success: 200 `{ article: {...} }`
- Errors: 401, 403, 404, 422

**DELETE /api/articles/:slug** — Delete article (auth required, own articles only)
- Success: 204 no body
- Errors: 401, 403, 404

**GET /api/tags** — List all tags
- Success: 200 `{ tags: string[] }` — sorted alphabetically

### 3.4 Error Response Format (all errors)

```json
{ "errors": { "body": ["error message 1", "error message 2"] } }
```

---

## 4. Database Schema

Emit this as `prisma/schema.prisma`. Do not create manual SQL files — Prisma migrations are the only schema source.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  username     String    @unique
  passwordHash String
  bio          String?
  image        String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  articles     Article[]
  following    Follow[]  @relation("follower")
  followedBy   Follow[]  @relation("following")
}

model Article {
  id          String        @id @default(uuid())
  slug        String        @unique
  title       String
  description String
  body        String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  author      User          @relation(fields: [authorId], references: [id])
  authorId    String
  tags        ArticleTag[]
}

model Tag {
  id       String       @id @default(uuid())
  name     String       @unique
  articles ArticleTag[]
}

model ArticleTag {
  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  articleId String
  tag       Tag     @relation(fields: [tagId], references: [id])
  tagId     String

  @@id([articleId, tagId])
}

model Follow {
  follower    User     @relation("follower", fields: [followerId], references: [id])
  followerId  String
  following   User     @relation("following", fields: [followingId], references: [id])
  followingId String
  createdAt   DateTime @default(now())

  @@id([followerId, followingId])
}
```

---

## 5. Test Architecture

### 5.1 Test Strategy

- **Unit tests**: all service methods, all domain business rules, all validation functions — mock adapters using in-memory fakes (not jest.mock)
- **Integration tests**: all API endpoints via Supertest against a live PostgreSQL instance (the `rx_conduit` database from docker-compose)
- **No E2E in this scope** — API boundary is the outer perimeter
- **Coverage gate**: 80% line coverage, enforced — `jest --coverage --coverageThreshold '{"global":{"lines":80}}'`

### 5.2 Test File Locations

```
src/
  services/__tests__/         unit tests for all service methods
  api/__tests__/              integration tests for all route handlers
  adapters/__tests__/         integration tests for repository adapters
tests/
  helpers/
    db-setup.ts               truncate all tables before each integration test suite
    auth-helper.ts            register + login helper returning JWT token
    fixtures/
      user.fixture.ts         UserBuilder with sensible defaults
      article.fixture.ts      ArticleBuilder with sensible defaults
```

### 5.3 Integration Test Setup

Each integration test file must:
1. Import `db-setup.ts` and call `truncateAll()` in `beforeEach`
2. Use `DATABASE_URL=postgresql://rx_user:rx_password@localhost:5447/rx_conduit`
3. Import `auth-helper.ts` for authenticated requests
4. Not share state between test files

**Critical — `jest.config.ts` must set `maxWorkers: 1`**: Integration tests share a single PostgreSQL instance. Running suites in parallel causes concurrent `truncateAll()` / insert races that produce spurious unique constraint and foreign key violations. This is not a test logic failure — it is a test orchestration configuration gap. Discovered in the first RX run (2026-03-15). Always serialize integration test execution against a shared database.

### 5.4 Required Test Coverage Per Route

Every route listed in §3 must have a corresponding integration test covering:
- Happy path (correct input, correct auth)
- Missing auth (401 where applicable)
- Invalid input (422)
- Not found (404 where applicable)
- Conflict/forbidden (409/403 where applicable)

### 5.5 Known TypeScript Pitfall — jsonwebtoken StringValue

`jwt.verify()` returns `string | JwtPayload`. Accessing `.sub` directly will produce a TypeScript type error. The correct pattern:

```typescript
const payload = jwt.verify(token, secret);
if (typeof payload === 'string' || !('sub' in payload)) {
  throw new InvalidTokenError('Token payload is not an object');
}
const userId = payload.sub as string;
```

This must be implemented exactly as above. Do not use `as any` or type assertions that bypass the check.

---

## 6. Security Requirements

- Passwords: `bcrypt.hash(password, 12)` — cost factor 12, non-negotiable
- JWT secret: `process.env.JWT_SECRET` — fail fast at startup if missing, never fall back to a default
- JWT expiry: 7 days (604800 seconds)
- No credentials, secrets, or API keys in source files — `npm audit` script must verify
- `npm audit --audit-level=high` must exit 0 — this gate blocks the CI run
- All inputs validated with Zod before reaching the service layer
- SQL injection: not a concern with Prisma parameterized queries — document this in ADR-0002

---

## 7. Architecture Decision Records

**Emit each ADR as a file.** Do not reference ADRs in prose without emitting the file. An ADR that appears in a README as "see ADR-0001" but does not exist as `docs/adrs/ADR-0001-stack.md` fails the Auditable gate.

### ADR-0001 — Stack Selection

Emit as `docs/adrs/ADR-0001-stack.md`:
- **Context**: RX experiment requires a Node.js/TypeScript API stack that is runnable against PostgreSQL with committed `jest --json` evidence
- **Options**: Express + Prisma vs NestJS + TypeORM vs Fastify + Drizzle
- **Decision**: Express + Prisma — lowest surface area, broadest replication compatibility, no framework magic obscuring the GS derivation chain
- **Consequences**: More boilerplate than NestJS; explicit DI wiring required; acceptable for experimental scope

### ADR-0002 — SQL Injection Strategy

Emit as `docs/adrs/ADR-0002-sql-injection.md`:
- **Context**: Security review requires documenting injection mitigation
- **Decision**: Prisma parameterized queries handle all user input; no raw SQL in the codebase; any future `$queryRaw` usage must be flagged in PR review
- **Consequences**: Prisma upgrade path must be tested; raw query escape hatch documented

### ADR-0003 — Authentication Strategy

Emit as `docs/adrs/ADR-0003-auth.md`:
- **Context**: RealWorld spec requires JWT-based stateless auth
- **Decision**: `jsonwebtoken` with HS256, secret from env, 7-day expiry; no refresh tokens in RX scope
- **Consequences**: Token revocation requires adding a blocklist (deferred); the StringValue pitfall documented in §5.5 must be handled at every `jwt.verify()` call site

---

## 8. Emit-Don't-Reference Directives

These rules apply to every session that implements from this spec. The AI must emit, not reference.

1. Every file mentioned in §2 (entities) must exist as a TypeScript file with the exact interface shape shown
2. Every route in §3 must have a corresponding Express router file — not "see the routes directory" in a comment
3. Every ADR in §7 must be emitted as a Markdown file with all four fields (Context, Options, Decision, Consequences) populated
4. The Prisma schema in §4 must be emitted verbatim — not paraphrased, not simplified
5. The `db-setup.ts` and `auth-helper.ts` test utilities in §5.2 must be emitted as files before any integration test imports them
6. All environment variables required at runtime must be listed in a `.env.example` file emitted at the project root
7. `CHANGELOG.md` must be emitted with at minimum one entry: `## [1.0.0] - {date} — Initial RX implementation`
8. `Status.md` must be emitted documenting which features are implemented and which are deferred

---

## 9. Session Loop Protocol

### 9.1 Session Start Protocol

Before writing any code:
1. Read this GS document in full
2. Read `Status.md` — understand current implementation state
3. Read the relevant ADRs for the feature being implemented
4. Confirm the layer you are implementing (domain / service / adapter / API) before writing any import

### 9.2 Session Completion Gate

A session is complete only when:
1. `tsc --noEmit` exits 0
2. `jest --json --outputFile=evidence/jest-output.json` exits with `numFailedTests === 0`
3. `npm audit --audit-level=high` exits 0
4. All new public functions have JSDoc
5. `Status.md` updated with what was implemented in this session

### 9.3 Mid-Session Invariant

At any commit point:
- The test suite must pass — no committing with known failures
- No `console.log` introduced in non-test code — use the logger interface
- No `TODO` or `FIXME` in any committed file — if something is deferred, document it in `Status.md`

---

## 10. Quality Gates by Phase

This project is in `development` phase. The following gates apply:

| Gate | Trigger | Blocks? |
|---|---|---|
| TypeScript type-check | every commit | YES |
| ESLint | every commit | YES |
| Unit tests | every commit | YES |
| Integration tests (PostgreSQL) | every commit | YES |
| Coverage ≥ 80% | every commit | YES |
| `npm audit --audit-level=high` | every commit | YES |
| All ADRs emitted | pre-release | YES |
| `Status.md` current | pre-release | YES |

**Executable is a hard gate at all phases.** If `jest --json` shows `numFailedTests > 0`, no further work proceeds until tests pass. This is the primary evidence artifact for RX.

---

## 11. Environment Variables

Emit `.env.example` at project root with exactly these keys:

```
DATABASE_URL=postgresql://rx_user:rx_password@localhost:5447/rx_conduit
JWT_SECRET=change-me-before-any-real-use
PORT=3000
NODE_ENV=development
```

The application must validate all four at startup and exit with a descriptive error message if any are missing. Use `zod` for env validation:

```typescript
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});
```

Exit code 1 with a human-readable message if `EnvSchema.parse(process.env)` throws.

---

## 12. Project Root Files to Emit

The following files must exist at the project root after P1 (infrastructure prompt):

```
package.json            (exact deps from §1.1, all scripts defined)
tsconfig.json           (strict: true, no implicit any, target ES2022)
.env.example            (§11)
.gitignore              (node_modules, dist, .env, coverage)
prisma/schema.prisma    (§4)
docs/adrs/              (all three ADRs from §7)
CHANGELOG.md            (§8 rule 7)
Status.md               (current state, what is deferred)
src/index.ts            (composition root only — no logic)
src/infrastructure/env.ts (env validation from §11)
```

Nothing else is deferred from P1. If these files do not exist after P1, the session is incomplete.
