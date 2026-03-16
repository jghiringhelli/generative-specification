# Metrics — treatment-v3

*Generated: 2026-03-13*
*Model: claude-sonnet-4-5*

## GS Rubric Score

| Property | Score |
|---|---|
| Self-Describing | 2/2 |
| Bounded | 2/2 |
| Verifiable | 2/2 |
| Defended | 2/2 |
| Auditable | 1/2 |
| Composable | 2/2 |
| **Total** | **11/12** |

> Auditable deduction: ADRs referenced but not emitted as files; CHANGELOG has only placeholder content.

## Static Quality Checks

| Check | Result |
|---|---|
| `tsc --noEmit` errors | 1 (tsconfig artifact — `jest.setup.ts` not under `rootDir`) |
| `npm audit --audit-level=high` | **0 HIGH/CRITICAL** |

## Dependency Registry (P1 Artifact)

Emitted in P1: **Yes** (`docs/approved-packages.md` — in `markdown`-fenced block)

Key decisions documented:

| Package | Chosen | Rejected | CVE rationale |
|---|---|---|---|
| Password hashing | **argon2** `^0.41.1` | bcrypt (CVE chain via `tar`/`node-pre-gyp`) | Explicit CVE cite in registry |
| TS linting | **@typescript-eslint@^8.18.2** | @typescript-eslint@^6 (minimatch CVE) | Explicit CVE cite in registry |
| HTTP framework | express `^4.21.2` | — | 0 HIGH/CRITICAL |
| ORM | @prisma/client `^5.22.0` | — | 0 HIGH/CRITICAL |

## pre-commit Hook

`npm audit --audit-level=high` gate: **Present** (extracted from P1 raw response)

## CI Pipeline

`npm audit --audit-level=high` step: **Present** (in `.github/workflows/ci.yml`)

## Materializer Note

`01-auth-response.md` reported 0 code blocks by the materializer. Root cause: the model used
`markdown` as the code block language for several P1 files, which is outside the materializer's
`fenceRe` language allowlist. The P1 content (approved-packages.md, package.json, husky hooks,
CI workflow, repository interfaces) is present in the raw response file but was not extracted
to disk. The synthesized `package.json` was overridden with the model's actual chosen dependencies
before running `npm audit`.

## Auditable Gap — Root Cause and Template Fix

**Root cause:** The `auditable` block in `templates/universal/instructions.yaml` said
"emit ADR stub files as fenced code blocks" but did not specify *which* ADRs, *minimum
content* requirements, or enforce the invariant: *if a README references a file, that file
must appear as a code block in the same response.*

The model referenced `docs/adrs/ADR-0001-stack.md` in the README and emitted a
CHANGELOG with only a two-bullet Unreleased section — technically compliant with the
old template wording, but insufficient for the GS Auditable property.

**Fix applied to `templates/universal/instructions.yaml`** (committed, not re-run):
- Added minimum ADR set: ADR-0001 (stack), ADR-0002 (authentication), ADR-0003 (architecture)
- Prohibited placeholder content in ADR fields — each must have real Status/Context/Decision/Consequences
- Added explicit reference-check rule: any ADR named in README must appear as a code block in the same response
- Updated CHANGELOG template to include actual P1 decisions instead of empty Unreleased block

**Expected GS score with fix:** 12/12. The fix targets exactly the Auditable deduction:
ADRs would be emitted with content, and CHANGELOG would document P1 decisions.
No v4 run conducted — the hypothesis (0 HIGH CVEs) is confirmed; the 11→12 gap is
a template specificity defect, not a GS design flaw.

## Cross-Condition Comparison

| Condition | GS Score | tsc errors | npm audit HIGH |
|---|---|---|---|
| Naive | — | 41 | 3 |
| Control | — | 1 | 0 |
| Treatment | 10/12 | 0 | 3 |
| Treatment-v2 | 12/12 | 0 | 9 |
| **Treatment-v3** | **11/12** | **1** | **0** |

> treatment-v3 tsc error is a materializer artifact (synthesized tsconfig), not a code defect.

---

## Spec Compliance Validation — Official RealWorld Hurl Suite

