
# Prompt 1 — Authentication

Implement user authentication:
- POST /api/users (register)
- POST /api/users/login (login)
- GET /api/user (get current user, auth required)
- PUT /api/user (update user, auth required)

Include input validation, JWT token generation/verification, and password hashing.
Write unit tests for auth logic and integration tests for all four endpoints.

**IMPORTANT — JWT expiry**: Use the pattern documented in CLAUDE.md § Known Type Pitfalls.
`process.env.JWT_EXPIRY` is `string | undefined` and is NOT directly assignable to `SignOptions['expiresIn']`.
Cast via: `const JWT_EXPIRY = (process.env.JWT_EXPIRY ?? '7d') as SignOptions['expiresIn'];`

---
**Before committing:** run the Verification Protocol (see CLAUDE.md § Verification Protocol).
All 7 steps must pass. Do not commit a partial green state.
