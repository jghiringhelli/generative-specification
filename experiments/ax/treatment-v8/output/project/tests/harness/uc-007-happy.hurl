# L2 Harness: UC-007 — Comment on an Article [happy]
# Precondition: The article identified by :slug exists.
# Postcondition: list => 200 (newest first, integer id); add => 201; delete => 204 empty,
# soft-deleted and excluded from subsequent reads.
# Verifies AC-007.1..AC-007.6.

# Register the article author.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc007a-{{newUuid}}",
    "email": "uc007a-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
author_token: jsonpath "$.user.token"

# Register the commenter.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc007c-{{newUuid}}",
    "email": "uc007c-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
commenter_token: jsonpath "$.user.token"

# Author creates two articles: one to comment on, one for the mismatched-slug check.
POST http://localhost:3008/api/articles
Authorization: Token {{author_token}}
Content-Type: application/json
{ "article": { "title": "uc007 article {{newUuid}}", "description": "d", "body": "b" } }
HTTP 201
[Captures]
slug: jsonpath "$.article.slug"

POST http://localhost:3008/api/articles
Authorization: Token {{author_token}}
Content-Type: application/json
{ "article": { "title": "uc007 other {{newUuid}}", "description": "d", "body": "b" } }
HTTP 201
[Captures]
other_slug: jsonpath "$.article.slug"

# AC-007.1: POST .../comments (auth) with a non-blank body => 201; comment.id is an
# integer; comment.author.following === false for a non-followed author.
POST http://localhost:3008/api/articles/{{slug}}/comments
Authorization: Token {{commenter_token}}
Content-Type: application/json
{ "comment": { "body": "first comment" } }
HTTP 201
[Captures]
comment_id: jsonpath "$.comment.id"
[Asserts]
jsonpath "$.comment.id" isInteger
jsonpath "$.comment.body" == "first comment"
jsonpath "$.comment.author.following" == false

# AC-007.2: GET .../comments => 200; newest first (the just-created comment is comments[0]).
GET http://localhost:3008/api/articles/{{slug}}/comments
HTTP 200
[Asserts]
jsonpath "$.comments[0].id" == {{comment_id}}

# AC-007.3: POST .../comments with { comment: { body: '' } } => 422.
POST http://localhost:3008/api/articles/{{slug}}/comments
Authorization: Token {{commenter_token}}
Content-Type: application/json
{ "comment": { "body": "" } }
HTTP 422

# AC-007.5: DELETE .../comments/:id by a non-author => 403 with body
# { errors: { comment: ['forbidden'] } }.
DELETE http://localhost:3008/api/articles/{{slug}}/comments/{{comment_id}}
Authorization: Token {{author_token}}
HTTP 403
[Asserts]
jsonpath "$.errors.comment" count == 1
jsonpath "$.errors.comment[0]" == "forbidden"

# AC-007.6: DELETE of the comment id under a mismatched article slug => 404.
DELETE http://localhost:3008/api/articles/{{other_slug}}/comments/{{comment_id}}
Authorization: Token {{commenter_token}}
HTTP 404

# AC-007.4: DELETE .../comments/:id by the author => 204 empty body; the comment no
# longer appears in the list.
DELETE http://localhost:3008/api/articles/{{slug}}/comments/{{comment_id}}
Authorization: Token {{commenter_token}}
HTTP 204
[Asserts]
bytes count == 0

GET http://localhost:3008/api/articles/{{slug}}/comments
HTTP 200
[Asserts]
jsonpath "$.comments" count == 0
