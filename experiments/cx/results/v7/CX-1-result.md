---
nav_exclude: true
---

# CX-1 Result — v7

**Verdict:** PASS
**Files changed:** `src/routes/articles.test.ts`
**tsc:** clean
**Tests:** 146/146 passing
**Notes:** The bug described (missing `updatedAt` in list responses) does not exist in v7. The `toListItem()` helper spreads `...rest` (all Article fields except `body`), and both the `Article` domain type and `InMemoryArticleRepository.create()` include `updatedAt`. The single-article and list-article responses both include `updatedAt` via the same field spread. The only gap was a missing explicit test assertion. Added `expect(article).toHaveProperty('updatedAt')` and `expect(article).toHaveProperty('createdAt')` to the GET /api/articles shape test to make the contract explicit and regression-proof.
