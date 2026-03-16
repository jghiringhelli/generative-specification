# Non-Functional Requirements — Conduit API
# Source: ForgeCraft get_nfr [UNIVERSAL] [API]

## Security

### Authentication & Authorization
- Authentication: JWT (stateless, Bearer token in Authorization header)
- Authorization: owner-based (users may only mutate their own articles/comments)
- Secrets: environment variables only — never in code or git history

### Input Validation
- Validate all inputs at route boundary using Zod or equivalent
- No string SQL concatenation — Prisma parameterizes all queries

### Dependencies
- `npm audit` in CI, block on critical/high CVEs
- Lock file committed

### Transport
- CORS: all origins accepted (per RealWorld spec)
- Content-Type: application/json; charset=utf-8

## Observability
- Structured logging with pino (level, timestamp, requestId, operation)
- No sensitive data in logs (passwords, JWT secrets)
- /health endpoint: status, version, uptime

## Reliability
- Timeout: 30s on all DB operations
- Graceful shutdown: drain in-flight requests on SIGTERM

## Maintainability
- New developer setup: clone → npm install → docker-compose up → npm test (< 5 min)
- README with setup steps and .env.example

## Perf (API tier)
- p95 < 200ms on all read endpoints
- Rate limiting: 100 req/min per IP (express-rate-limit)

## Error Format (per RealWorld spec)
```json
{"errors": {"body": ["message"]}}
```
HTTP status codes: 401 (unauth), 403 (forbidden), 404 (not found), 422 (validation)
