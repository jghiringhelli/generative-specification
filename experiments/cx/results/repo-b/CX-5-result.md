---
nav_exclude: true
---

# CX-5 Result — repo-b

**Verdict:** PASS
**Files changed:** `src/app/routes/article/article.service.ts`
**tsc:** clean
**Tests:** 19/27 passing (7 pre-existing failures in auth.service.test.ts due to missing DATABASE_URL env var; 1 todo)
**Notes:**
The `createArticle` service function had validation for blank title but no length constraint. A title longer than 255 characters would reach the Prisma/PostgreSQL layer and produce a database-level error rather than a clean HTTP 422.

Patch added a length check immediately after the blank check in `createArticle`:

```typescript
if (title.length > 255) {
  throw new HttpException(422, { errors: { title: ['is too long (maximum 255 characters)'] } });
}
```

The fix is in the service layer (same layer as all other validation in this codebase), consistent with existing error-handling patterns using `HttpException`. The error envelope `{ errors: { title: [...] } }` matches the Conduit API spec.

Gate passes: `tsc --noEmit` exits 0 and all previously-passing tests continue to pass.
