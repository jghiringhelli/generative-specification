# L2 Harness: UC-002 — View and Update the Current User [happy]
# Precondition: Actor holds a valid JWT for an existing account.
# Postcondition: GET and PUT return 200 with { user: { email, token, username, bio, image } }.
# Verifies AC-002.2 (get), AC-002.3 (partial update), AC-002.4 (empty update 422),
# AC-002.5 (email collision 409).

# Register the actor.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc002-{{newUuid}}",
    "email": "uc002-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
token: jsonpath "$.user.token"
email: jsonpath "$.user.email"
username: jsonpath "$.user.username"

# Register a second account whose email we will try to steal in AC-002.5.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc002b-{{newUuid}}",
    "email": "uc002b-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
other_email: jsonpath "$.user.email"

# AC-002.2: GET /api/user with a valid token => 200 and user.email matches the account.
GET http://localhost:3008/api/user
Authorization: Token {{token}}
HTTP 200
[Asserts]
jsonpath "$.user.email" == "{{email}}"
jsonpath "$.user.username" == "{{username}}"

# AC-002.3: PUT /api/user with { user: { bio: 'hi' } } => 200 and user.bio === 'hi';
# other fields unchanged.
PUT http://localhost:3008/api/user
Authorization: Token {{token}}
Content-Type: application/json
{ "user": { "bio": "hi" } }
HTTP 200
[Asserts]
jsonpath "$.user.bio" == "hi"
jsonpath "$.user.email" == "{{email}}"
jsonpath "$.user.username" == "{{username}}"

# AC-002.4: PUT /api/user with { user: {} } => 422.
PUT http://localhost:3008/api/user
Authorization: Token {{token}}
Content-Type: application/json
{ "user": {} }
HTTP 422

# AC-002.5: PUT /api/user changing email to another user's email => 409.
PUT http://localhost:3008/api/user
Authorization: Token {{token}}
Content-Type: application/json
{ "user": { "email": "{{other_email}}" } }
HTTP 409