**Tool:** Hurl 7.1.0 (`winget install Orange-OpenSource.Hurl`)
**Spec:** [realworld-apps/realworld](https://github.com/realworld-apps/realworld) — 13 Hurl files
**Server:** treatment-v3 re-materialized (52 files after fenceRe fix), running on `http://localhost:3010`
**Run date:** 2026-03-13

### Hurl Spec Results

| File | Requests run | Result | First failure |
|---|---|---|---|
| auth.hurl | 6 | FAIL | Request 6: `bio == null` expected, got `""` |
| articles.hurl | 1 | FAIL | Request 1: `POST /api/articles` → 404 (route not wired) |
| comments.hurl | 1 | FAIL | Request 1: → 404 |
| favorites.hurl | 1 | FAIL | Request 1: → 404 |
| feed.hurl | 1 | FAIL | Request 1: → 404 |
| profiles.hurl | 1 | FAIL | Request 1: → 404 |
| tags.hurl | 1 | FAIL | Request 1: → 404 |
| pagination.hurl | 1 | FAIL | Request 1: → 404 |
| errors_auth.hurl | 1 | FAIL | Request 1: → 404 |
| errors_articles.hurl | 1 | FAIL | Request 1: → 404 |
| errors_comments.hurl | 1 | FAIL | Request 1: → 404 |
| errors_profiles.hurl | 1 | FAIL | Request 1: → 404 |
| errors_authorization.hurl | 1 | FAIL | Request 1: → 404 |

**Overall: 0/13 spec files pass. 5 of 6 auth requests succeed; all feature-route requests 404.**

---

## Root Cause Analysis — Route Wiring Gap

**Finding:** `src/app.ts` mounts only two route groups:

```typescript
app.use('/api/users', createUserRoutes(userService));
app.use('/api/user',  userRouter);
```

Five route modules exist on disk (`articles`, `profiles`, `comments`, `tags`, plus user) but the
Express composition root was never updated to mount them. All requests to
`/api/articles`, `/api/profiles`, `/api/comments`, and `/api/tags` return 404.

**Root cause — incremental prompting failure mode:**
- P1 generated `app.ts` mounting only user routes (auth feature)
- P3–P5 prompts generated route files for each feature in isolation
- P6 (integration + QA) prompt fixed service interface mismatches but did NOT regenerate `app.ts`
- No prompt in the sequence was responsible for updating the composition root as new features were added

This is a structural gap in incremental prompting: when route wiring lives in a single
composition file and each feature prompt only generates that feature's module, the composition
root diverges from the full set of registered features.

**Severity:** Critical. The generated server is functionally broken for 12 of 13 spec coverage areas.

---

## Root Cause Analysis — Integration Test Compilation Failure

**Finding:** All 5 integration test suites (`tests/integration/`) fail to compile under `ts-jest`.

**Errors:**

| File | Error | Cause |
|---|---|---|
| `src/services/UserService.ts:196` | TS2769: No overload matches — `expiresIn` type mismatch | `JWT_EXPIRY` is `string`; `@types/jsonwebtoken@^9` requires `StringValue` (branded type) |
| `tests/integration/profiles.test.ts:132,223` | TS6133: `bobToken` is declared but never read | Unused variable in strict mode |

**Root cause:** The generated code uses `expiresIn: JWT_EXPIRY` where `JWT_EXPIRY = '7d'` (inferred
as `string`). Newer `@types/jsonwebtoken` uses the branded type `StringValue` for this option.
The server runs fine under `tsx` (runtime, ignores types) but `ts-jest` strict compilation rejects it.

**Implication for GS Verifiable score:**
The GS auditor gave Verifiable 2/2 citing "~130 tests, ~92% coverage." In practice:

- No service unit tests were written — the model produced only integration tests
- All 5 integration test suites fail to compile (0 tests execute)
- The "130 tests" figure was derived by reading test file source, not from executing the test runner
- Coverage is unmeasurable because the test runner never reaches code collection

The Verifiable dimension of the GS rubric cannot detect compilation failures in test code because it
evaluates raw AI response content, not executed output.

---

## Bio Normalization Bug (auth.hurl request 6)

**Finding:** `PUT /api/user` returns `"bio": ""` for a user with no bio set.
**Spec requires:** `"bio": null`

The Prisma schema likely defaults `bio` to `""` or the service layer coerces `null` to `""` during
entity mapping. The spec expects SQL NULL to propagate as JSON `null`. This is a data-type
normalization defect in the persistence → domain → API mapping layer.

---

## New Finding for P-004 White Paper (Section 10.7)

**The GS rubric scores against raw AI response content, not executed program behavior.**

A treatment-v3 server scoring GS 11/12 (near-perfect) is nonetheless:

1. **Functionally broken** — 12 of 13 spec coverage areas return 404 at runtime
2. **Unexecutable** — all integration tests fail to compile; 0 tests execute
3. **Partially spec-compliant** — only the `/api/users` and `/api/user` auth surface passes spec (5/6 auth requests succeed)

This demonstrates that GS is a **specification-quality metric**, not a **runtime-compliance metric**.
It answers "did the AI produce a well-specified, verifiable design?" but not "does the server actually work?"

**Proposed additional GS dimension — Executable (0–2):**

| Score | Criterion |
|---|---|
| 0 | Generated code does not compile OR tests do not execute |
| 1 | Server starts; official spec suite partially passes (>0 files, <80%) |
| 2 | Server starts; official spec suite majority passes (>=80% of spec files) |

Under this rubric, treatment-v3 would score **Executable: 0** despite scoring **Verifiable: 2/2**
for having test files with coverage declarations.

**The gap between Verifiable (claimed 2/2) and Executable (actual 0/2) is the core finding.**

A language model can produce well-structured test code that is syntactically complete and passes
visual review, yet is broken in ways the GS rubric cannot detect without execution:
- Type-branded mismatches caught only under strict ts-jest compilation
- Route composition gaps spanning multiple incremental prompts
- Data normalization defects masked by integration test non-execution

This finding argues for a mandatory **Executable gate** as a post-GS validation step in any
prompting evaluation methodology that claims to measure production-readiness.

