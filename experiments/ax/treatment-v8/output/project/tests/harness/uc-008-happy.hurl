# L2 Harness: UC-008 — List Tags [happy]
# Precondition: The system is operational.
# Postcondition: GET /api/tags => 200 { tags } — distinct, de-duplicated,
# alphabetically-sorted union of tagList across live articles; soft-deleted
# articles' tags drop out.
# Verifies AC-008.1..AC-008.4.
#
# Self-contained strategy: the actor's unique username is used as a private suffix so
# the control tags are globally unique, which makes the sorted-adjacency assertions stable.

# Register the actor; reuse its unique username as the private tag suffix.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc008-{{newUuid}}",
    "email": "uc008-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
token: jsonpath "$.user.token"
sfx: jsonpath "$.user.username"

# Two LIVE articles carrying the same tag "dup-<sfx>" (for AC-008.2: appears exactly once).
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc008 dup1 {{newUuid}}", "description": "d", "body": "b", "tagList": ["dup-{{sfx}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc008 dup2 {{newUuid}}", "description": "d", "body": "b", "tagList": ["dup-{{sfx}}"] } }
HTTP 201

# Two sort-control tags inserted in DESCENDING order ("...-b" before "...-a") so a
# correctly-sorting server must reorder them to "...-a","...-b" (AC-008.3).
# They share an otherwise-unused prefix, so nothing sorts between them => they are adjacent.
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc008 sortb {{newUuid}}", "description": "d", "body": "b", "tagList": ["srt-{{sfx}}-b"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc008 sorta {{newUuid}}", "description": "d", "body": "b", "tagList": ["srt-{{sfx}}-a"] } }
HTTP 201

# An article whose only tag is "del-<sfx>", which we then soft-delete (AC-008.4).
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc008 del {{newUuid}}", "description": "d", "body": "b", "tagList": ["del-{{sfx}}"] } }
HTTP 201
[Captures]
del_slug: jsonpath "$.article.slug"

DELETE http://localhost:3008/api/articles/{{del_slug}}
Authorization: Token {{token}}
HTTP 204

# AC-008.1: GET /api/tags (no auth) => 200 with a tags array.
# AC-008.2: the dup tag is present, and NOT duplicated (sorted => duplicates would be adjacent).
# AC-008.3: the sort-control pair appears in ascending order and adjacent.
# AC-008.4: the deleted article's sole tag is absent.
GET http://localhost:3008/api/tags
HTTP 200
[Asserts]
jsonpath "$.tags" isCollection
jsonpath "$.tags" contains "dup-{{sfx}}"
body not contains "\"dup-{{sfx}}\",\"dup-{{sfx}}\""
body contains "\"srt-{{sfx}}-a\",\"srt-{{sfx}}-b\""
jsonpath "$.tags" not contains "del-{{sfx}}"
