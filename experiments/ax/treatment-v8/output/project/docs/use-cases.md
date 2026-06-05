# Use Cases — project

> Behavioral contracts of the implemented RealWorld Conduit REST API.
> Derived from the shipped implementation (`src/http`, `src/services`) and the
> external Hurl conformance suite (`evidence/hurl`, 13/13 green). One UC per
> endpoint group. Each UC carries machine-checkable Acceptance Criteria.

## Conventions (apply to every UC)

- **Auth header**: `Authorization: Token <jwt>` (RealWorld) or `Bearer <jwt>`
  (compatibility). JWT is HS256, payload `{ userId }`.
- **Optional auth**: a missing / malformed / expired / invalid token serves the
  anonymous view (never `401`); viewer-relative flags (`following`, `favorited`)
  are then `false`.
- **Error envelope**: every error body is `{ "errors": { "<key>": ["<msg>", …] } }`.
  Validation (`422`) is field-keyed (envelope prefix `user`/`article`/`comment`
  stripped); other errors are resource-scoped (`token`, `credentials`, `profile`,
  `article`, `comment`, `email`, `username`).
- **Profile object** (embedded as `author` and returned by profile endpoints):
  `{ username, bio, image, following }` — `bio`/`image` nullable.

---

## UC-001: Register and Log In

**Actor**: API consumer (unauthenticated client)
**Precondition**: The system is operational.
**Steps**:
1. Actor `POST /api/users` with `{ user: { username, email, password } }`.
2. System validates fields, ensures email and username are unique, hashes the
   password (Argon2id), persists the user, and issues a JWT.
3. Actor later `POST /api/users/login` with `{ user: { email, password } }`.
4. System verifies the credentials and issues a fresh JWT.
**Postcondition**: A user account exists; the Actor holds a JWT identifying it.
Register returns `201`; login returns `200`. Both return
`{ user: { email, token, username, bio, image } }` (`bio`/`image` `null` for a
new account).
**Error Cases**:
- Register — email already taken → `409` `{ errors: { email: ['has already been taken'] } }`.
- Register — username already taken → `409` `{ errors: { username: ['has already been taken'] } }`.
- Register — missing/blank/invalid field (email format, password < 8 chars) →
  `422` field-keyed (e.g. `{ errors: { email: ['is invalid'] } }`).
- Login — unknown email OR wrong password → `401`
  `{ errors: { credentials: ['invalid'] } }` (identical message; no account
  enumeration).
- Login — missing/blank field → `422`.
**Acceptance Criteria**:
- AC-001.1: `POST /api/users` (no auth) with a valid unique user ⇒ `201`; response
  `user.token` is a non-empty string; `user.bio === null` and `user.image === null`.
- AC-001.2: A second `POST /api/users` reusing the same email ⇒ `409` with body
  exactly `{ errors: { email: ['has already been taken'] } }`.
- AC-001.3: `POST /api/users` with `password` of length 7 ⇒ `422` and response
  `errors.password` is a non-empty array.
- AC-001.4: `POST /api/users/login` with the registered email + correct password
  ⇒ `200` with a `user.token`.
- AC-001.5: `POST /api/users/login` with a wrong password ⇒ `401` with body
  exactly `{ errors: { credentials: ['invalid'] } }`.

---

## UC-002: View and Update the Current User

**Actor**: Authenticated user
**Precondition**: Actor holds a valid JWT for an existing account.
**Steps**:
1. Actor `GET /api/user` with the auth header.
2. System resolves the token to the account and returns it.
3. Actor `PUT /api/user` with `{ user: { … } }` containing one or more of
   `email`, `username`, `password`, `bio`, `image`.
4. System validates, enforces email/username uniqueness against other accounts,
   applies the partial update, and returns the account.
