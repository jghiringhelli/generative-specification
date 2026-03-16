# Objective Metrics — treatment

*Generated: 2026-03-13T15:34:11.544Z*

## Source

| Item | Value |
|---|---|
| Response files collected | 6 |
| Estimated LoC (non-blank, non-comment) | 4597 |

## Testing

| Metric | Value |
|---|---|
| `describe` blocks | 50 |
| `it`/`test` calls | 143 |
| Coverage % | *run `npx jest --coverage` in output/ to measure* |

## Layer Discipline

| Metric | Value |
|---|---|
| Layer violations (prisma. in route files) | 0 |


## Error Format Compliance

| Metric | Value |
|---|---|
| Error response sites sampled | 1 |
| Conforming to `{"errors": {"body": [...]}}` | 0 / 1 |

## GS Artifact Presence

| Artifact | Present |
|---|---|
| CLAUDE.md | ✅ |
| Commit hooks | ✅ |
| ADRs | ✅ (4 files) |
| Status.md | ✅ |
| Prisma schema (pre-defined) | ✅ |
| Conventional commits detected in session | 0 |

## Naming Signal

*Score manually: pick 10 random function/variable names from output code and assess whether each uses a domain term (User, Article, Comment, Profile, Tag, slug, feed, favorite, follow). Score = domain terms / 10.*

| Manual sample score | *fill after review* |
|---|---|

---

## Real Test Coverage (from Jest + PostgreSQL)

*Measured: 2026-03-13T16:06:13.241Z*

| Metric | Value |
|---|---|
| Test files run | 10 |
| Tests passed | 33 |
| Tests failed | 0 |
| Statement coverage | 27.85% |
| Branch coverage   | 38.63% |
| Function coverage | 27.77% |
| Line coverage     | 27.63% |
| Coverage gate (80% lines) | ❌ Fail |
