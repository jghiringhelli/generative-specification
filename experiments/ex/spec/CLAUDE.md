# Conduit API — Architectural Constitution

## Identity

RealWorld Conduit API. TypeScript · Express 4 · Prisma 5 · PostgreSQL. Deployed on Railway.

## Architecture

Hexagonal (Ports & Adapters). Strict layering: Routes → Services → Repositories → Prisma.

**Never skip layers.** Routes call services. Services call repositories. Repositories call Prisma.

## Error Contract

All errors extend `AppError` with `toJSON()` returning `{ errors: { <key>: [message] } }`:

| Error class | HTTP | Key |
|---|---|---|
| `ValidationError` | 422 | field name (Zod path) |
| `ConflictError` | 409 | field name (e.g. `username`) |
| `AuthenticationError` | 401 | `token` (missing) or `credentials` (invalid login) |
| `AuthorizationError` | 403 | resource name (e.g. `article`, `comment`) |
| `NotFoundError` | 404 | `resource.toLowerCase()` |

## Validation

Zod schemas in `src/validation/`. All messages follow RealWorld convention: `"can't be blank"`, `"has already been taken"`, `"is invalid"`. Use `zodFieldErrors(error)` to extract field-keyed errors.

## Null Semantics

`bio` and `image` fields return `null` (never `""`). Use `value || null` not `value ?? null` — empty string must coerce to null.

## Rate Limiting

Production only (`NODE_ENV=production`). Configurable via `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX_REQUESTS` env vars. Default: 500 req/min.

## Deployment

```
railway up --service conduit-api --detach
```

Migrations run automatically on container start via `npx prisma migrate deploy`. Prisma binary target: `linux-musl-openssl-3.0.x` for Alpine.

## Probe Loop

Run `forgecraft run_harness` (L2) and k6 probes (L4) against Railway URL. All 13 behavioral probes and 3 SLO probes must pass before close_cycle.