**Postcondition**: Both calls return `200` with
`{ user: { email, token, username, bio, image } }`. The token is unchanged by
`PUT`. Blank/whitespace-only `bio`/`image` coerce to `null`.
**Error Cases**:
- Missing token → `401` `{ errors: { token: ['is missing'] } }`.
- Invalid/expired token or unsupported scheme → `401`.
- `PUT` with an empty `user` object (no fields) → `422`.
- `PUT` changing email/username to one owned by another account → `409`.
- `PUT` with an invalid field value → `422` field-keyed.
**Acceptance Criteria**:
- AC-002.1: `GET /api/user` with no `Authorization` header ⇒ `401` with body
  `{ errors: { token: ['is missing'] } }`.
- AC-002.2: `GET /api/user` with a valid token ⇒ `200` and `user.email` matches
  the authenticated account.
- AC-002.3: `PUT /api/user` with `{ user: { bio: 'hi' } }` ⇒ `200` and
  `user.bio === 'hi'`; other fields unchanged.
- AC-002.4: `PUT /api/user` with `{ user: {} }` ⇒ `422`.
- AC-002.5: `PUT /api/user` changing email to another user's email ⇒ `409`.

---

## UC-003: View a Profile and Follow / Unfollow

**Actor**: API consumer (GET: anonymous or authenticated; follow/unfollow:
authenticated user)
**Precondition**: A target user identified by `:username` exists.
**Steps**:
1. Actor `GET /api/profiles/:username` (optional auth).
2. System returns the profile with `following` reflecting the viewer's edge
   (`false` when anonymous).
3. Authenticated Actor `POST /api/profiles/:username/follow` to follow, or
   `DELETE /api/profiles/:username/follow` to unfollow.
4. System creates/removes the follow edge idempotently and returns the profile.
**Postcondition**: All three endpoints return `200` with
`{ profile: { username, bio, image, following } }`. After `POST .../follow`,
`following === true`; after `DELETE .../follow`, `following === false`. Follow
and unfollow are idempotent (repeat ⇒ same state, no error, no duplicate edge).
Self-follow is permitted (not special-cased).
**Error Cases**:
- Unknown `:username` (any of the three) → `404`
  `{ errors: { profile: ['not found'] } }`.
- `POST`/`DELETE .../follow` without auth → `401`.
**Acceptance Criteria**:
- AC-003.1: `GET /api/profiles/:username` for an existing user, anonymous ⇒ `200`
  and `profile.following === false`.
- AC-003.2: `POST /api/profiles/:username/follow` (auth) ⇒ `200` and
  `profile.following === true`.
- AC-003.3: A second `POST .../follow` ⇒ `200`, still `following === true` (no
  error, no duplicate).
- AC-003.4: `DELETE /api/profiles/:username/follow` ⇒ `200` and
  `profile.following === false`.
- AC-003.5: `GET /api/profiles/<nonexistent>` ⇒ `404` with body
  `{ errors: { profile: ['not found'] } }`.

---

## UC-004: Create, Read, Update, and Delete an Article

**Actor**: API consumer (GET: optional auth; create/update/delete: authenticated
author)
**Precondition**: For create, Actor is authenticated. For update/delete, the
article exists and Actor is its author.
**Steps**:
1. Actor `POST /api/articles` with `{ article: { title, description, body, tagList? } }`.
2. System validates, derives a unique `slug` from the title (slugified; on
   collision appends an 8-char suffix), de-duplicates/drops-blank tags, and
   persists the article.
3. Anyone `GET /api/articles/:slug` to read the full article (optional auth).
4. Author `PUT /api/articles/:slug` with a partial `{ article: { … } }`; if
   `title` changes the slug is re-derived.
