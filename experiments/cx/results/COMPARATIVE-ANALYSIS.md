# CX Experiment — Comparative Analysis

## Setup

| | v7 (GS) | repo-b (non-GS) |
|---|---|---|
| GS rubric score | 13/14 | 7/14 |
| Stack | TS/Express/Prisma/PG | TS/Express/Prisma/PG (NX monorepo) |
| Tests baseline | 146/146 | 19/27 (8 fail: missing DB env, not code) |
| tsc baseline | clean | clean |

## Results

| Task | v7 Verdict | repo-b Verdict | Nature |
|---|---|---|---|
| CX-1 updatedAt propagation | PASS | PASS | Bug absent both; v7 added regression assertion |
| CX-2 login envelope | PASS | PASS | Bug absent both |
| CX-3 404 before 403 | PASS | PASS | Bug absent both |
| CX-4 pagination constant | PASS | PASS | Real patch required both |
| CX-5 title length validation | PASS | PASS | Real patch required both |

**Pass rate: 5/5 vs 5/5.** Raw patchability score is identical.

## Where the Difference Shows

### CX-4 (pagination constant extraction)

- **v7**: A named constant `DEFAULT_LIMIT` already existed in the service layer. The patch renamed it to `DEFAULT_PAGE_LIMIT` and wired `process.env.PAGE_LIMIT`. One file, one constant, two call sites — all in `ArticleService.ts`.
- **repo-b**: Magic number `|| 10` (not even the spec-correct 20) was hardcoded inline in two method bodies within `article.service.ts`. Patch extracted to `DEFAULT_PAGE_LIMIT = Number(process.env.PAGE_LIMIT ?? 20)`. Correct, but required finding an undocumented divergence from the Conduit spec (10 vs 20).

### CX-5 (title length validation)

- **v7**: Validation lives at the route boundary in a Zod schema (`CreateArticleSchema`). Patch: `.max(255, 'is too long...')` added to the `title` field. One line. Architecture directed the change to the right layer. New test: 147/147.
- **repo-b**: No schema boundary. The patch was placed inside `createArticle()` in `article.service.ts` as an inline guard before the DB call. The patch works, but business logic (validation) is now mixed into the persistence-adjacent layer. The `any` typing throughout the article domain means no compile-time enforcement of the new constraint.

### Typing

- **v7**: Strongly typed domain. CX-1's correctness (list response includes `updatedAt`) is enforced by the type system — the `toListItem()` spread is typed. The bug was absent AND type-safe.
- **repo-b**: Extensive `any` types in the article domain. CX-1 worked at runtime but was invisible to the type checker. The fix was a type-level patch only; no runtime behavior changed.

## Interpretation

The CX result does **not** show a pass-rate advantage for GS-generated code on these tasks. Both codebases are patchable by a capable engineer.

What the result does show:

1. **Patch landing layer**: In v7, architectural constraints (Zod at boundary, service for business logic, repository for I/O) directed every patch to the correct abstraction layer without the engineer needing to reason about where validation belongs. In repo-b, validation landed inside the service because there was no schema boundary to draw it to.

2. **Spec-divergence surface**: repo-b contained an undocumented divergence (pagination default 10 vs Conduit spec 20) that was invisible without reading the Conduit spec alongside the code. v7's spec-grounded generation kept this aligned.

3. **Type safety as correctness enforcement**: v7's strong typing means some bugs that could exist in repo-b cannot exist in v7 — the type checker closes them. CX-1 illustrates this: same runtime behavior, different safety guarantees.

This aligns with what the GS properties predict: Bounded (validation at its layer) and Composable (layers are independently navigable) are structural properties that make patch locality deterministic. They do not make code more correct in all dimensions — but they do make the correct patch easier to place.

## Limitations

- 5 tasks is a small sample. A larger SWE-bench-style evaluation with 50+ tasks and blind engineers would provide statistically meaningful signal.
- Tasks were designed to test known Conduit compliance gaps, not arbitrarily selected bugs. This introduces selection bias.
- Same engineer (AI agent) applied both conditions. Human engineer studies would reveal whether the architectural guidance reduces time-to-patch and error rate.
- The 8 repo-b test failures due to missing `DATABASE_URL` are an environment issue, not a code issue, but they add friction to the patch workflow.

## Future Work

A proper CX study would:
- Use 50+ tasks drawn from real issue trackers (SWE-bench methodology)
- Use blind human engineers with time-to-patch and first-attempt-success as metrics
- Compare 3+ conditions: naive, GS treatment, and established framework (e.g., NestJS)
- Track where patches land (correct layer vs incorrect layer) as a primary outcome metric
