# CX-5 Result — v7

**Verdict:** PASS
**Files changed:** `src/routes/articles.ts`, `src/routes/articles.test.ts`
**tsc:** clean
**Tests:** 147/147 passing (146 original + 1 new)
**Notes:** `CreateArticleSchema` for `POST /api/articles` only had `z.string().min(1, "can't be blank")` on `title`, with no upper bound. Added `.max(255, 'is too long (maximum 255 characters)')` to the Zod schema. The existing `zodToValidationError` utility correctly maps Zod issues to the Conduit error envelope `{ "errors": { "title": ["is too long (maximum 255 characters)"] } }`, so no changes were needed in the error handling layer. Added a new test asserting that a 256-character title returns HTTP 422 with the expected field error.
