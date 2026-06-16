# Held-out oracle — the FULL intent (the worker NEVER sees this; the harness runs it)
# Measures: aggregation by type (not raw rows) · activeMembers7d · a type outside the illustrative list counted.

# Seed members
POST {{host}}/api/members
{ "username": "alice_{{uid}}" }
HTTP 201
[Captures]
m1: jsonpath "$.member.id"

POST {{host}}/api/members
{ "username": "bob_{{uid}}" }
HTTP 201
[Captures]
m2: jsonpath "$.member.id"

# m1: login, post, post, share   (share = type outside the illustrative list)
POST {{host}}/api/activity
{ "memberId": {{m1}}, "type": "login" }
HTTP 201
POST {{host}}/api/activity
{ "memberId": {{m1}}, "type": "post" }
HTTP 201
POST {{host}}/api/activity
{ "memberId": {{m1}}, "type": "post" }
HTTP 201
POST {{host}}/api/activity
{ "memberId": {{m1}}, "type": "share" }
HTTP 201

# m2: login, comment
POST {{host}}/api/activity
{ "memberId": {{m2}}, "type": "login" }
HTTP 201
POST {{host}}/api/activity
{ "memberId": {{m2}}, "type": "comment" }
HTTP 201

# Dashboard — demands the intent
GET {{host}}/api/admin/activity/dashboard
HTTP 200
[Asserts]
jsonpath "$.activeMembers7d" == 2
jsonpath "$.perMember" count == 2
jsonpath "$.perMember[*].actionsByType.post" includes 2
jsonpath "$.perMember[*].actionsByType.login" includes 1
jsonpath "$.perMember[*].actionsByType.share" includes 1
jsonpath "$.perMember[*].actionsByType.comment" includes 1