5. Author `DELETE /api/articles/:slug` to soft-delete it.
**Postcondition**: Create ⇒ `201`; get/update ⇒ `200`, each returning
`{ article: { slug, title, description, body, tagList, createdAt, updatedAt,
favorited, favoritesCount, author } }` (single-article responses **include**
`body`). Delete ⇒ `204` with an empty body; the article is soft-deleted
(`deletedAt` set) and excluded from all subsequent reads (`GET` ⇒ `404`). On
create, `favorited === false`, `favoritesCount === 0`, `createdAt === updatedAt`.
**Error Cases**:
- Create/update/delete without auth → `401`.
- Create with a blank/missing required field → `422` field-keyed.
- Update with an empty `article` object → `422`.
- Update/delete by a non-author → `403` `{ errors: { article: ['forbidden'] } }`.
- Update/delete/get of an unknown or soft-deleted slug → `404`.
**Acceptance Criteria**:
- AC-004.1: `POST /api/articles` (auth) with a valid article ⇒ `201`;
  `article.slug` is non-empty, `article.favoritesCount === 0`,
  `article.favorited === false`, and `article.body` is present.
- AC-004.2: Two articles created with the same title produce two distinct
  `slug` values.
- AC-004.3: `GET /api/articles/:slug` for an existing article ⇒ `200` and the
  response `article` includes a `body` field.
- AC-004.4: `PUT /api/articles/:slug` by a non-author ⇒ `403` with body
  `{ errors: { article: ['forbidden'] } }`.
- AC-004.5: `DELETE /api/articles/:slug` by the author ⇒ `204` with an empty
  body; a subsequent `GET /api/articles/:slug` ⇒ `404`.
- AC-004.6: `POST /api/articles` without auth ⇒ `401`.

---

## UC-005: List Articles, Feed, and Pagination

**Actor**: API consumer (list: optional auth; feed: authenticated user)
**Precondition**: Zero or more non-deleted articles exist.
**Steps**:
1. Actor `GET /api/articles` with optional filters `tag`, `author`,
   `favorited`, and pagination `limit` / `offset`.
2. System returns the matching page, newest first, with the pre-pagination total.
3. Authenticated Actor `GET /api/articles/feed` to get articles by followed
   authors, with the same pagination.
**Postcondition**: Both return `200` with
`{ articles: [...], articlesCount }`. List/feed article items **omit** the
`body` field (performance contract). Order is newest first (`createdAt` desc,
insertion-sequence tie-break). `limit` defaults to `20` (range 1–100), `offset`
defaults to `0`. `articlesCount` is the total matching count **before**
pagination. Filters combine conjunctively; `author`/`favorited` naming a
non-existent user yields an empty page (`articlesCount === 0`), **not** `404`.
The feed of a user following no one is an empty page.
**Error Cases**:
- `GET /api/articles/feed` without auth → `401`.
- `limit`/`offset` out of range or non-numeric → `422`.
**Acceptance Criteria**:
- AC-005.1: `GET /api/articles` ⇒ `200`; each item in `articles` has **no**
  `body` field; response has an integer `articlesCount`.
- AC-005.2: With > 20 articles, `GET /api/articles` returns at most 20 items and
  `articlesCount` equals the full matching total.
- AC-005.3: `GET /api/articles?limit=1` returns exactly 1 item (when ≥1 match);
  `articles[0]` is the most recently created matching article.
- AC-005.4: `GET /api/articles?author=<nonexistent>` ⇒ `200` with
  `articles === []` and `articlesCount === 0`.
- AC-005.5: `GET /api/articles/feed` without auth ⇒ `401`; with auth ⇒ `200`
  containing only articles authored by users the viewer follows.

---

## UC-006: Favorite and Unfavorite an Article

**Actor**: Authenticated user
**Precondition**: Actor is authenticated and the target article exists.
**Steps**:
1. Actor `POST /api/articles/:slug/favorite` to favorite.
2. System records the favorite edge idempotently and recomputes the count.
3. Actor `DELETE /api/articles/:slug/favorite` to unfavorite.
**Postcondition**: Both return `200` with the full article
`{ article: { …, favorited, favoritesCount, … } }` (body included). After
favorite, `favorited === true` and `favoritesCount` reflects the increment;
after unfavorite, `favorited === false` and the count reflects the decrement.
`favoritesCount` is derived, not stored. Operations are idempotent (re-favorite
/ re-unfavorite ⇒ same state, count unchanged, no error).
**Error Cases**:
- Without auth → `401`.
- Unknown/soft-deleted slug → `404`.
**Acceptance Criteria**:
- AC-006.1: `POST /api/articles/:slug/favorite` (auth) ⇒ `200`,
  `article.favorited === true`, `article.favoritesCount === 1` (from 0).
