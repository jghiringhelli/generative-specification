# Use Cases — Conduit API

## UC-01: Register User

**Actor:** Anonymous user
**Precondition:** Email and username not already in use
**Trigger:** POST /api/users

**Normal flow:**
1. Client sends email, username, password
2. System validates all fields present and valid
3. System checks email and username uniqueness
4. System hashes password (bcrypt, rounds=12)
5. System creates user record
6. System signs JWT with userId payload
7. System returns user object with token

**Error flows:**
- 422: Missing required field (body: ["email/username/password can't be blank"])
- 422: Email already taken
- 422: Username already taken

---

## UC-02: Authenticate User

**Actor:** Registered user
**Precondition:** User account exists
**Trigger:** POST /api/users/login

**Normal flow:**
1. Client sends email, password
2. System looks up user by email
3. System verifies password against bcrypt hash
4. System signs JWT
5. System returns user object with token

**Error flows:**
- 422: Email or password invalid (generic — do not distinguish which)

---

## UC-03: Create Article

**Actor:** Authenticated user
**Precondition:** Valid JWT in Authorization header
**Trigger:** POST /api/articles

**Normal flow:**
1. Auth middleware verifies JWT, attaches userId to request
2. Route validates title, description, body present
3. Service generates slug from title (lowercase, hyphen-separated, unique)
4. Service upserts tags from tagList
5. Service creates article with author and tags
6. Returns ArticleWithAuthorAndTags

**Error flows:**
- 401: Missing or invalid token
- 422: Missing required fields

---

## UC-04: Get Article Feed

**Actor:** Authenticated user
**Precondition:** Valid JWT; user follows at least one other user
**Trigger:** GET /api/articles/feed

**Normal flow:**
1. Auth middleware verifies JWT
2. Service fetches articles by users the current user follows
3. Ordered by most recent first
4. Paginated by limit/offset query params (defaults: limit=20, offset=0)
5. Each article includes: author profile, tags, favorited status for current user, favoritesCount
6. Note: body field NOT included in list response

**Error flows:**
- 401: Missing or invalid token

---

## UC-05: Follow User

**Actor:** Authenticated user
**Precondition:** Valid JWT; target user exists; not already following
**Trigger:** POST /api/profiles/:username/follow

**Normal flow:**
1. Auth middleware verifies JWT
2. Service looks up target user by username
3. Service creates UserFollow record (followerId=currentUser, followingId=targetUser)
4. Returns target profile with following=true

**Error flows:**
- 401: Not authenticated
- 404: Target user not found
- 422: Already following (idempotent alternative: return 200 with current state)

---

## UC-06: Delete Comment

**Actor:** Authenticated user (comment author)
**Precondition:** Valid JWT; comment exists; current user is comment author
**Trigger:** DELETE /api/articles/:slug/comments/:id

**Normal flow:**
1. Auth middleware verifies JWT
2. Service looks up comment by id
3. Service verifies comment.authorId === currentUser.id
4. Service deletes comment
5. Returns 200 (no body)

**Error flows:**
- 401: Not authenticated
- 403: Current user is not comment author
- 404: Comment not found or article slug not found
