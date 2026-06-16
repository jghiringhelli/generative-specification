# Node: members

R1. `POST /api/members` body `{ "username": "...", "email": "..." }` → **201** `{ "member": { "id": ..., "username": "...", "email": "...", "createdAt": "<ISO>" } }`.
R2. Validation: `username` required, non-empty; `email` must match a basic email regex. Violation → **422** `{ "errors": { "<field>": ["<msg>"] } }`.
R3. Duplicate `username` → **409** `{ "errors": { "username": ["already taken"] } }`.
R4. `GET /api/members?limit=&offset=` → **200** `{ "members": [...], "total": <int> }`. Default `limit=20`, `offset=0`. `total` = FULL count (not the page size).
R5. `GET /api/members/:id` → **200** `{ "member": {...} }` or **404** `{ "errors": { "member": ["not found"] } }`.
R11. `DELETE /api/members/:id` → **204**; a subsequent GET → 404; its activity is deleted too (cascade).
