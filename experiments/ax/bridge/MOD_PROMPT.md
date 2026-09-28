Add a new endpoint to this RealWorld "Conduit" API backend: `GET /api/articles/count`.

Behavior: it returns JSON `{"articlesCount": N}` where N is the total number of articles currently in the database. It requires NO authentication.

Rules:
- Follow the existing architecture, layering, naming, and conventions of THIS codebase exactly. Put each piece where this codebase would put it.
- Do NOT break any existing endpoint or behavior.
- Read only what you need to place the change correctly, then make the edits with your tools.
- Ensure it type-checks (`npx tsc --noEmit` would pass).