- AC-006.2: A second `POST .../favorite` ⇒ `200`, `favorited === true`,
  `favoritesCount` still `1` (idempotent).
- AC-006.3: `DELETE /api/articles/:slug/favorite` ⇒ `200`,
  `favorited === false`, `favoritesCount === 0`.
- AC-006.4: `POST /api/articles/<unknown>/favorite` ⇒ `404`.
- AC-006.5: `POST /api/articles/:slug/favorite` without auth ⇒ `401`.

---

## UC-007: Comment on an Article

**Actor**: API consumer (list: optional auth; add/delete: authenticated user;
delete: comment author only)
**Precondition**: The article identified by `:slug` exists.
**Steps**:
1. Anyone `GET /api/articles/:slug/comments` (optional auth) to list comments.
2. Authenticated Actor `POST /api/articles/:slug/comments` with
   `{ comment: { body } }` to add one.
3. The comment's author `DELETE /api/articles/:slug/comments/:id` to remove it.
**Postcondition**: List ⇒ `200` `{ comments: [ { id, body, createdAt,
updatedAt, author } ] }`, newest first; `id` is an integer. Add ⇒ `201`
`{ comment: { id, body, createdAt, updatedAt, author } }` with
`createdAt === updatedAt`. Delete ⇒ `204` empty body; the comment is
soft-deleted and excluded from subsequent reads.
**Error Cases**:
- Add/delete without auth → `401`.
- Add with a blank/missing `body` → `422`.
- List/add/delete on an unknown or soft-deleted `:slug` → `404`.
- Delete with an unknown `:id`, a non-integer `:id`, or an `:id` that belongs to
  a different article → `404`.
- Delete by a non-author → `403` `{ errors: { comment: ['forbidden'] } }`.
**Acceptance Criteria**:
- AC-007.1: `POST /api/articles/:slug/comments` (auth) with a non-blank body ⇒
  `201`; `comment.id` is an integer; `comment.author.following === false` for a
  non-followed author.
- AC-007.2: `GET /api/articles/:slug/comments` ⇒ `200`; `comments` ordered
  newest first (the just-created comment is `comments[0]`).
- AC-007.3: `POST /api/articles/:slug/comments` with `{ comment: { body: '' } }`
  ⇒ `422`.
- AC-007.4: `DELETE /api/articles/:slug/comments/:id` by the author ⇒ `204`
  empty body; the comment no longer appears in the list.
- AC-007.5: `DELETE /api/articles/:slug/comments/:id` by a non-author ⇒ `403`
  with body `{ errors: { comment: ['forbidden'] } }`.
- AC-007.6: `DELETE` of a comment id under a mismatched article slug ⇒ `404`.

---

## UC-008: List Tags

**Actor**: API consumer (unauthenticated or authenticated)
**Precondition**: The system is operational.
**Steps**:
1. Actor `GET /api/tags` (no auth).
2. System returns the distinct set of tags appearing on any non-deleted article.
**Postcondition**: Returns `200` `{ tags: [...] }` — the distinct,
de-duplicated, alphabetically-sorted union of `tagList` across all live
articles. A tag drops out when its last carrying article is soft-deleted. Tags
are derived from the article aggregate, not a separate store. With no tagged
live articles, `tags === []`.
**Error Cases**:
- None — the endpoint always succeeds.
**Acceptance Criteria**:
- AC-008.1: `GET /api/tags` (no auth) ⇒ `200` with a `tags` array.
- AC-008.2: A tag present on two live articles appears exactly once in `tags`.
- AC-008.3: `tags` is sorted in ascending alphabetical order.
- AC-008.4: A tag appearing only on a soft-deleted article is absent from `tags`.
