# Experiment Data — All Numbers

*Pre-formatted for citation in the white paper. All values are measured, not estimated,
unless explicitly marked as HALLUCINATED or PENDING.*

---

## §A GS Property Scores (Blind Adversarial Audit)

| Property | Naive | Control | Treatment | Treatment-v2 | Notes |
|---|---|---|---|---|---|
| Self-Describing (0–2) | **0** | 2 | 2 | **2** | Naive: no README, no architecture docs. Ceiling in all structured conditions |
| Bounded (0–2) | **2** | 2 | 2 | **2** | Ceiling in all four conditions |
| Verifiable (0–2) | **2*** | 2 | 2 | **2** | *Auditor scored test structure/names only |
| Defended (0–2) | **0** | 0 | 0 | **2** | T-v2: hooks + ci.yml emitted in P1; prior conditions: referenced only |
| Auditable (0–2) | **0** | 1 | 1 | **2** | T-v2: CHANGELOG + commitlint emitted; prior: partially referenced |
| Composable (0–2) | **1** | 1 | 2 | **2** | T-v2: IRepository interfaces emitted in P1; treatment already at 2 |
| **Total (0–12)** | **5** | **8** | **9** | **12** | Monotonic: Naive < Control < Treatment < Treatment-v2 |

*Audit method: separate Claude session, blind to experiment and GS methodology.
Rubric in `experiments/treatment/evaluation/scores.md`.*

---

## §B Execution Timing

| Prompt | Naive (s) | Control (s) | Treatment (s) | Treatment-v2 (s) |
|---|---|---|---|---|
| 01 auth | 57.9 | 131.7 | 158.8 | 216.1 |
| 02 profiles | 77.9 | 67.3 | 112.1 | 99.6 |
| 03 articles | 67.7 | 145.1 | 193.0 | 197.5 |
| 04 comments | 37.8 | 85.8 | 126.0 | 120.5 |
| 05 tags | 21.5 | 58.8 | 64.3 | 68.9 |
| 06 complete/integration | 130.1 | 114.5 | 111.4 | 133.1 |
| 07 tests (control only) | — | 143.8 | — | — |
| **Total (excl. context ack)** | **393.0s** | **747.0s** | **765.6s** | **835.7s** |
| **Avg/prompt** | **65.5s** | **106.7s** | **127.6s** | **139.3s** |
| Context ack | 40.5s | 24.1s | 34.3s | 41.5s |

*Naive was 47% faster/prompt than control. Less prompting → less output → less generation time. However, shorter output correlated with an incomplete, non-compilable project.*

---

## §C Code Volume

| Metric | Naive | Control | Treatment |
|---|---|---|---|
| `it`/`test` call count | **57** | 141 | 143 |
| `describe` blocks | — | 44 | 50 |
| Layer violations (prisma.* in routes) | **0** | 0 | 0 |
| Estimated LoC (non-blank, non-comment) | **2,575** | 4,070 | 4,597 (+13%) |
| Response files generated | 6 | 7 | 6 |
| Has CLAUDE.md | ❌ | ❌ | ✅ |
| Has commit hooks | ❌ | ❌ | ✅ (as prose, not files) |
| ADR count | 0 | 0 | 4 (referenced, not emitted) |
| Has Prisma schema in P1 | ❌ | ❌ | ✅ |
| Test framework in package.json | ❌ | ✅ | ✅ |

*Naive LoC is 37% lower than control and 44% lower than treatment.*

---

## §D Real Test Coverage (Jest + PostgreSQL)

| Metric | Naive | Control | Treatment | Treatment-v2 |
|---|---|---|---|---|
| Lines % | **0%** | **34.12%** | **27.63%** | —† |
| Statements % | **0%** | 34.11% | 27.85% | —† |
| Functions % | **0%** | 32.05% | 27.77% | —† |
| Branches % | **0%** | 37.50% | 38.63% | —† |
| Tests passing | **0 / 0** | 52 / 186 (28%) | 33 / 33 (100%) | 2 / 2 (100%) |
| Test suites passing | **0 / 6** | 5 / 14 (36%) | 4 / 10 (40%) | 1 / 9 (11%) |
| Coverage gate (80%) | ❌ FAIL | ❌ FAIL | ❌ FAIL | ❌ FAIL |
| AI-reported coverage (hallucinated) | — | 94.52% (HALLUCINATED) | 93.1% (HALLUCINATED) | 87% (HALLUCINATED) |

