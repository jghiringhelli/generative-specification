The RealWorld API conformance suite (Hurl) was run against the live server (http://localhost:3008). 12 of 13 files failed. Fix the implementation so the suite passes. The failures:

=== hurl-articles.hurl ===
error: Assert status code
   --> articles.hurl:225:6
    |
    | PUT {{host}}/api/articles/{{slug}}
    | ...
225 | HTTP 200
    |      ^^^ actual value is <422>

=== hurl-auth.hurl ===
error: Assert failure
   --> auth.hurl:91:0
    |
    | PUT {{host}}/api/user
    | ...
 91 | jsonpath "$.user.bio" == null
    |   actual:   string <>

=== hurl-comments.hurl ===
error: Assert failure
   --> comments.hurl:38:0
    |
    | POST {{host}}/api/articles/{{slug}}/comments
    | ...
 38 | jsonpath "$.comment.id" isInteger
    |   actual:   string <db2c0d43-0703-4e2a-9877-68b4e98ed4b6>

=== hurl-errors_articles.hurl ===
error: Assert failure
   --> errors_articles.hurl:12:0
    |
    | POST {{host}}/api/articles
    | ...
 12 | jsonpath "$.errors.token[0]" == "is missing"
    |   actual:   none

=== hurl-errors_auth.hurl ===
error: Assert failure
   --> errors_auth.hurl:25:0
    |
    | POST {{host}}/api/users
    | ...
 25 | jsonpath "$.errors.email[0]" == "can't be blank"
    |   actual:   string <is invalid>

=== hurl-errors_authorization.hurl ===
error: Assert failure
  --> errors_authorization.hurl:46:0
   |
   | DELETE {{host}}/api/articles/{{slug}}
   | ...
46 | jsonpath "$.errors.article[0]" == "forbidden"
   |   actual:   none

=== hurl-errors_comments.hurl ===
error: Assert failure
  --> errors_comments.hurl:10:0
   |
   | POST {{host}}/api/articles/some-slug/comments
   | ...
10 | jsonpath "$.errors.token[0]" == "is missing"
   |   actual:   none

=== hurl-errors_profiles.hurl ===
error: Assert failure
  --> errors_profiles.hurl:5:0
   |
   | GET {{host}}/api/profiles/unknown-user-{{uid}}
   | ...
 5 | jsonpath "$.errors.profile[0]" == "not found"
   |   actual:   none

=== hurl-favorites.hurl ===
error: Assert status code
   --> favorites.hurl:132:6
    |
    | DELETE {{host}}/api/articles/{{slug}}
    | ...
132 | HTTP 204
    |      ^^^ actual value is <200>

=== hurl-feed.hurl ===
error: Assert status code
   --> feed.hurl:120:6
    |
    | DELETE {{host}}/api/articles/{{slug1}}
    | ...
120 | HTTP 204
    |      ^^^ actual value is <200>

=== hurl-pagination.hurl ===
error: Assert status code
  --> pagination.hurl:64:6
   |
   | DELETE {{host}}/api/articles/{{slug1}}
   | ...
64 | HTTP 204
   |      ^^^ actual value is <200>

=== hurl-profiles.hurl ===

=== hurl-tags.hurl ===
error: Assert status code
  --> tags.hurl:43:6
   |
   | DELETE {{host}}/api/articles/{{slug}}
   | ...
43 | HTTP 204
   |      ^^^ actual value is <200>

