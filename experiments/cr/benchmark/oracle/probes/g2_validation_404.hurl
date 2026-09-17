# G2 — Validation & 404 & error-body shape (DOMAIN_SPEC section 3, 6). STRICT on codes + shape.

# Seed owner
POST {{host}}/register
{"email":"owner_{{uid}}@t.com","password":"password123","role":"owner"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
otoken: jsonpath "$.token"

# P6 — empty name -> 422 validation (STRICT) + error body shape (P10 folded here)
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"","areaHectares":10,"restDays":30}
HTTP 422
[Asserts]
jsonpath "$.error.code" == "validation"
jsonpath "$.error.message" isString

# P7 — non-positive area -> 422 validation (STRICT)
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"bad_{{uid}}","areaHectares":-1,"restDays":30}
HTTP 422
[Asserts]
jsonpath "$.error.code" == "validation"

# P8 — unknown paddock id -> 404 not_found (STRICT)
GET {{host}}/paddocks/11111111-1111-1111-1111-111111111111
Authorization: Bearer {{otoken}}
HTTP 404
[Asserts]
jsonpath "$.error.code" == "not_found"

# P9 — close unknown move -> 404 not_found (STRICT)
POST {{host}}/moves/22222222-2222-2222-2222-222222222222/close
Authorization: Bearer {{otoken}}
{"leftAt":"2026-01-02T00:00:00Z"}
HTTP 404
[Asserts]
jsonpath "$.error.code" == "not_found"
