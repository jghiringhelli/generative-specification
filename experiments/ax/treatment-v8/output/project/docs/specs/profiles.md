# Spec Decision Record — User Profiles & Following

> Feature spec for the profile vertical slice. Derives from `docs/PRD.md`
> (profiles) and reuses the ports & adapters decision of
> `docs/adrs/ADR-0002-auth.md`. Conforms to the RealWorld Conduit API profile
> contract.

## Endpoints

| Method | Path | Auth | Success | Body in | Body out |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/profiles/:username` | optional | `200` | — | `{ profile: { username, bio, image, following } }` |
| POST | `/api/profiles/:username/follow` | required | `200` | — | `{ profile: {..} }` |
| DELETE | `/api/profiles/:username/follow` | required | `200` | — | `{ profile: {..} }` |

`Authorization: Token <jwt>` is the RealWorld scheme; `Bearer` is also accepted.

## Behaviour

- **`following`** reflects whether the *viewing* user follows the target. For an
  anonymous GET it is always `false`; for an authenticated viewer it is read from
  the follow graph. POST returns `following: true`, DELETE returns `false`.
- **Follow / unfollow are idempotent**: following an already-followed user (or
  unfollowing one you don't follow) succeeds with `200` and the expected flag —
  no duplicate edge, no error.
- **Optional auth on GET**: a missing, malformed, **or invalid/expired** token
  yields the anonymous (public) view rather than a `401`. The endpoint is public
  by contract; only the personalised `following` flag depends on identity. This
  matches the RealWorld reference's `auth.optional` semantics.
- **Self-follow** is not special-cased. The composite key makes it at most a
  single harmless edge; the contract defines no error for it, so none is added.

## Status code decisions (and the trade-offs)

Following the codebase's own error taxonomy (`src/errors/AppError.ts`) and the
precedent set in `docs/specs/auth.md`:

- **Unknown `:username` → `404 Not Found`** (`NotFoundError`, resource
  `Profile`). Applies to all three endpoints.
- **Follow / unfollow without a token → `401 Unauthorized`**, enforced at the
  router seam by the existing `authenticate` middleware (auth is never checked
  inside handlers — `.claude/standards/api.md`).
- **Success is `200`** for all three (GET/POST/DELETE), matching the RealWorld
  profile contract. POST follow is modelled as an idempotent state assertion
  ("ensure I follow X") rather than a fresh-resource `201`.

## Architecture (ports & adapters)

```
HTTP (profileRoutes/ProfileController)  →  ProfileService  →  ports
  · optionalAuthenticate (GET)                                ├─ IUserRepository    → Prisma / InMemory   (resolve username → user)
  · authenticate         (POST/DELETE)                        └─ IProfileRepository → PrismaProfileRepository (prod) / InMemoryProfileRepository (test+dev)
```

No new ADR is raised: this slice reuses ADR-0002's layering and injection
pattern unchanged. The only structural addition is the `Follow` edge in the data
model (see `docs/architecture/data-model.md`). `optionalAuthenticate` shares its
header parsing with `authenticate` via the extracted `readBearerToken` helper, so
the accepted schemes live in one place.

## Test strategy

- **Unit**: `ProfileService` (following true/false/anonymous, not-found on all
  three operations, follow/unfollow idempotency) and `InMemoryProfileRepository`
  (idempotent follow, no-op unfollow, directed edges, `listFollowedIds`).
- **Integration (subcutaneous)**: Supertest against the real Express app over the
  in-memory fakes — full HTTP → service → follow-graph path, including the
  optional-auth anonymous fallback on an invalid token and the `401`/`404` paths.
- **Integration (real DB)**: `PrismaProfileRepository` is verified by the gated
  real-database suite (`RUN_DB_TESTS=1`) and excluded from the unit-coverage
  denominator, exactly as `PrismaUserRepository` is.
- Coverage after this slice: 97.5% stmts / 85.7% branch (gate 80% / 70%).
