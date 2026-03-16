# ADR-002: JWT Authentication Strategy

**Date:** 2026-03-11
**Status:** Accepted

## Context

The RealWorld spec requires `Authorization: Token jwt.token.here` header format. Users must be able to authenticate and carry identity across requests. No session storage is specified.

## Decision

Stateless JWT using `jsonwebtoken` library. Tokens signed with HS256 using a secret from env. Tokens carry the user ID as payload. No refresh tokens for this scope.

## Alternatives Considered

| Option | Rejected Reason |
|---|---|
| Session cookies | Stateful — requires session store, adds infrastructure dependency |
| OAuth2 | Over-scoped for this single-service API |
| Refresh token rotation | Out of scope for RealWorld spec — adds complexity without spec requirement |
| Paseto | Correct choice for production, but reduces comparability with existing RealWorld implementations |

## Consequences

**Positive:**
- Dead simple — no session store dependency
- Stateless — horizontal scaling without sticky sessions
- Directly matches RealWorld spec header format

**Negative:**
- Tokens cannot be server-side invalidated without a token blacklist (out of scope)
- Long-lived tokens (user must re-login if secret rotates)

## Implementation Rules (enforced in CLAUDE.md)

- JWT secret from environment variable only — never hardcoded
- Token verification in auth middleware — NOT in route handlers
- Middleware returns 401 with spec-compliant error body on failure
