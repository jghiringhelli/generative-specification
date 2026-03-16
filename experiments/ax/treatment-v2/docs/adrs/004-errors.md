# ADR-004: Error Handling Strategy

**Date:** 2026-03-11
**Status:** Accepted

## Context

RealWorld spec requires a specific error response format: `{"errors": {"body": ["message"]}}`. Express's default error handling does not produce this format. Route-level try/catch produces duplicated, inconsistent error handling. Need a centralized, typed error system.

## Decision

Custom error class hierarchy with centralized Express error handler middleware.

```typescript
AppError (base, carries status code + context)
  ├── ValidationError (422, maps field errors to spec format)
  ├── AuthenticationError (401)
  ├── AuthorizationError (403)
  └── NotFoundError (404)
```

The error handler middleware maps `AppError` subclasses to their HTTP equivalents and formats the response body per spec. Unknown errors return 500 with a safe message.

## Alternatives Considered

| Option | Rejected Reason |
|---|---|
| Per-handler try/catch | Duplicated 422/404/401 handling in every route — 15 endpoints × 3 error types = 45 error sites |
| Express default error handler | Does not produce RealWorld spec format |
| HTTP exceptions library | Another dependency; custom hierarchy gives more context (ID, timestamp, operation name) |

## Consequences

- All thrown errors carry: HTTP status, message, optional context (userId, resourceId, operation)
- Single error format mapping point — changing the response format means changing one function
- Route handlers do not know about HTTP status codes — only domain error types
- Tests can assert on error types rather than HTTP status strings
