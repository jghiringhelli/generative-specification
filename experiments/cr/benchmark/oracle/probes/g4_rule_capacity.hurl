# G4 — R2 stocking rate vs capacity (DOMAIN_SPEC section 4). Load-bearing business-rule group.
# north: area 10, reading 3000 -> capacityAU = 3000*10/3000 = 10.
# H2 = 500 AU (exceeds), H1 = 10 AU (equal, passes). dry paddock has no reading.
# Order: reject probes first (no state change), accept last (opens a move).

POST {{host}}/register
{"email":"owner_{{uid}}@t.com","password":"password123","role":"owner"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
otoken: jsonpath "$.token"

POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"north_{{uid}}","areaHectares":10,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid}}","readingDate":"2026-01-01","kgDryMatterPerHectare":3000}
HTTP *
[Asserts]
status >= 200
status < 300

# dry paddock: no reading (undefined capacity)
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"dry_{{uid}}","areaHectares":10,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
dryid: jsonpath "$.id"

POST {{host}}/herds
Authorization: Bearer {{otoken}}
{"name":"H1_{{uid}}","animalUnits":10}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
h1: jsonpath "$.id"

POST {{host}}/herds
Authorization: Bearer {{otoken}}
{"name":"H2_{{uid}}","animalUnits":500}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
h2: jsonpath "$.id"

# P15 — H2 (500) onto north (cap 10) -> 422 rule_capacity (STRICT)
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h2}}","paddockId":"{{pid}}","enteredAt":"2026-01-05T00:00:00Z"}
HTTP 422
[Asserts]
jsonpath "$.error.code" == "rule_capacity"

# P17 — H1 (10) onto dry paddock (no reading) -> 422 rule_capacity (STRICT)
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h1}}","paddockId":"{{dryid}}","enteredAt":"2026-01-05T00:00:00Z"}
HTTP 422
[Asserts]
jsonpath "$.error.code" == "rule_capacity"

# P16 — H1 (10) onto north (cap 10, EQUAL) -> 2xx (only *exceeds* is rejected)
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h1}}","paddockId":"{{pid}}","enteredAt":"2026-01-05T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300
