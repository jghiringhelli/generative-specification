# Control Condition — Expert Prompting (No GS Artifacts)

## Problem Statement

Build a backend REST API for a social blogging platform called Conduit.

The API spec is in `../REALWORLD_API_SPEC.md`. Implement it completely in TypeScript using Node.js, Express, Prisma, and PostgreSQL.

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5 (strict mode — `"strict": true` in tsconfig)
- **Framework**: Express 4
- **ORM**: Prisma 5
- **Database**: PostgreSQL 16
- **Testing**: Jest 29 + Supertest
- **Validation**: Zod 3

## Architecture

Use a **layered architecture** throughout. This must be consistent from the first file:

```
  Route Handlers  (src/routes/)       — HTTP in/out only: validate input, call service, return response
  Services        (src/services/)     — Business logic only. No HTTP, no direct Prisma.
  Data Access     (src/repositories/) — All Prisma calls isolated here, wrapped in functions/classes
```

**Hard rule:** Route handler files must NOT contain `prisma.` calls. Delegate to a service or repository.

## Error Format

All validation and client errors must use the RealWorld spec format:
```json
{"errors": {"body": ["error message here"]}}
```
HTTP status: 422 for validation, 401 for unauthorized, 403 for forbidden, 404 for not found.

## Code Quality Standards

- No magic values — named constants for JWT expiry, bcrypt rounds, pagination defaults, etc.
- All external configuration via environment variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- Functions max 50 lines. Files max 300 lines. Split by responsibility if exceeded.
- No `any` type annotations. Explicit return types on all exported functions.
- All names intention-revealing — no single-letter variables outside loops.

## Testing Requirements

Write tests **as you implement each feature**:

- **Unit tests**: pure logic — password hashing, JWT sign/verify, slug generation, pagination math
- **Integration tests**: all API endpoints — success path + 422 validation errors + 401 unauthorized + 404 not found
- **Test naming**: describe the behavior, not the implementation.
  - ✅ `returns 422 when email is already registered`
  - ❌ `test POST /api/users validation`
- **Coverage target**: ≥ 80% line coverage on `src/`

## API Compliance

- Every endpoint in the spec must return the exact response shape (field names, nesting, arrays)
- `GET /api/articles` and `GET /api/articles/feed` must NOT return the `body` field in list responses
- Auth token is passed as: `Authorization: Token <jwt>` (not `Bearer`)

## Instructions

Execute the prompts in `prompts/` in order.
Read all requirements in this README before beginning Prompt 1 — they apply to every prompt.

## Output Location

Generated code goes into `output/`.
Evaluation results go into `evaluation/`.
