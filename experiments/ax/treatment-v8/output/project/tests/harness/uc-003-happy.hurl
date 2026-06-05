# L2 Harness: UC-003 — View a Profile and Follow / Unfollow [happy]
# Precondition: A target user identified by :username exists.
# Postcondition: All three endpoints return 200 with { profile: { username, bio, image, following } }.
# Verifies AC-003.1 (anon), AC-003.2 (follow), AC-003.3 (idempotent follow), AC-003.4 (unfollow).

# Register the viewer (the actor who follows).
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc003v-{{newUuid}}",
    "email": "uc003v-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
viewer_token: jsonpath "$.user.token"

# Register the target user to be followed.
POST http://localhost:3008/api/users
Content-Type: application/json
{
  "user": {
    "username": "uc003t-{{newUuid}}",
    "email": "uc003t-{{newUuid}}@example.com",
    "password": "password123"
  }
}
HTTP 201
[Captures]
target: jsonpath "$.user.username"

# AC-003.1: GET /api/profiles/:username for an existing user, anonymous => 200
# and profile.following === false.
GET http://localhost:3008/api/profiles/{{target}}
HTTP 200
[Asserts]
jsonpath "$.profile.username" == "{{target}}"
jsonpath "$.profile.following" == false

# AC-003.2: POST /api/profiles/:username/follow (auth) => 200 and profile.following === true.
POST http://localhost:3008/api/profiles/{{target}}/follow
Authorization: Token {{viewer_token}}
HTTP 200
[Asserts]
jsonpath "$.profile.username" == "{{target}}"
jsonpath "$.profile.following" == true

# AC-003.3: A second POST .../follow => 200, still following === true (idempotent, no duplicate).
POST http://localhost:3008/api/profiles/{{target}}/follow
Authorization: Token {{viewer_token}}
HTTP 200
[Asserts]
jsonpath "$.profile.following" == true

# AC-003.4: DELETE /api/profiles/:username/follow => 200 and profile.following === false.
DELETE http://localhost:3008/api/profiles/{{target}}/follow
Authorization: Token {{viewer_token}}
HTTP 200
[Asserts]
jsonpath "$.profile.following" == false
