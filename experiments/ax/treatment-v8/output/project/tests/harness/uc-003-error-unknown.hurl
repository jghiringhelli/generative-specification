# L2 Harness: UC-003 — View a Profile and Follow / Unfollow [error]
# Precondition: A target user identified by :username exists.
# Postcondition (error): unknown :username (any of the three) => 404
# { errors: { profile: ['not found'] } }.
# Verifies AC-003.5.

# AC-003.5: GET /api/profiles/<nonexistent> => 404 with body
# { errors: { profile: ['not found'] } }.
GET http://localhost:3008/api/profiles/uc003-nobody-{{newUuid}}
HTTP 404
[Asserts]
jsonpath "$.errors.profile" count == 1
jsonpath "$.errors.profile[0]" == "not found"
