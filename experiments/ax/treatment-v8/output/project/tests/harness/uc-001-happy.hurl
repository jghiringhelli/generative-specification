# L2 Harness: UC-001 — Register and Log In [happy]
# Precondition: The system is operational.
# Postcondition: A user account exists; the Actor holds a JWT identifying it.
# Verifies AC-001.1 (register) and AC-001.4 (login).

# AC-001.1: POST /api/users (no auth) with a valid unique user => 201;
# user.token non-empty string; user.bio === null and user.image === null.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc001-{{newUuid}}",
    "email": "uc001-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
email: jsonpath "$.user.email"
username: jsonpath "$.user.username"
[Asserts]
jsonpath "$.user.token" isString
jsonpath "$.user.token" matches /.+/
jsonpath "$.user.bio" == null
jsonpath "$.user.image" == null
jsonpath "$.user.username" == "{{username}}"

# AC-001.4: POST /api/users/login with the registered email + correct password
# => 200 with a user.token.
POST http://localhost:3008/api/users/login
Content-Type: application/json
{
  "user": {
    "email": "{{email}}",
    "password": "password123"
  }
}
HTTP 200
[Asserts]
jsonpath "$.user.token" isString
jsonpath "$.user.token" matches /.+/
jsonpath "$.user.email" == "{{email}}"
