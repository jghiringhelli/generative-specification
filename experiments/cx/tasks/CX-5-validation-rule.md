---
nav_exclude: true
---

# CX-5: Validation rule addition

**SWE-bench class:** Validation rule addition

**Issue:**
`POST /api/articles` accepts article titles of any length. Titles longer than 255 characters cause a database error at the persistence layer (column length constraint) rather than a clean validation error at the API boundary. Add input validation so titles longer than 255 characters are rejected with HTTP 422 and a clear error message before reaching the database.

**Acceptance criteria:**
- `POST /api/articles` with `title` longer than 255 characters returns HTTP 422
- Error response follows the resource-scoped envelope: `{ "errors": { "title": ["is too long (maximum 255 characters)"] } }`
- `POST /api/articles` with a valid title still creates the article (no regression)
- All existing tests pass
- `tsc --noEmit` exits 0

**Why this class tests patchability:**
The fix requires finding the article creation schema/validator and adding one constraint. A codebase with a named Zod schema at the route boundary (Verifiable property) makes this a one-line addition. A codebase with validation scattered across the service or mixed with business logic requires the AI to find the right layer to add the constraint.
