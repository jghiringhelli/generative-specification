<!-- ForgeCraft sentinel: api | 2026-06-04 | npx forgecraft-mcp refresh . --apply to update -->

## API Standards
- **Contract first**: define OpenAPI/JSON Schema before implementing; generate types from spec (no manual dupes); spec is source of truth.
- **Design**: version from day one (`/api/v1/...`); correct HTTP semantics (GET read, POST create, PUT replace, PATCH update, DELETE remove); pagination on ALL list endpoints; envelope `{ data, meta, errors }`; async ops return job ID + polling endpoint; rate limiting on all public endpoints.
- **Validation**: at the API boundary via schema (Zod/Pydantic/Joi), not manual if-checks; validate body, query, path, headers; return 422 with field errors, not generic 400.
- **Auth**: middleware/guards at router level (not inside handlers); RBAC/policy via middleware; never trust client-sent identity — verify from token/session.
- **Migrations**: through migration files (Prisma/Knex/Flyway/Alembic); reversible (up+down), test rollbacks; never modify a deployed migration; seeds separate, run in CI.
- **OWASP Top 10**: parameterized queries only; rate-limit logins + rotate tokens; encrypt at rest (AES-256), never log PII/tokens; sanitize user HTML + CSP; ownership checks on every resource; no default creds, no verbose prod errors; security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy); CSRF tokens on state-changing endpoints; immutable audit log (who/what/when/which) separate from app logs.
- **Graceful shutdown**: SIGTERM → stop intake → drain → close DB → exit; k8s readiness fails immediately, liveness continues; configurable timeout (default 30s), force exit after.

## API Stack Constraints — Approved Dependency Choices
Use the approved library; if you reach for a banned one, stop.

### TypeScript API
| Concern | Use | Do NOT use |
|---|---|---|
| Password hashing | `argon2@^0.31` | `bcrypt`/`bcryptjs` (native tar CVE chain) |
| HTTP framework | `express@^4`/`fastify@^4` | `restify` (unmaintained), `hapi@<21`, `koa` |
| Input validation | `zod@^3` | `joi`/`express-validator` alone |
| JWT | `jsonwebtoken@^9` | `jwt-simple` (abandoned), `<9` |
| ORM | `@prisma/client@^5`/`kysely@^0.27` | `typeorm`, `sequelize` (weak TS) |
| Logger | `pino@^9` | `winston`, `console.log` in prod |
| HTTP client | `undici@^6`/native `fetch` | `axios` for Node ≥18 |
| ESLint | `@typescript-eslint/*@^8` | `^5`/`^6` (minimatch CVE) |

`npm audit` zero high/critical before first commit; else replace or ADR the exception.

## API Deployment
- **Containers**: multi-stage Dockerfile (builder → minimal non-root runtime); pin base image digests; scan in CI (Trivy/Grype); push to registry (ECR/GCR/GHCR) on merge to main; orchestrate (k8s/ECS/Cloud Run) with resource limits.
- **PaaS quick deploy**: Railway (git-push), Render (free tier, managed Postgres), Fly.io (`fly deploy`, edge). Platform env vars for secrets, managed DB add-ons, auto-sleep non-prod.
- **Environments**: one Dockerfile, same image dev→staging→prod; `/health` returns status/version/uptime/deps; connection pooling per env (dev 5, staging 20, prod 50+); migrations run automatically on deploy, never manually.

## API-Specific Testing Requirements
- **CDC (mandatory)**: consumer writes pact, provider verifies in CI (Pact / Spring Cloud Contract); broker stores pacts; failed verification blocks deployment. Covers request/response schema, status codes, error shapes.
- **Subcutaneous tests (primary integration layer)**: HTTP to a running server, real DB, stubbed external deps (Supertest / httpx+pytest; stub with WireMock/msw/responses, never real external APIs in CI). Every endpoint: 200 happy, 4xx validation, 401/403 auth, ≥1 edge case.
- **DAST at staging (mandatory)**: OWASP ZAP active scan as post-deploy CI step; `zap-config.yaml` committed; High always blocking, Medium/Low tracked.
- **Rate limiting in integration suite**: normal (no throttle), burst (429 + correct retry-after), quota exhaustion + reset for API-key limits.
- **Scaling**: horizontal by default, no in-memory session (Redis/DB); auto-scale on CPU + queue depth; read replicas + PgBouncer for read-heavy.

## API Smoke Testing
Playwright APIRequestContext (no browser). Tag `@smoke`:
```
npx playwright test --config playwright.smoke.config.ts --grep @smoke
```

Minimum suite:
- Health: `GET /health` → 200, body has `status: ok` + `version`
- Auth: primary login with valid creds → token returned
- Primary read: representative `GET` → 200, envelope validates
- Primary write: representative `POST` → 2xx, verify with follow-up `GET`
- 404 shape: missing resource → 404, error envelope matches contract

Run against the deployed staging URL only (`PLAYWRIGHT_BASE_URL`), never localhost in CI (that's the integration suite). Wire as a post-deploy CI step with `PLAYWRIGHT_BASE_URL`, `SMOKE_USER`, `SMOKE_PASSWORD` from secrets.
