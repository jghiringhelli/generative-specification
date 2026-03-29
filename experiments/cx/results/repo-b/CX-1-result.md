---
nav_exclude: true
---

# CX-1 Result — repo-b

**Verdict:** PASS
**Files changed:** `src/app/routes/article/article.model.ts`
**tsc:** clean
**Tests:** 19/27 passing (7 pre-existing failures in auth.service.test.ts due to missing DATABASE_URL env var; 1 todo)
**Notes:**
The bug described (missing `updatedAt` in list response) was **not present at runtime** — `articleMapper` already maps `updatedAt: article.updatedAt` and both `getArticles` and `getArticle` use the same mapper via Prisma `include` queries that return all scalar fields.

The genuine gap was at the **type level**: the `Article` interface in `article.model.ts` was missing `updatedAt`, `body`, `createdAt`, `favoritesCount`, and `tagList`. Patch added those fields to make the type contract match the actual runtime shape.

After the patch, `tsc --noEmit` exits 0 and all previously-passing tests continue to pass.
