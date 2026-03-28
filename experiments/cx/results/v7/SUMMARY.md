# CX v7 Summary

| Task | Verdict | Files changed | Notes |
|---|---|---|---|
| CX-1 | PASS | `src/routes/articles.test.ts` | Bug absent in v7. `toListItem()` already spreads `...rest` (all Article fields except `body`), so `updatedAt` is present in list responses. Added explicit `expect(article).toHaveProperty('updatedAt')` assertion to prevent regression. |
| CX-2 | PASS | none | Bug absent in v7. Login handler already returns `res.status(200).json({ user: response })`, consistent with registration. Existing test already verifies `res.body.user.email`. |
| CX-3 | PASS | none | Bug absent in v7. `ArticleService.deleteArticle()` correctly checks existence (`NotFoundError`) before authorization (`ForbiddenError`). Existing test already asserts DELETE of nonexistent slug returns 404. |
| CX-4 | PASS | `src/services/ArticleService.ts` | Renamed `DEFAULT_LIMIT` → `DEFAULT_PAGE_LIMIT`, initialized from `parseInt(process.env.PAGE_LIMIT ?? '20', 10)`. Both `listArticles()` and `getFeed()` updated. Default behavior (20) unchanged. |
| CX-5 | PASS | `src/routes/articles.ts`, `src/routes/articles.test.ts` | Added `.max(255, 'is too long (maximum 255 characters)')` to `title` in `CreateArticleSchema`. Added new test for 256-char title → 422 with correct error envelope. 147 tests pass. |

## Observations

- **3 of 5 bugs (CX-1, CX-2, CX-3) were not present in v7.** The v7 generated codebase had already implemented correct behavior for list field propagation, response envelope consistency, and delete authorization ordering.
- **CX-4** required a straightforward extraction of a local constant to an env-configurable value (`process.env.PAGE_LIMIT`).
- **CX-5** required adding a single Zod constraint (`.max(255)`) at the schema boundary — a one-line change enabled by the codebase's clean Zod-at-the-boundary pattern.
- v7 demonstrates high baseline patchability: clear layer separation (Zod schemas at route boundary, service layer for business logic, repository for I/O) made all necessary touch points immediately findable.
