# G5 — R3 no overlapping open move (DOMAIN_SPEC section 4). Load-bearing business-rule group.
# south: area 20, reading 6000 -> cap 40. Two herds within cap. Open a move, test overlap, close, reopen.

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

POST {{host}}/herds
Authorization: Bearer {{otoken}}
{"name":"H2_{{uid}}","animalUnits":10}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
h2: jsonpath "$.id"

# Open a move on south (setup)
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h1}}","paddockId":"{{pid}}","enteredAt":"2026-01-05T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300
[Captures]
mid: jsonpath "$.id"

# P18 — second move onto south while first is open -> 422 rule_overlap (STRICT)
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h2}}","paddockId":"{{pid}}","enteredAt":"2026-01-06T00:00:00Z"}
HTTP 422
[Asserts]
jsonpath "$.error.code" == "rule_overlap"

# Close the open move (setup)
POST {{host}}/moves/{{mid}}/close
Authorization: Bearer {{otoken}}
{"leftAt":"2026-01-07T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300

# P19 — after close, a new move on south -> 2xx
POST {{host}}/moves
Authorization: Bearer {{otoken}}
{"herdId":"{{h2}}","paddockId":"{{pid}}","enteredAt":"2026-01-08T00:00:00Z"}
HTTP *
[Asserts]
status >= 200
status < 300
