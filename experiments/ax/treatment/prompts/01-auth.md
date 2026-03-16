# Prompt 1 — Authentication

Implement user authentication:
- POST /api/users (register)
- POST /api/users/login (login)
- GET /api/user (get current user, auth required)
- PUT /api/user (update user, auth required)

Include input validation, JWT token generation/verification, and password hashing.
Write unit tests for auth logic and integration tests for all four endpoints.

---
**Before committing:** run the Verification Protocol (see CLAUDE.md § Verification Protocol).
All 5 steps must pass. Do not commit a partial green state.
