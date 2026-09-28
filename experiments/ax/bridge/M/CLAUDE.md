# Conduit API — navigation

Flat Express + Prisma app. All request handling lives in `src/routes/*.ts`, one file per resource;
each file holds the full logic for its endpoints (validation, Prisma DB access, and response/DTO
shaping, inline in the handlers).

- `src/routes/articles.ts` — articles, favorites, feed; also article response building, which includes
  the slug and the `favorited` / author `following` flags (search this file for the response builder).
- `src/routes/users.ts` — register, login, current user, update user.
- `src/routes/profiles.ts` — profiles, follow / unfollow.
- `src/routes/comments.ts` — comments.
- `src/routes/tags.ts` — tag list.
- `src/middleware/auth.ts` — authentication middleware (verifies the request token).
- `src/utils/jwt.ts` — JWT sign / verify.
- `src/utils/slug.ts` — slug string generation.
- `prisma/schema.prisma` — data model (Article.slug is unique).
