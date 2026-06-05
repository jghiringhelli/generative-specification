# L2 Harness: UC-005 — List Articles, Feed, and Pagination [happy]
# Precondition: Zero or more non-deleted articles exist.
# Postcondition: list & feed return 200 { articles, articlesCount }; items omit body;
# newest first; limit defaults to 20; articlesCount is the pre-pagination total.
# Verifies AC-005.1..AC-005.5.
#
# Self-contained strategy: the actor's unique username doubles as a private tag so
# the list can be scoped to exactly the 21 articles this probe creates.

# Register the actor; reuse its unique username as a private filter tag.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc005a-{{newUuid}}",
    "email": "uc005a-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
token: jsonpath "$.user.token"
tag: jsonpath "$.user.username"

# Register a second author (B) the actor will follow, for the feed checks.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc005b-{{newUuid}}",
    "email": "uc005b-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
b_token: jsonpath "$.user.token"
b_name: jsonpath "$.user.username"

# Create 21 articles (> 20) tagged with the private tag so default-limit paging shows.
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a01 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a02 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a03 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a04 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a05 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a06 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a07 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a08 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a09 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a10 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a11 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a12 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a13 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a14 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a15 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a16 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a17 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a18 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a19 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a20 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201

# The 21st article is the newest matching one; capture its slug for AC-005.3.
POST http://localhost:3008/api/articles
Authorization: Token {{token}}
Content-Type: application/json
{ "article": { "title": "uc005 a21 {{newUuid}}", "description": "d", "body": "b", "tagList": ["{{tag}}"] } }
HTTP 201
[Captures]
newest_slug: jsonpath "$.article.slug"

# AC-005.1: GET /api/articles => 200; each item omits body; articlesCount is an integer.
# AC-005.2: with > 20 articles, at most 20 items are returned and articlesCount is the full total (21).
GET http://localhost:3008/api/articles?tag={{tag}}
HTTP 200
[Asserts]
jsonpath "$.articlesCount" isInteger
jsonpath "$.articlesCount" == 21
jsonpath "$.articles" count == 20
jsonpath "$.articles[0].body" not exists
jsonpath "$.articles[0].slug" isString

# AC-005.3: GET /api/articles?limit=1 => exactly 1 item; articles[0] is the most
# recently created matching article.
GET http://localhost:3008/api/articles?tag={{tag}}&limit=1
HTTP 200
[Asserts]
jsonpath "$.articles" count == 1
jsonpath "$.articles[0].slug" == "{{newest_slug}}"
jsonpath "$.articlesCount" == 21

# AC-005.4: GET /api/articles?author=<nonexistent> => 200 with articles === [] and articlesCount === 0.
GET http://localhost:3008/api/articles?author=uc005-nobody-{{newUuid}}
HTTP 200
[Asserts]
jsonpath "$.articles" count == 0
jsonpath "$.articlesCount" == 0

# AC-005.5 (part 1): GET /api/articles/feed without auth => 401.
GET http://localhost:3008/api/articles/feed
HTTP 401

# B authors exactly one article; the actor follows B.
POST http://localhost:3008/api/articles
Authorization: Token {{b_token}}
Content-Type: application/json
{ "article": { "title": "uc005 feed {{newUuid}}", "description": "d", "body": "b" } }
HTTP 201
[Captures]
b_slug: jsonpath "$.article.slug"

POST http://localhost:3008/api/profiles/{{b_name}}/follow
Authorization: Token {{token}}
HTTP 200

# AC-005.5 (part 2): GET /api/articles/feed with auth => 200 containing only articles
# authored by users the viewer follows (here, exactly B's one article).
GET http://localhost:3008/api/articles/feed
Authorization: Token {{token}}
HTTP 200
[Asserts]
jsonpath "$.articlesCount" == 1
jsonpath "$.articles" count == 1
jsonpath "$.articles[0].author.username" == "{{b_name}}"
jsonpath "$.articles[0].slug" == "{{b_slug}}"
jsonpath "$.articles[0].body" not exists
