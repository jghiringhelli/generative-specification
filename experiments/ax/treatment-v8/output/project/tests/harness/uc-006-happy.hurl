# L2 Harness: UC-006 — Favorite and Unfavorite an Article [happy]
# Precondition: Actor is authenticated and the target article exists.
# Postcondition: favorite/unfavorite return 200 with the full article (body included);
# favoritesCount is derived; operations are idempotent.
# Verifies AC-006.1..AC-006.5.

# Register the article author.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc006a-{{newUuid}}",
    "email": "uc006a-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
author_token: jsonpath "$.user.token"

# Register the actor who favorites.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc006f-{{newUuid}}",
    "email": "uc006f-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
fan_token: jsonpath "$.user.token"

# Author creates a fresh article (favoritesCount starts at 0).
POST http://localhost:3008/api/articles
Authorization: Token {{author_token}}
Content-Type: application/json
{ "article": { "title": "uc006 article {{newUuid}}", "description": "d", "body": "b" } }
HTTP 201
[Captures]
slug: jsonpath "$.article.slug"
[Asserts]
jsonpath "$.article.favoritesCount" == 0

# AC-006.5: POST /api/articles/:slug/favorite without auth => 401.
POST http://localhost:3008/api/articles/{{slug}}/favorite
HTTP 401

# AC-006.1: POST .../favorite (auth) => 200, favorited === true, favoritesCount === 1.
POST http://localhost:3008/api/articles/{{slug}}/favorite
Authorization: Token {{fan_token}}
HTTP 200
[Asserts]
jsonpath "$.article.favorited" == true
jsonpath "$.article.favoritesCount" == 1
jsonpath "$.article.body" isString

# AC-006.2: A second POST .../favorite => 200, favorited === true, favoritesCount still 1 (idempotent).
POST http://localhost:3008/api/articles/{{slug}}/favorite
Authorization: Token {{fan_token}}
HTTP 200
[Asserts]
jsonpath "$.article.favorited" == true
jsonpath "$.article.favoritesCount" == 1

# AC-006.3: DELETE .../favorite => 200, favorited === false, favoritesCount === 0.
DELETE http://localhost:3008/api/articles/{{slug}}/favorite
Authorization: Token {{fan_token}}
HTTP 200
[Asserts]
jsonpath "$.article.favorited" == false
jsonpath "$.article.favoritesCount" == 0

# AC-006.4: POST /api/articles/<unknown>/favorite => 404.
POST http://localhost:3008/api/articles/uc006-unknown-{{newUuid}}/favorite
Authorization: Token {{fan_token}}
HTTP 404
