# ADR-003: RealWorld Error Contract via toJSON()

**Status:** Accepted  
**Date:** 2026-04-17

## Context

RealWorld spec mandates `{ "errors": { "<field>": ["message"] } }` for all error responses. The field key varies by error type (token, credentials, article, comment, username, email, body, etc.). This cannot be a single generic handler.

## Decision

Each error class owns its `toJSON()` shape. Error classes accept a `resource` or `fieldErrors` parameter to control the key:

- `AuthenticationError(message, resource='token')` → `{ errors: { [resource]: [message] } }`
- `AuthorizationError(message, resource='article')` → `{ errors: { [resource]: ['forbidden'] } }`
- `NotFoundError(resource)` → `{ errors: { [resource.toLowerCase()]: ['not found'] } }`
- `ConflictError(fieldErrors)` → `{ errors: fieldErrors }` (409)
- `ValidationError(fieldErrors)` → `{ errors: fieldErrors }` (422, Zod field map)

## Consequences

- Adding a new error type requires choosing the right class and passing the correct resource name at the throw site
- Error format is tested by 1,013 harness assertions — regressions are caught immediately
- `zodFieldErrors(error)` helper extracts Zod issue paths into the field map format
