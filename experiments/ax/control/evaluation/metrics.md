# Objective Metrics — control

*Generated: 2026-03-13T15:34:11.525Z*

## Source

| Item | Value |
|---|---|
| Response files collected | 7 |
| Estimated LoC (non-blank, non-comment) | 4070 |

## Testing

| Metric | Value |
|---|---|
| `describe` blocks | 44 |
| `it`/`test` calls | 141 |
| Coverage % | *run `npx jest --coverage` in output/ to measure* |

## Layer Discipline

| Metric | Value |
|---|---|
| Layer violations (prisma. in route files) | 0 |


## Error Format Compliance

| Metric | Value |
|---|---|
| Error response sites sampled | 20 |
| Conforming to `{"errors": {"body": [...]}}` | 16 / 20 |

## GS Artifact Presence

| Artifact | Present |
|---|---|
| CLAUDE.md | ❌ |
| Commit hooks | ❌ |
| ADRs | ❌ |
| Status.md | ❌ |
| Prisma schema (pre-defined) | ❌ |
| Conventional commits detected in session | 0 |

## Naming Signal

*Score manually: pick 10 random function/variable names from output code and assess whether each uses a domain term (User, Article, Comment, Profile, Tag, slug, feed, favorite, follow). Score = domain terms / 10.*

| Manual sample score | *fill after review* |
|---|---|

---

## Real Test Coverage (from Jest + PostgreSQL)

*Measured: 2026-03-13T16:06:57.590Z*

| Metric | Value |
|---|---|
| Test files run | 14 |
| Tests passed | 52 |
| Tests failed | 134 |
| Statement coverage | 34.11% |
| Branch coverage   | 37.5% |
| Function coverage | 32.05% |
| Line coverage     | 34.12% |
| Coverage gate (80% lines) | ❌ Fail |
