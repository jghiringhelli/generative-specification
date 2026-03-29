---
nav_exclude: true
---

# CX-2: Contract mismatch

**SWE-bench class:** Contract mismatch

**Issue:**
The `POST /api/users/login` endpoint returns HTTP 200 on success but the Conduit OpenAPI spec requires HTTP 200 with the user envelope `{ "user": { ... } }`. The current implementation returns the user object directly without the envelope wrapper on login, while `POST /api/users` (registration) correctly wraps it. This inconsistency causes client SDK failures.

**Acceptance criteria:**
- `POST /api/users/login` returns `{ "user": { email, username, token, bio, image } }`
- `POST /api/users` (registration) still returns the same envelope (no regression)
- All existing tests pass
- `tsc --noEmit` exits 0

**Why this class tests patchability:**
The fix requires finding the login handler, identifying that it uses a different response shape than registration, and making them consistent. A codebase with named response DTOs and a single composition point makes the divergence visible. A codebase with ad-hoc inline response construction requires the AI to compare two handlers manually.
