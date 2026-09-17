# G6 — Computed reads (DOMAIN_SPEC section 5). STRICT on the budget arithmetic.
# south: area 20, reading 6000, H1 10 AU open -> grazingDaysLeft = floor(6000*20 / (10*100)) = 120.

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
{"name":"south_{{uid}}","areaHectares":20,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid}}","readingDate":"2026-01-01","kgDryMatterPerHectare":6000}
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
h1: jsonpath "$.id"

# open move on south
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h1}}","paddockId":"{{pid}}","enteredAt":"2026-01-05T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

# P20 — budget with open move -> grazingDaysLeft == 120 (STRICT arithmetic)
GET {{host}}/paddocks/{{pid}}/budget
Authorization: Bearer {{otoken}}
HTTP 200
[Asserts]
jsonpath "$.grazingDaysLeft" == 120

# P23 — occupancy of south with H1 open (STRICT on occupied + herdId)
GET {{host}}/paddocks/{{pid}}/occupancy
Authorization: Bearer {{otoken}}
HTTP 200
[Asserts]
jsonpath "$.occupied" == true
jsonpath "$.herdId" == "{{h1}}"

# P24 — herd history newest-first, has >=2 entries after another move
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"east_{{uid}}","areaHectares":20,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid2: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid2}}","readingDate":"2026-01-01","kgDryMatterPerHectare":6000}
HTTP *
[Asserts]
status >= 200
status < 300

POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h1}}","paddockId":"{{pid2}}","enteredAt":"2026-02-01T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

GET {{host}}/herds/{{h1}}/history
Authorization: Bearer {{otoken}}
HTTP 200
[Asserts]
jsonpath "$" isCollection
jsonpath "$[0].paddockId" == "{{pid2}}"
jsonpath "$[0].enteredAt" exists

# P21 — budget on a paddock with a reading but NO open move -> grazingDaysLeft null
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"empty_{{uid}}","areaHectares":20,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid3: jsonpath "$.id"

POST {{host}}/readings
Authorization: Bearer {{otoken}}
{"paddockId":"{{pid3}}","readingDate":"2026-01-01","kgDryMatterPerHectare":6000}
HTTP *
[Asserts]
status >= 200
status < 300

GET {{host}}/paddocks/{{pid3}}/budget
Authorization: Bearer {{otoken}}
HTTP 200
[Asserts]
jsonpath "$.grazingDaysLeft" == null

# P22 — budget on a paddock with NO reading -> 422 (STRICT: rejects unmeasured)
POST {{host}}/paddocks
Authorization: Bearer {{otoken}}
{"name":"unmeasured_{{uid}}","areaHectares":20,"restDays":0}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
pid4: jsonpath "$.id"

GET {{host}}/paddocks/{{pid4}}/budget
Authorization: Bearer {{otoken}}
HTTP 422
