# L2 Harness: UC-002 — View and Update the Current User [error]
# Precondition: Actor holds a valid JWT for an existing account.
# Postcondition (error): missing token => 401 { errors: { token: ['is missing'] } }.
# Verifies AC-002.1.

# AC-002.1: GET /api/user with no Authorization header => 401 with body
# { errors: { token: ['is missing'] } }.
GET http://localhost:3008/api/user
HTTP 401
[Asserts]
jsonpath "$.errors.token" count == 1
jsonpath "$.errors.token[0]" == "is missing"
