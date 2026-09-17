# G1 — Auth & roles (DOMAIN_SPEC section 2, 6). Self-contained: seeds its own uid-namespaced
# fixtures. Tolerant on 2xx family for creates/reads; STRICT on the error codes.

# Seed: owner + hand
POST {{host}}/register
{"email":"owner_{{uid}}@t.com","password":"password123","role":"owner"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
otoken: jsonpath "$.token"

POST {{host}}/register
{"email":"hand_{{uid}}@t.com","password":"password123","role":"hand"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
htoken: jsonpath "$.token"

# P1 — no token -> 401 unauthenticated (STRICT)
POST {{host}}/moves
{"herdId":"00000000-0000-0000-0000-000000000000","paddockId":"00000000-0000-0000-0000-000000000000","enteredAt":"2026-01-01T00:00:00Z"}
HTTP 401
[Asserts]
jsonpath "$.error.code" == "unauthenticated"

# P2 — hand creates paddock -> 403 forbidden (STRICT)
POST {{host}}/paddocks
Authorization: Bearer {{htoken}}
{"name":"deny_{{uid}}","areaHectares":10,"restDays":30}
HTTP 403
[Asserts]
jsonpath "$.error.code" == "forbidden"

# P3 — owner creates paddock -> 2xx
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"north_{{uid}}","areaHectares":10,"restDays":30}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid: jsonpath "$.id"

# reading -> capacity 3000*10/3000 = 10 AU
POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid}}","readingDate":"2026-01-01","kgDryMatterPerHectare":3000}
HTTP *
[Asserts]
status >= 200
status < 300

# herd within capacity (10 AU)
POST {{host}}/herds
Authorization: Bearer {{otoken}}
{"name":"H1_{{uid}}","animalUnits":10}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
hid: jsonpath "$.id"

# P4 — hand records a move -> 2xx (hand MAY move)
POST {{host}}/moves
Authorization: Bearer {{htoken}}
{"herdId":"{{hid}}","paddockId":"{{pid}}","enteredAt":"2026-03-01T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

# P5 — hand records a reading -> 2xx (hand MAY record readings)
POST {{host}}/readings
Authorization: Bearer {{htoken}}
{"paddockId":"{{pid}}","readingDate":"2026-03-02","kgDryMatterPerHectare":3200}
HTTP *
[Asserts]
status >= 200
status < 300
