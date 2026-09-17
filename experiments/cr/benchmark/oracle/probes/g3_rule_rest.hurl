# G3 — R1 minimum rest (DOMAIN_SPEC section 4). Load-bearing business-rule group.
# north has restDays 30. Move H1 in at T0, close at T0+1d, then test re-entry windows.
# Order matters: the REJECT probe (no open move) runs before the ACCEPT probe (opens one),
# so rule_rest is isolated from rule_overlap.

# Seed owner
POST {{host}}/register
{"email":"owner_{{uid}}@t.com","password":"password123","role":"owner"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
otoken: jsonpath "$.token"

# north (restDays 30) + reading (cap 10) + H1 (10 AU)
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"north_{{uid}}","areaHectares":10,"restDays":30}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid}}","readingDate":"2025-12-01","kgDryMatterPerHectare":3000}
HTTP *
[Asserts]
status >= 200
status < 300

POST {{host}}/herds
Authorization: Bearer {{otoken}}
{"name":"H1_{{uid}}","animalUnits":10}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
hid: jsonpath "$.id"

# First graze: enter at T0, then close at T0+1d
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{hid}}","paddockId":"{{pid}}","enteredAt":"2026-01-01T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
mid: jsonpath "$.id"

POST {{host}}/moves/{{mid}}/close
Authorization: Bearer {{otoken}}
{"leftAt":"2026-01-02T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

# P11 — re-enter at left+10d (< left+30d) -> 422 rule_rest (STRICT). No open move: isolates R1.
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{hid}}","paddockId":"{{pid}}","enteredAt":"2026-01-12T00:00:00Z"}
HTTP 422
[Asserts]
jsonpath "$.error.code" == "rule_rest"

# P12 — re-enter at left+40d (> left+30d) -> 2xx accepted
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{hid}}","paddockId":"{{pid}}","enteredAt":"2026-02-11T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

# P13 — zero-rest paddock allows immediate re-entry after close
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"south_{{uid}}","areaHectares":20,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid2: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid2}}","readingDate":"2025-12-01","kgDryMatterPerHectare":6000}
HTTP *
[Asserts]
status >= 200
status < 300

POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{hid}}","paddockId":"{{pid2}}","enteredAt":"2026-01-01T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
mid2: jsonpath "$.id"

POST {{host}}/moves/{{mid2}}/close
Authorization: Bearer {{otoken}}
{"leftAt":"2026-01-02T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{hid}}","paddockId":"{{pid2}}","enteredAt":"2026-01-02T00:00:01Z"}
HTTP *
[Asserts]
status >= 200
status < 300

# P14 — first-ever move on a never-grazed paddock -> 2xx (R1 does not block)
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"fresh_{{uid}}","areaHectares":20,"restDays":30}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid3: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid3}}","readingDate":"2025-12-01","kgDryMatterPerHectare":6000}
HTTP *
[Asserts]
status >= 200
status < 300

POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{hid}}","paddockId":"{{pid3}}","enteredAt":"2026-01-01T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300
