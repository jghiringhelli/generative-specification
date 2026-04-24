# ==============================================================
# VAQUITA EXECUTABLE LIVE TEST — 10 assertions
#
# Usage:
#   hurl --variable port=3000 --continue-on-error --test \
#        --report-tap results.tap vaquita-live.hurl
#
# Scoring rubric (applied in collect-metrics.ps1):
#   0 passes  → 0 pts
#   1–3 pass  → 1 pt  (server up, basic resource creation)
#   4–7 pass  → 2 pts (domain model complete)
#   8–10 pass → 3 pts (full tanda lifecycle)
# ==============================================================

# ── 1. Create organiser (Alice) ─────────────────────────────
POST http://localhost:{{port}}/api/users
Content-Type: application/json
{
  "email": "alice@hurltest.io",
  "name": "Alice"
}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
aliceId: jsonpath "$.id"

# ── 2. Create member (Bob) ──────────────────────────────────
POST http://localhost:{{port}}/api/users
Content-Type: application/json
{
  "email": "bob@hurltest.io",
  "name": "Bob"
}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
bobId: jsonpath "$.id"

# ── 3. Create member (Carol) ────────────────────────────────
POST http://localhost:{{port}}/api/users
Content-Type: application/json
{
  "email": "carol@hurltest.io",
  "name": "Carol"
}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
carolId: jsonpath "$.id"

# ── 4. Create tanda ─────────────────────────────────────────
POST http://localhost:{{port}}/api/tandas
Content-Type: application/json
{
  "name": "Tanda Enero",
  "organizerId": {{aliceId}},
  "contributionAmount": 1000
}
HTTP *
[Captures]
tandaId: jsonpath "$.id"
[Asserts]
status >= 200
status < 300
jsonpath "$.status" == "forming"

# ── 5. Get tanda by ID ──────────────────────────────────────
GET http://localhost:{{port}}/api/tandas/{{tandaId}}
HTTP 200
[Asserts]
jsonpath "$.id" == {{tandaId}}

# ── 6. List tandas for Alice ────────────────────────────────
GET http://localhost:{{port}}/api/tandas?userId={{aliceId}}
HTTP 200
[Asserts]
jsonpath "$" isCollection

# ── 7. Bob joins ────────────────────────────────────────────
POST http://localhost:{{port}}/api/tandas/{{tandaId}}/join
Content-Type: application/json
{
  "userId": {{bobId}}
}
HTTP *
[Asserts]
status >= 200
status < 300

# ── 8. Carol joins ──────────────────────────────────────────
POST http://localhost:{{port}}/api/tandas/{{tandaId}}/join
Content-Type: application/json
{
  "userId": {{carolId}}
}
HTTP *
[Asserts]
status >= 200
status < 300

# ── 9. Start tanda (organiser, ≥3 members) ──────────────────
POST http://localhost:{{port}}/api/tandas/{{tandaId}}/start
Content-Type: application/json
{
  "organizerId": {{aliceId}}
}
HTTP *
[Asserts]
status >= 200
status < 300

# ── 10. Second start rejected (business rule) ───────────────
POST http://localhost:{{port}}/api/tandas/{{tandaId}}/start
Content-Type: application/json
{
  "organizerId": {{aliceId}}
}
HTTP *
[Asserts]
status >= 400
