---
nav_exclude: true
---

# Prompt 1 — Derive the Complete Implementation (Mechanical Requirements)

You have the complete Conduit API specification in your context. Derive the entire
backend implementation from it in one pass — project setup, data model, and every
endpoint. Node.js + TypeScript.

The following behaviors are the ones that most often go wrong. Implement them **exactly
as specified** below.

1. **Slugs.** Implement `slugify(title: string): string`:
   - lowercase the title;
   - replace every run of non-alphanumeric characters with a single `-`;
   - strip leading and trailing `-`.
   On insert, query for an existing article whose slug equals the candidate; if one
   exists, append `-` followed by an incrementing integer (`-1`, `-2`, …) and re-check
   until no row matches. Store the resulting string in `Article.slug` (unique column).

2. **Passwords.** On register, compute `hash = bcrypt.hashSync(password, 10)` and store
   `hash` in `User.password`. On login, fetch the user by email and call
   `bcrypt.compareSync(candidate, user.password)`; if it returns `false`, respond `422`.
   Never select `password` into any response DTO.

3. **Tokens.** Sign with `jwt.sign({ id, username }, process.env.JWT_SECRET, { expiresIn:
   '30d' })`. In the auth middleware, read the `Authorization` header, split on a space,
   require the first part to equal `Token`, and pass the second part to
   `jwt.verify(token, process.env.JWT_SECRET)` inside a try/catch. On any thrown error
   (`TokenExpiredError`, `JsonWebTokenError`), respond `401` and do not call `next()`.

4. **The feed.** For `GET /api/articles/feed`, read the current user's `following` rows
   to get a list of followed author ids, then run
   `prisma.article.findMany({ where: { authorId: { in: followedIds } }, orderBy: {
   createdAt: 'desc' }, skip: offset, take: limit })`. Default `limit = 20`, `offset = 0`.

5. **Relational flags.** For each article DTO compute `favorited =
   currentUserId ? (favorite row exists for (currentUserId, articleId)) : false` and
   `author.following = currentUserId ? (follow row exists for (currentUserId,
   authorId)) : false`. When there is no authenticated user, both are `false`.

6. **List projections.** In the `GET /api/articles` and `GET /api/articles/feed`
   serializers, build the DTO without the `body` key. In the single-article serializer
   (`GET /api/articles/:slug`), include `body`.

Emit every file the running system needs. Do not stop at a subset.
