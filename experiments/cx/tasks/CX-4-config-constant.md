---
nav_exclude: true
---

# CX-4: Config/constant extraction

**SWE-bench class:** Config/constant extraction

**Issue:**
The default pagination limit (20 articles per page) is hardcoded in multiple places across the codebase. When `GET /api/articles` is called without a `limit` query parameter, the default of 20 is applied. This value appears as a magic number in at least two locations and cannot be changed via environment variable. Extract it to a named constant `DEFAULT_PAGE_LIMIT` and read the value from `PAGE_LIMIT` environment variable with 20 as the fallback.

**Acceptance criteria:**
- A named constant `DEFAULT_PAGE_LIMIT` exists, initialized from `process.env.PAGE_LIMIT ?? 20`
- All hardcoded `20` pagination defaults are replaced with `DEFAULT_PAGE_LIMIT`
- `GET /api/articles` without `limit` param still returns at most 20 articles (default unchanged)
- All existing tests pass
- `tsc --noEmit` exits 0

**Why this class tests patchability:**
The fix requires finding all uses of the magic number and replacing them with a single named source. A codebase with named constants already (Bounded property) has a clear pattern to follow. A codebase with scattered magic numbers requires the AI to find all occurrences without a naming convention to guide the search.
