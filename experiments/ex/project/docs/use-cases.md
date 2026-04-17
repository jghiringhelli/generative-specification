# Use Cases — Conduit API (RealWorld)

## UC-001: User Registration and Authentication

**Actor:** Anonymous user (registration) / Registered user (login)
**Trigger:** POST /api/users (register) · POST /api/users/login (login)

**Normal flow — Registration:**
1. Client sends email, username, password
2. System validates all fields present and valid format
3. System checks email and username uniqueness
4. System hashes password (bcrypt, rounds=12)
5. System creates user record
6. System signs JWT with userId payload (30d expiry)
7. System returns user object with token

**Normal flow — Login:**
1. Client sends email, password
2. System looks up user by email
3. System verifies password against bcrypt hash
4. System signs JWT
5. System returns user object with token

**Postcondition**: Caller holds a valid JWT token; user record exists in database with hashed password, not plaintext.

**Error Cases**:
- Missing required field (email/username/password): 422 with `{"errors":{"body":["can't be blank"]}}`
- Email already taken: 422 with field-specific error
- Username already taken: 422 with field-specific error
- Invalid email format: 422 validation error
- Wrong password on login: 422 generic error (do not distinguish email vs password)
- Non-existent email on login: 422 generic error

**Acceptance Criteria** (machine-checkable):
- [ ] POST /api/users returns 201 with `user.token` (non-empty string)
- [ ] POST /api/users/login returns 200 with `user.token` (non-empty string)
- [ ] Response includes `user.email`, `user.username`, `user.bio`, `user.image`
- [ ] Missing field returns 422 (not 400 or 500)
- [ ] Duplicate email returns 422
- [ ] Wrong password returns 422

---

## UC-002: User Profile and Follow

**Actor:** Authenticated or anonymous user (view) · Authenticated user (follow/unfollow)
**Trigger:** GET /api/profiles/:username · POST/DELETE /api/profiles/:username/follow

**Normal flow — Get profile:**
1. Optional auth middleware runs (user may or may not be logged in)
2. Service looks up target user by username
3. Returns profile with `following` boolean (false for anonymous)

**Normal flow — Follow:**
1. Auth middleware verifies JWT
2. Service looks up target user by username
3. Service creates UserFollow record
4. Returns target profile with `following: true`

**Normal flow — Unfollow:**
1. Auth middleware verifies JWT
2. Service removes UserFollow record
3. Returns target profile with `following: false`

**Postcondition**: Follow relationship persists; subsequent GET /api/profiles/:username returns `following: true` for the follower.

**Error Cases**:
- Target user not found: 404
- Follow without auth: 401
- Follow self: 422 or idempotent 200

**Acceptance Criteria** (machine-checkable):
- [ ] GET /api/profiles/:username returns 200 with `profile.username`, `profile.following`
- [ ] POST /api/profiles/:username/follow returns 200 with `profile.following: true`
- [ ] DELETE /api/profiles/:username/follow returns 200 with `profile.following: false`
- [ ] GET nonexistent profile returns 404
- [ ] Follow without auth returns 401

---

## UC-003: Article Management

**Actor:** Authenticated user (create/update/delete) · Any user (read)
**Trigger:** POST/GET/PUT/DELETE /api/articles[/:slug]

**Normal flow — Create:**
1. Auth middleware verifies JWT
2. Validate title, description, body present
3. Generate unique slug from title (lowercase, hyphen-separated)
4. Upsert tags from tagList
5. Create article with author and tags
6. Returns ArticleResponse with author profile embedded

**Normal flow — Read:**
1. Optional auth (for `favorited` status)
2. Look up article by slug
3. Return ArticleResponse

**Normal flow — Update:**
1. Auth middleware; verify current user is author
2. Update provided fields; regenerate slug if title changed
3. Returns updated ArticleResponse

**Normal flow — Delete:**
1. Auth middleware; verify current user is author
2. Delete article and cascade comments/favorites
3. Returns 204

**Postcondition**: Article exists in database with correct slug, author, tags, and favorited state.

**Error Cases**:
- Create without auth: 401
- Create with missing required fields: 422
- Update by non-author: 403
- Article not found: 404

**Acceptance Criteria** (machine-checkable):
- [ ] POST /api/articles returns 201 with `article.slug`, `article.author`
- [ ] GET /api/articles/:slug returns 200 with correct article shape
- [ ] PUT /api/articles/:slug returns 200 with updated fields
- [ ] DELETE /api/articles/:slug returns 204
- [ ] Create without auth returns 401
- [ ] Create with missing title returns 422
- [ ] Update by non-author returns 403

