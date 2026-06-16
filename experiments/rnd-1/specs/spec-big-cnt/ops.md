# Node: ops (cross-cutting)

R8. `GET /api/health` → **200** `{ "status": "ok", "uptimeSeconds": <number> }`.
R9. **ALL** error responses use the `{ "errors": { ... } }` shape consistently (never a bare string, never `{error:"..."}`).
R10. All timestamps in **ISO 8601**.
