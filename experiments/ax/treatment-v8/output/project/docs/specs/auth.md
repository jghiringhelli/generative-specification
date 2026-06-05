# Spec Decision Record — User Authentication

> Feature spec for the auth vertical slice. Derives from `docs/PRD.md` (JWT auth)
> and `docs/adrs/ADR-0002-auth.md` (JWT/HS256 + Argon2id). Conforms to the
> RealWorld Conduit API user contract.

## Endpoints

| Method | Path | Auth | Success | Body in | Body out |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/users` | none | `201` | `{ user: { username, email, password } }` | `{ user: { email, token, username, bio, image } }` |
| POST | `/api/users/login` | none | `200` | `{ user: { email, password } }` | `{ user: {..} }` |
| GET | `/api/user` | required | `200` | — | `{ user: {..} }` |
| PUT | `/api/user` | required | `200` | `{ user: { email?, username?, password?, bio?, image? } }` | `{ user: {..} }` |

`Authorization: Token <jwt>` is the RealWorld scheme; `Bearer` is also accepted.

## Validation (Zod, at the HTTP boundary)

- `email` — required (register/login), valid email; optional on update.
- `username` — required (register), non-empty; optional on update.
- `password` — required, ≥ 8 chars (register/update); non-empty on login.
- `bio`, `image` — optional, nullable (update only).
- Update requires at least one field.
- Failures → `422` with `{ errors: { <field>: [msg] } }`.

## Status code decisions (and the trade-offs)

These follow the **codebase's own error taxonomy** (`src/errors/AppError.ts`) and
REST semantics, noted here because RealWorld implementations vary:

- **Register → `201 Created`** (correct create semantics per `.claude/standards/api.md`).
  Some RealWorld reference servers return `200`; change `UserController.register` if
  strict conformance to a `200`-expecting suite is required.
- **Duplicate email/username → `409 Conflict`** (`ConflictError`, which `AppError.ts`
  documents precisely for "duplicate email/username"). The RealWorld reference often
  returns `422` with field errors; this was a deliberate choice to honour the existing
  taxonomy. Revisit if the conformance suite asserts `422`.
- **Bad credentials → `401 Unauthorized`** (`UnauthorizedError`). Identical message for
  unknown-email and wrong-password to prevent account enumeration.

## Architecture (ports & adapters)

```
HTTP (routes/controller/middleware)  →  UserService  →  ports
                                                          ├─ IUserRepository  → PrismaUserRepository (prod) / InMemoryUserRepository (test+dev)
                                                          ├─ IPasswordHasher  → Argon2PasswordHasher
                                                          └─ ITokenService    → JwtTokenService (HS256)
```

Adapters are injected at the composition root (`src/server.ts`). The service throws
`AppError` subclasses; a single error-mapping middleware renders the wire envelope.
The domain/service layers never import HTTP or Prisma types.

## Test strategy

- **Unit**: `AppError`, `env` validation, `JwtTokenService` (adversarial: wrong secret,
  tampered, expired, malformed payload), `Argon2PasswordHasher` (real crypto),
  `UserService` (uniqueness, credentials, partial update, collisions), `errorHandler`.
- **Integration (subcutaneous)**: Supertest against the real Express app over the
  in-memory repository fake — full HTTP → service → JWT → Argon2 path, no external infra.
- **Integration (real DB)**: `PrismaUserRepository.test.ts`, gated on `RUN_DB_TESTS=1`
  (auto-skipped without Postgres; run in CI after `prisma db push`).
- Coverage: 97.8% stmts / 85.7% branch (gate is 80%). The Prisma adapter is excluded
  from the unit-coverage denominator — it is verified by the real-DB suite.
