# Member Portal API — spec (FLAT, prescriptive, dense)

Node/Express backend, in-memory store. Implement ALL requirements with their exact shapes.

R1. `POST /api/members` body `{ "username": "...", "email": "..." }` → **201** `{ "member": { "id": ..., "username": "...", "email": "...", "createdAt": "<ISO>" } }`.
R2. Validation: `username` required, non-empty; `email` must match a basic email regex. Violation → **422** `{ "errors": { "<field>": ["<msg>"] } }` (NOT a bare string, NOT `{error:"..."}`).
R3. Duplicate `username` → **409** `{ "errors": { "username": ["already taken"] } }`.
R4. `GET /api/members?limit=&offset=` → **200** `{ "members": [...], "total": <int> }`. Default `limit=20`, `offset=0`. `total` = FULL count (not the page size).
R5. `GET /api/members/:id` → **200** `{ "member": {...} }` or **404** `{ "errors": { "member": ["not found"] } }`.
R6. `POST /api/members/:id/activity` body `{ "type": "..." }` → **201**. `type` is a free string (login, post, comment, share, …) — illustrative, **NOT exhaustive**; any type is recorded and counted with no special code.
R7. `GET /api/admin/activity/dashboard` → **200** `{ "perMember": [ { "memberId": ..., "lastAccess": "<ISO>", "actionsByType": { "<type>": <count> } } ], "activeMembers7d": <int> }`. **Aggregated by type** (NOT raw rows); `activeMembers7d` = members with ≥1 action in the last 7 days; any `type` (e.g. `share`) counts.
R8. `GET /api/health` → **200** `{ "status": "ok", "uptimeSeconds": <number> }`.
R9. **ALL** error responses use the `{ "errors": { ... } }` shape consistently (never a bare string, never `{error:"..."}`).
R10. All timestamps in **ISO 8601**.
R11. `DELETE /api/members/:id` → **204**; a subsequent GET of the member → 404; its activity is deleted too (cascade).
R12. The dashboard (R7) only counts activity of **existing** members (activity of deleted members is excluded).
