# Spec Decision Record — Tags

> Feature spec for the tag vertical slice. Derives from `docs/PRD.md` (tags) and
> reuses the ports & adapters decision of `docs/adrs/ADR-0002-auth.md`. Conforms
> to the RealWorld Conduit API tag contract.

## Endpoints

| Method | Path | Auth | Success |
| --- | --- | --- | --- |
| GET | `/api/tags` | none | `200` |

Response envelope: `{ "tags": ["angularjs", "dragons", ...] }`.

## Behaviour

- Returns the **distinct tags appearing on any non-deleted article**. The list
  is **de-duplicated** (a tag shared by several articles appears once) and
  **sorted alphabetically** for a deterministic, testable response.
- **No authentication** — the tag vocabulary is global, not viewer-relative.
- With no articles (or none carrying tags) the endpoint returns `{ "tags": [] }`.
- **Soft-delete coherence:** because tags are derived from *live* articles, a
  tag whose only article has been soft-deleted (`deletedAt`) drops out of the
  result — it no longer "appears on any article". A tag still carried by another
  live article survives.

## Design decision — derive from the article aggregate (no tag store)

Tags are a value list owned by the Article aggregate (`Article.tagList`); they
have no independent lifecycle. The vocabulary is therefore **derived** from live
articles via a new read method on the existing article port —
`IArticleRepository.listTags()` — implemented by both `InMemoryArticleRepository`
(distinct union over non-deleted articles) and `PrismaArticleRepository`
(`findMany({ where: { deletedAt: null }, select: { tagList } })` distinct-ed in
memory). `ArticleService.listTags()` exposes it; a thin `TagController` /
`tagRoutes` slice presents `{ tags }`.

This **replaces** the scaffolded `ITagRepository` port, which modelled a separate
tag store with a `listAll()` / `ensure()` registration surface (register tags on
article create/update). That model was removed because:

1. It **contradicts the requirement** "tags that appear on any article" — a
   registered tag would linger after its last article is (soft-)deleted, and a
   tag removed by an article update would never be retired.
2. It would require an in-memory tag store kept in sync with the article store,
   plus coupling `ArticleService` to a second port — more surface, more drift,
   for a strictly derivable read.

No new ADR: this reuses the ADR-0002 ports & adapters layering and introduces no
new architectural axis. No schema change: `tagList` already exists on `Article`
(`docs/architecture/data-model.md`), so the ERD is unaffected.

## Verification

`tsc --noEmit` (0) · `eslint` (0) · `npm audit --audit-level=high` (0 high) ·
`jest --coverage` (tag unit + subcutaneous endpoint tests green; ≥80%/80% gate
met) · `tsc` build emits. Tests run over the in-memory fake (no Postgres in this
environment); the Prisma adapter is covered by the gated real-DB suite.
