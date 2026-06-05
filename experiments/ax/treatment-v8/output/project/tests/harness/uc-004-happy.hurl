# L2 Harness: UC-004 — Create, Read, Update, and Delete an Article [happy]
# Precondition: For create, Actor is authenticated. For update/delete, the article
# exists and Actor is its author.
# Postcondition: Create => 201; get/update => 200 (single-article includes body);
# delete => 204 empty body, then GET => 404.
# Verifies AC-004.1..AC-004.6.

# AC-004.6: POST /api/articles without auth => 401.
POST http://localhost:3008/api/articles
Content-Type: application/json
{ "article": { "title": "no auth", "description": "d", "body": "b" } }
HTTP 401

# Register the author.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc004a-{{newUuid}}",
    "email": "uc004a-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
author_token: jsonpath "$.user.token"

# Register a non-author for the 403 check.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc004b-{{newUuid}}",
    "email": "uc004b-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
other_token: jsonpath "$.user.token"

# AC-004.1: POST /api/articles (auth) with a valid article => 201; slug non-empty,
# favoritesCount === 0, favorited === false, body present.
POST http://localhost:3008/api/articles
Authorization: Token {{author_token}}
Content-Type: application/json
{
  "article": {
    "title": "UC-004 Article {{newUuid}}",
    "description": "the description",
    "body": "the body",
    "tagList": ["uc004"]
  }
}
HTTP 201
[Captures]
slug: jsonpath "$.article.slug"
[Asserts]
jsonpath "$.article.slug" matches /.+/
jsonpath "$.article.favoritesCount" == 0
jsonpath "$.article.favorited" == false
jsonpath "$.article.body" == "the body"

# AC-004.2: Two articles created with the same title produce two distinct slug values.
POST http://localhost:3008/api/articles
Authorization: Token {{author_token}}
Content-Type: application/json
{ "article": { "title": "UC-004 Dup Title Fixed", "description": "d", "body": "b" } }
HTTP 201
[Captures]
slug_dup1: jsonpath "$.article.slug"

POST http://localhost:3008/api/articles
Authorization: Token {{author_token}}
Content-Type: application/json
{ "article": { "title": "UC-004 Dup Title Fixed", "description": "d", "body": "b" } }
HTTP 201
[Asserts]
jsonpath "$.article.slug" != "{{slug_dup1}}"

# AC-004.3: GET /api/articles/:slug for an existing article => 200 and response
# article includes a body field.
GET http://localhost:3008/api/articles/{{slug}}
HTTP 200
[Asserts]
jsonpath "$.article.slug" == "{{slug}}"
jsonpath "$.article.body" isString

# AC-004.4: PUT /api/articles/:slug by a non-author => 403 with body
# { errors: { article: ['forbidden'] } }.
PUT http://localhost:3008/api/articles/{{slug}}
Authorization: Token {{other_token}}
Content-Type: application/json
{ "article": { "title": "hijacked" } }
HTTP 403
[Asserts]
jsonpath "$.errors.article" count == 1
jsonpath "$.errors.article[0]" == "forbidden"

# AC-004.5: DELETE /api/articles/:slug by the author => 204 empty body;
# a subsequent GET => 404.
DELETE http://localhost:3008/api/articles/{{slug}}
Authorization: Token {{author_token}}
HTTP 204
[Asserts]
bytes count == 0

GET http://localhost:3008/api/articles/{{slug}}
HTTP 404
