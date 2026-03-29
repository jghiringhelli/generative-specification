---
nav_exclude: true
---

# CX-3: Missing error case

**SWE-bench class:** Missing error case

**Issue:**
`DELETE /api/articles/:slug` returns HTTP 403 (Forbidden) when the article does not exist, instead of HTTP 404 (Not Found). The authorization check runs before the existence check. A user who attempts to delete a non-existent article gets a misleading "forbidden" response rather than "not found."

**Acceptance criteria:**
- `DELETE /api/articles/:slug` with a non-existent slug returns HTTP 404
- `DELETE /api/articles/:slug` with an existing slug owned by a different user returns HTTP 403
- `DELETE /api/articles/:slug` with an existing slug owned by the requesting user returns HTTP 204
- All existing tests pass
- `tsc --noEmit` exits 0

**Why this class tests patchability:**
The fix requires finding the delete handler and reordering two checks (existence before authorization). A codebase with a named `NotFoundError` and a named `ForbiddenError` makes the fix a one-line reorder. A codebase with inline status codes requires the AI to understand implicit ordering across scattered conditionals.
