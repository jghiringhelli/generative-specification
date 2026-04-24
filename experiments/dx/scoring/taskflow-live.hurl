# ==============================================================
# TASKFLOW EXECUTABLE LIVE TEST — 10 assertions
#
# Usage:
#   hurl --variable port=3001 --continue-on-error --test \
#        --report-tap results.tap taskflow-live.hurl
#
# Notes:
#   - Routes follow template structure: /users /boards /cards
#   - Auth: register → login → Bearer token
#   - DB must be initialised before starting server
#     (prisma db push or equivalent)
#
# Scoring rubric (applied in collect-metrics.ps1):
#   0 passes  → 0 pts
#   1–3 pass  → 1 pt  (server up, auth flow works)
#   4–7 pass  → 2 pts (CRUD complete)
#   8–10 pass → 3 pts (full protected-resource flow)
# ==============================================================

# ── 1. Register a user ──────────────────────────────────────
POST http://localhost:{{port}}/users/register
Content-Type: application/json
{
  "email": "hurl@test.io",
  "name": "Hurl Tester",
  "password": "Password123!"
}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
userId: jsonpath "$.id"

# ── 2. Login and capture token ──────────────────────────────
POST http://localhost:{{port}}/users/login
Content-Type: application/json
{
  "email": "hurl@test.io",
  "password": "Password123!"
}
HTTP 200
[Captures]
token: jsonpath "$.token"
[Asserts]
jsonpath "$.token" isString

# ── 3. Unauthenticated request returns 401 ──────────────────
GET http://localhost:{{port}}/boards
HTTP 401

# ── 4. Create a board ───────────────────────────────────────
POST http://localhost:{{port}}/boards
Content-Type: application/json
Authorization: Bearer {{token}}
{
  "name": "Sprint 1"
}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
boardId: jsonpath "$.id"

# ── 5. List boards (authenticated) ──────────────────────────
GET http://localhost:{{port}}/boards
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$" isCollection

# ── 6. Get board detail ─────────────────────────────────────
GET http://localhost:{{port}}/boards/{{boardId}}
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{boardId}}

# ── 7. Get user by ID ───────────────────────────────────────
GET http://localhost:{{port}}/users/{{userId}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{userId}}

# ── 8. Wrong credentials return 401 ─────────────────────────
POST http://localhost:{{port}}/users/login
Content-Type: application/json
{
  "email": "hurl@test.io",
  "password": "WrongPassword!"
}
HTTP 401

# ── 9. Get non-existent board returns 404 ───────────────────
GET http://localhost:{{port}}/boards/999999
Authorization: Bearer {{token}}
HTTP 404

# ── 10. Add board member ─────────────────────────────────────
POST http://localhost:{{port}}/boards/{{boardId}}/members
Content-Type: application/json
Authorization: Bearer {{token}}
{
  "memberId": {{userId}}
}
HTTP *
[Asserts]
status >= 200
status < 300
