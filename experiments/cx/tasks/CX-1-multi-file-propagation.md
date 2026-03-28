# CX-1: Multi-file propagation

**SWE-bench class:** Multi-file propagation

**Issue:**
The article list endpoint (`GET /api/articles`) returns articles but does not include the `updatedAt` field in the response body. The Conduit spec requires `updatedAt` to be present on every article object. It is present on single-article responses (`GET /api/articles/:slug`) but missing from list responses.

**Acceptance criteria:**
- `GET /api/articles` response includes `updatedAt` on every article object in the `articles` array
- `GET /api/articles/:slug` response still includes `updatedAt` (no regression)
- All existing tests pass
- `tsc --noEmit` exits 0

**Why this class tests patchability:**
The fix requires touching the domain type, the repository query, the response mapper, and the route handler. A codebase with clear layer boundaries and named types makes each touch point findable. A flat codebase requires the AI to trace implicit data flow.
