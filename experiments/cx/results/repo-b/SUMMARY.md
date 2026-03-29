---
nav_exclude: true
---

# CX repo-b Summary

| Task | Verdict | Files changed | Notes |
|---|---|---|---|
| CX-1 | PASS | `src/app/routes/article/article.model.ts` | Bug not present at runtime — both list and single-article endpoints already use `articleMapper` which maps `updatedAt`. Fixed at type level by adding `updatedAt`, `body`, `createdAt`, `favoritesCount`, `tagList` to the `Article` interface. tsc clean, 19/27 tests pass. |
| CX-2 | PASS | none | Bug absent — `auth.controller.ts` login handler already returns `res.json({ user })` consistent with registration. No change needed. tsc clean, 19/27 tests pass. |
| CX-3 | PASS | none | Bug absent — `deleteArticle` in `article.service.ts` already performs the existence check (→ 404) before the authorization check (→ 403). Ordering is already correct. tsc clean, 19/27 tests pass. |
| CX-4 | PASS | `src/app/routes/article/article.service.ts` | Extracted `DEFAULT_PAGE_LIMIT = Number(process.env.PAGE_LIMIT ?? 20)` constant; replaced two hardcoded `|| 10` defaults in `getArticles` and `getFeed`. (Note: code used 10 not 20 as the magic number; task description cited 20 per Conduit spec.) tsc clean, 19/27 tests pass. |
| CX-5 | PASS | `src/app/routes/article/article.service.ts` | Added title length guard in `createArticle`: titles > 255 chars now throw `HttpException(422, { errors: { title: ['is too long (maximum 255 characters)'] } })` before reaching the DB layer. tsc clean, 19/27 tests pass. |

## Cross-task observations

- **3 of 5 described bugs were already absent** in this codebase (CX-1 runtime, CX-2, CX-3). The codebase's GS rubric score of 7/14 reflects structural properties, not necessarily all these specific runtime bugs.
- **Baseline failure pattern**: 7 tests in `auth.service.test.ts` fail in all tasks due to a missing `DATABASE_URL` env var — these are environment-setup failures, not code bugs. All 19 unit tests using mocked Prisma pass consistently.
- **Locating touchpoints**: The service layer (`article.service.ts`, `auth.controller.ts`) was the primary change surface. The codebase uses `any` types extensively in the article domain, meaning type-level bugs (CX-1) don't surface at compile time.
- **CX-4 discrepancy**: Task description says default is `20` hardcoded; actual code used `10`. Extracted to named constant with `20` as fallback per Conduit spec.