---

## UC-004: Article Feed

**Actor:** Authenticated user
**Trigger:** GET /api/articles/feed

**Normal flow:**
1. Auth middleware verifies JWT
2. Service fetches articles authored by users the current user follows
3. Order by most recent first
4. Paginate by `limit` (default 20) and `offset` (default 0)
5. Each article includes author profile, tags, favorited status, favoritesCount
6. Note: `body` field NOT included in list responses

**Postcondition**: Response contains only articles from followed authors, correctly paginated.

**Error Cases**:
- Not authenticated: 401
- Following no one: 200 with empty `articles` array

**Acceptance Criteria** (machine-checkable):
- [ ] GET /api/articles/feed returns 200 with `articles` array and `articlesCount`
- [ ] Without auth returns 401
- [ ] Respects `limit` and `offset` query params
- [ ] Each article has `author.following: true`

---

## UC-005: Article Comments

**Actor:** Authenticated user (add/delete) · Any user (list)
**Trigger:** POST/GET/DELETE /api/articles/:slug/comments[/:id]

**Normal flow — Add:**
1. Auth middleware verifies JWT
2. Look up article by slug
3. Create comment with body and author
4. Returns CommentResponse

**Normal flow — List:**
1. Optional auth
2. Look up article by slug
3. Return all comments ordered by creation date

**Normal flow — Delete:**
1. Auth middleware; verify current user is comment author
2. Delete comment by id
3. Returns 200

**Postcondition**: Comment persists and appears in GET /api/articles/:slug/comments response.

**Error Cases**:
- Add without auth: 401
- Article not found: 404
- Delete by non-author: 403
- Delete nonexistent comment: 404

**Acceptance Criteria** (machine-checkable):
- [ ] POST /api/articles/:slug/comments returns 200 with `comment.id`, `comment.body`
- [ ] GET /api/articles/:slug/comments returns 200 with `comments` array
- [ ] DELETE /api/articles/:slug/comments/:id returns 200
- [ ] Add comment without auth returns 401
- [ ] Delete comment by non-author returns 403

---

## UC-006: Article Tags

**Actor:** Any user
**Trigger:** GET /api/tags

**Normal flow:**
1. Service reads distinct tags from all published articles
2. Returns array of tag strings

**Postcondition**: Response includes all tags that appear on at least one article.

**Error Cases**:
- No articles exist: 200 with empty `tags` array

**Acceptance Criteria** (machine-checkable):
- [ ] GET /api/tags returns 200 with `tags` array (strings)
- [ ] Tags array is not null

---

## UC-007: Article Favorites

**Actor:** Authenticated user
**Trigger:** POST/DELETE /api/articles/:slug/favorite

**Normal flow — Favorite:**
1. Auth middleware verifies JWT
2. Look up article by slug
3. Create UserFavorite record
4. Increment favoritesCount
5. Returns ArticleResponse with `favorited: true`

**Normal flow — Unfavorite:**
1. Auth middleware; look up article
2. Delete UserFavorite record
3. Decrement favoritesCount
4. Returns ArticleResponse with `favorited: false`

**Postcondition**: GET /api/articles/:slug returns `favorited: true` for the user who favorited.

**Error Cases**:
- Without auth: 401
- Article not found: 404

**Acceptance Criteria** (machine-checkable):
- [ ] POST /api/articles/:slug/favorite returns 200 with `article.favorited: true`
- [ ] DELETE /api/articles/:slug/favorite returns 200 with `article.favorited: false`
- [ ] `article.favoritesCount` increments/decrements correctly
- [ ] Favorite without auth returns 401

---

## UC-008: Article List and Pagination

**Actor:** Any user
**Trigger:** GET /api/articles

**Normal flow:**
1. Optional auth (for `favorited` status and `following`)
2. Apply query filters: `tag`, `author`, `favorited`
3. Paginate by `limit` (default 20, max 100) and `offset` (default 0)
4. Return articles with `articlesCount` (total matching, not just page count)

**Postcondition**: Response contains correct subset based on filters and pagination.

**Error Cases**:
- Invalid `limit`/`offset` (negative): 422 or default to safe values

**Acceptance Criteria** (machine-checkable):
- [ ] GET /api/articles returns 200 with `articles` array and `articlesCount`
- [ ] `?tag=X` filters to articles tagged with X
- [ ] `?author=X` filters to articles by author X
- [ ] `?favorited=X` filters to articles favorited by user X
- [ ] `?limit=5&offset=0` returns at most 5 articles
- [ ] Each article shape includes slug, title, description, tagList, author (no `body`)
