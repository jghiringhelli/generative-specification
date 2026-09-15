# Hardening & Integration Summary

Final pass covering the full Conduit backend (Prompt 6).

## Endpoints implemented

| Area | Endpoints |
|---|---|
| Auth | `POST /api/users`, `POST /api/users/login`, `GET /api/user`, `PUT /api/user` |
| Profiles | `GET /api/profiles/:username`, `POST` / `DELETE /api/profiles/:username/follow` |
| Articles | `GET /api/articles`, `GET /api/articles/feed`, `GET /api/articles/:slug`, `POST /api/articles`, `PUT /api/articles/:slug`, `DELETE /api/articles/:slug`, `POST` / `DELETE /api/articles/:slug/favorite` |
| Comments | `GET /api/articles/:slug/comments`, `POST /api/articles/:slug/comments`, `DELETE /api/articles/:slug/comments/:id` |
| Tags | `GET /api/tags` |

## Layer discipline

- Every route handler delegates to a service. No repository or Prisma call appears
  in a route handler. Routes only: read the request, call a service, shape the response.
- Services depend only on repository port interfaces (`I*Repository`), never on Prisma
  directly. Prisma lives in the `Prisma*Repository` driven adapters.
- The composition root (`src/config/container.ts`) wires concrete adapters to services.
- No layer violations were found during the pass (the architecture was built
  ports-and-adapters first, so none were introduced).

## Error format

All error responses conform to the Conduit contract:

```json
{ "errors": { "body": ["message"] } }
```

Mapping is centralized in `src/middleware/errorHandler.ts`:

| Error | Status |
|---|---|
| `ValidationError` | 422 (field-prefixed messages) |
| `UnauthorizedError` | 401 |
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| `ConflictError` | 409 |
| unknown | 500 |

## Test coverage

Tests are colocated under `tests/` (unit + integration), backed by in-memory
repository fakes so the suite runs without a live database.

- Unit suites: `AuthService`, `ProfileService`, `ArticleService`, `CommentService`,
  `TagService`, `errorHandler`, `AppError`, `validation`.
- Integration suites: `auth`, `profiles`, `articles`, `comments`, `tags`, `errors`.
- Approximately 95+ test cases covering happy paths and the 401 / 403 / 404 / 422
  error paths for each feature.

> Note: this build is generation-only; the suite, coverage report, and mutation gate
> are wired (jest 80% thresholds, Stryker break at 65% MSI) but were not executed in
> this pass. Run `npm test`, `npm run test:coverage`, and `npm run mutation` to produce
> the concrete numbers.