† Coverage not measurable: 8/9 test suites fail on TypeScript import errors for
unmaterialized files (`testDb`, error classes, `auth.middleware`). The 1 passing
suite (TagService, 2 tests) has no coverage reporter output.

*Naive failure mode: ALL suites fail with TS2339 compilation errors — Prisma models for Article/Comment/Tag/Favorite are absent from schema. Model described these models in non-annotated prose blocks; materializer could not extract them. Tests reference models that do not exist.*
*Control failure mode: TS error in `articleService.ts:159` + missing `/api/articles/feed` route*
*Treatment failure mode: `JWT_SECRET: string | undefined` not narrowed — blocked 6/10 suites*
*Both structured models stated 90%+ coverage in documentation. Real coverage: 27–34%.*

---

## §E Mutation Testing (Treatment Project Only)

*Scope: `src/services/**/*.ts`. Tool: Stryker + jest-runner + typescript-checker.*
*Post-experiment quality check. Not part of original experiment design.*

| Run | Tests | MSI | Killed | Survived | NoCoverage |
|---|---|---|---|---|---|
| Baseline (original generated tests) | 33 | **58.62%** | 48 | 23 | 25 |
| After Round 1 (coverage gaps filled) | 63 | **68.97%** | 68 | 32 | 4 |
| After Round 2 (assertion quality fixed) | 73 | **93.10%** | 99 | 8 | 0 |

| File | Final MSI | Survived |
|---|---|---|
| `auth.service.ts` | 100% | 0 |
| `comment.service.ts` | 100% | 0 |
| `profile.service.ts` | 90% | 1 |
| `article.service.ts` | 88.52% | 7 |
| `tag.service.ts` | n/a | 0 |

*The 93.1% coincidence: treatment AI hallucinated "93.1% coverage" in its docs.
Real line coverage was 27.63%. After mutation-driven test improvement, real MSI = 93.10%.
The number was right; it described the wrong thing.*

---

## §F Prediction Accuracy

| Prediction | Direction | Confirmed? |
|---|---|---|
| Verifiable ≈ control | T ≈ C | ✅ Confirmed |
| Composable: T > C | T ≥ +0.5 | ✅ Confirmed |
| LoC similar (≤ 15% delta) | ≤ 15% | ✅ Confirmed (13%) |
| Self-Describing: T > C | T ≥ +1 | ❌ Ceiling effect (both 2/2) |
| Bounded: T > C | T ≥ +0.5 | ❌ Ceiling effect (both 2/2) |
| Defended: T >> C | T = +2 | ❌ Floor effect (both 0/2) |
| Auditable: T >> C | T = +2 | ❌ Partial only (both 1/2) |
| Coverage: T ≥ C | T ≥ C | ❌ C > T (TS error in treatment) |
| Timing: T faster per prompt | T < C | ❌ T was 18.6% slower |

*3/9 predictions confirmed. 4 failures due to ceiling/floor effects from Amendment A control enhancement.*

---

## §G Commits and Run Identifiers

| Artifact | Value |
|---|---|
| Pre-registration commit | `bd2c05b` |
| Control amendment commit | `7661e62` |
| Control run session ID | `650a9f59-5a21-4eda-829a-ca46c5fa83be` |
| Treatment run session ID | `eb7ae491-33fa-4b4c-8b78-e75201ebf46f` |
| Naive run session ID | `236a3efd-94ba-45af-b399-bca79f4b1e2e` |
| **Treatment-v2 run session ID** | **`c55b63f6-b84a-40be-bfc9-87eae107d52c`** |
| Mutation gate added commit | `482a111` |
| Mutation testing done commit | `433ed1d` |
| GS template improvements commit | `7dc4d58` |
| **Treatment-v2 condition added commit** | **`6c24f6d`** |
| Model | claude-sonnet-4-5 |
| Run date | March 13, 2026 |
| Benchmark | RealWorld Conduit API |
