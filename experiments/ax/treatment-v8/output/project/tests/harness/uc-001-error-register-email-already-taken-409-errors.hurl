# L2 Harness: UC-001 — Register and Log In [error]
# Precondition: The system is operational.
# Postcondition (error): duplicate email => 409 { errors: { email: ['has already been taken'] } }.
# Verifies AC-001.2 (dup email), AC-001.3 (short password), AC-001.5 (wrong password).

# Seed: register a user we will collide against.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc001e-{{newUuid}}",
    "email": "uc001e-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
email: jsonpath "$.user.email"

# AC-001.2: A second POST reusing the same email => 409 with body exactly
# { errors: { email: ['has already been taken'] } }.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc001e2-{{newUuid}}",
    "email": "{{email}}",
    "password": "password123"
  }
}
HTTP 409
[Asserts]
jsonpath "$.errors.email" count == 1
jsonpath "$.errors.email[0]" == "has already been taken"

# AC-001.3: POST with a password of length 7 => 422 and errors.password is a non-empty array.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc001e3-{{newUuid}}",
    "email": "uc001e3-{{newUuid}}@example.com",
    "password": "short12"
  }
}
HTTP 422
[Asserts]
jsonpath "$.errors.password" isCollection
jsonpath "$.errors.password" count >= 1

# AC-001.5: POST /api/users/login with a wrong password => 401 with body exactly
# { errors: { credentials: ['invalid'] } }.
POST http://localhost:3008/api/users/login
Content-Type: application/json
{
  "user": {
    "email": "{{email}}",
    "password": "wrongpassword"
  }
}
HTTP 401
[Asserts]
jsonpath "$.errors.credentials" count == 1
jsonpath "$.errors.credentials[0]" == "invalid"
