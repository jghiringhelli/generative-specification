# Held-out oracle — Member Portal (measures how many requirements survive the overload)
# R1 create · R2/R9 validation+error-shape · R6 activity · R7 aggregated dashboard · R4 pagination total · R8 health · R5 404

# R1: valid create
POST {{host}}/api/members
{ "username": "alice_{{uid}}", "email": "alice_{{uid}}@test.com" }
HTTP 201
[Captures]
m1: jsonpath "$.member.id"

# R2/R9: invalid email -> 422 with {errors:{}} shape
POST {{host}}/api/members
{ "username": "bad_{{uid}}", "email": "notanemail" }
HTTP 422
[Asserts]
jsonpath "$.errors" exists

# second member
POST {{host}}/api/members
{ "username": "bob_{{uid}}", "email": "bob_{{uid}}@test.com" }
HTTP 201
[Captures]
m2: jsonpath "$.member.id"

# R6: activity (incl. share, outside the illustrative list)
POST {{host}}/api/members/{{m1}}/activity
{ "type": "login" }
HTTP 201
POST {{host}}/api/members/{{m1}}/activity
{ "type": "post" }
HTTP 201
POST {{host}}/api/members/{{m1}}/activity
{ "type": "post" }
HTTP 201
POST {{host}}/api/members/{{m1}}/activity
{ "type": "share" }
HTTP 201
POST {{host}}/api/members/{{m2}}/activity
{ "type": "login" }
HTTP 201

# R7: dashboard AGGREGATED by type + active 7d
GET {{host}}/api/admin/activity/dashboard
HTTP 200
[Asserts]
jsonpath "$.activeMembers7d" == 2
jsonpath "$.perMember[*].actionsByType.post" includes 2
jsonpath "$.perMember[*].actionsByType.share" includes 1

# R4: pagination with full total
GET {{host}}/api/members?limit=1
HTTP 200
[Asserts]
jsonpath "$.members" count == 1
jsonpath "$.total" == 2

# R8: health
GET {{host}}/api/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.uptimeSeconds" exists

# R5/R9: not found with error shape
GET {{host}}/api/members/99999999
HTTP 404
[Asserts]
jsonpath "$.errors" exists
