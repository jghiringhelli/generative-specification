# BX — Benchmark Cross-validation Experiment

**Date:** 2026-03-27
**Author:** GS Research (Ghiringhelli, 2026)
**Related experiments:** AX (adversarial AI study), RX (replication), DX (human developer study)
**Closes:** Layer 1 of the define/build/measure loop (rubric validity)
**Evidence:** `evidence/scores.json`

## Reproduction

To reproduce this experiment:

```bash
# Clone the two external implementations
git clone https://github.com/lujakob/nestjs-realworld-example-app experiments/bx/repo-a
git clone https://github.com/gothinkster/node-express-realworld-example-app experiments/bx/repo-b

# For each repo, run:
cd experiments/bx/repo-a && yarn install
tsc --noEmit
npx eslint . --ext .ts 2>&1 | wc -l
npm audit --audit-level=high
grep -r "it\|test\|describe" --include="*.spec.ts" | wc -l

# Apply the 7-property rubric in evidence/scores.json to each repo
# Compare rubric ranking with static analysis ranking
```

Repo C (GS-generated) is the RX output — see `experiments/rx/evidence/` for its verified artifacts.

---

## Purpose

The AX experiment established that AI implementations built *with* GS guidance score higher on the GS rubric than those built without it. A valid criticism is circularity: GS defines the rubric and GS guided the implementations. The rubric may simply reward GS vocabulary rather than objective quality.

The BX experiment closes this gap. It scores three RealWorld (Conduit) backend implementations against the 7-property GS rubric where **two of the three implementations were never exposed to GS methodology**. If the rubric ranks them in the same order as their community reputation and independent static analysis tools, the rubric has validity independent of GS guidance.

### Hypothesis

> The GS rubric will rank the three implementations in the order: GS-Generated > Official Reference > Community-Popular, congruent with objective static analysis (CVE count, TypeScript health, test count).

---

## Implementations

| ID | Label | Repository | Stack | Community Signal |
|---|---|---|---|---|
| **A** | Community High Quality | [lujakob/nestjs-realworld-example-app](https://github.com/lujakob/nestjs-realworld-example-app) | NestJS + TypeORM + MySQL | ~2k stars; cited as NestJS reference |
| **B** | Official Reference | [gothinkster/node-express-realworld-example-app](https://github.com/gothinkster/node-express-realworld-example-app) | Express + Prisma + NX | Official gothinkster benchmark |
| **C** | GS-Generated (RX Output) | `experiments/rx/` | Express + Prisma (GS-specified) | 104/104 tests passing; 0 CVEs |

**Important:** Repos A and B were never touched by GS methodology. They are scored blind against the rubric.

---

## GS Rubric Scores (14 points total, 7 properties × 2)

| Property | Repo A (NestJS) | Repo B (Official) | Repo C (GS) |
|---|---|---|---|
| 1. Self-Describing | 1 | 1 | 2 |
| 2. Bounded | **2** | 1 | 2 |
| 3. Verifiable | 0 | 1 | 2 |
| 4. Defended | 0 | 1 | 1 |
| 5. Auditable | 1 | 1 | 2 |
| 6. Composable | 1 | 1 | 2 |
| 7. Executable | 1 | 1 | 2 |
| **Total** | **6/14** | **7/14** | **13/14** |

*Note: Task prompt claimed 14/14 for Repo C based on white paper documentation. Evidence-based assessment yields 13/14 — Defended=1/2 because no CI pipeline was provisioned, consistent with AX experiment finding where both control and treatment scored 0 on Defended. Full explanation in per-property rationale below.*

---

## External Tool Results

| Metric | Repo A (NestJS) | Repo B (Official) | Repo C (GS) |
|---|---|---|---|
| `tsc --noEmit` errors | 4* / 0 after setup | **0** | **0** |
| ESLint violations | N/A (no config) | **33** errors | ~0 (per build log) |
| `npm audit` high CVEs | 43 | 24 | **0** |
| `npm audit` critical CVEs | **16** | 1 | **0** |
| `npm audit` total | **105** | 43 | **0** |
| Test files | 1 | 6 | 7 (suites) |
| `it()`/`test()` calls | 1 | 27 | **104 passing** |
| `describe()` blocks | 2 | 18 | N/A (counted as suites) |
| Install method | yarn (npm fails) | npm | npm |

*\* Repo A: 4 tsc errors from missing `config.ts` (requires `cp src/config.ts.example src/config.ts`). 0 errors after copying — this step is documented in README.*

---

## Per-Property Scoring Rationale

### Property 1: Self-Describing (0–2)
*2 = README + architecture doc/CLAUDE.md + ADRs + explicit layer descriptions; 1 = README only; 0 = none*

**Repo A — 1/2**
README present: installation steps, DB setup, Swagger API docs, NPM scripts. NestJS module structure implies layers but they are not documented. No architecture doc, no CLAUDE.md, no ADRs, no decision records.

**Repo B — 1/2**
README present with clear env var documentation, Prisma commands, and run commands. Dockerfile present. Feature structure visible in code but undocumented. No architecture doc, no ADRs, no decision records.

**Repo C — 2/2**
Per AX treatment evidence: CLAUDE.md, Status.md, and README emitted as GS artifacts. GS spec requires JSDoc on all public functions (enforced by lint gate). Layer boundary descriptions embedded in directory names (`src/api/`, `src/services/`, `src/domain/`, `src/ports/`, `src/adapters/`).

---

### Property 2: Bounded (0–2)
*2 = clear layer boundaries, no cross-layer imports, named modules; 1 = some structure, leaky boundaries; 0 = monolithic*

**Repo A — 2/2**
NestJS module system enforces explicit boundaries: each feature (`article/`, `user/`, `profile/`, `tag/`) owns its `.module.ts`, `.controller.ts`, `.service.ts`, and `.entity.ts`. NestJS DI prevents modules from reaching into each other's internals. The framework does the work, but the result is genuine boundary enforcement.

**Repo B — 1/2**
Feature routing subdirectories (`routes/{article,auth,profile,tag}/`) provide some separation. Models in separate files. However, services call `prisma-client` directly with no repository abstraction. No domain layer. Persistence concerns leak into the service layer. Boundaries are partial.

**Repo C — 2/2**
Per AX treatment: 0 layer violations. Strict ports-and-adapters architecture: `src/ports/` contains all interface contracts; `src/adapters/` contains implementations; `src/services/` depends on ports only. Composition root in `index.ts`. AX verification confirmed no cross-layer imports.

---

### Property 3: Verifiable (0–2)
*2 = substantial test suite, tests against interfaces, edge cases; 1 = thin or implementation-testing tests; 0 = no tests*

**Repo A — 0/2**
1 test file (`tag.controller.spec.ts`), 1 `it()` assertion. The test requires a live MySQL connection (no mocking) to run the NestJS testing module. Passes when database is available, fails otherwise. No coverage for business logic, no edge cases, no adversarial tests.

**Repo B — 1/2**
6 test files, 27 test cases, 18 describe blocks. Uses `jest-mock-extended` to mock Prisma. Service tests cover error conditions and success paths. Tests are against implementation (mock Prisma calls), not interface contracts. No integration tests. Reasonable but thin coverage.

**Repo C — 2/2**
RX evidence: 104 passing tests across 7 suites (0 failures). GS spec enforces 80% line coverage as a Jest gate. Per AX treatment: 143 test calls, 50 describe blocks. Port/adapter design means tests exercise services through interfaces, enabling genuine contract testing.

---

### Property 4: Defended (0–2)
*2 = pre-commit hooks + CI pipeline + linting enforced + commit conventions enforced; 1 = some CI or linting; 0 = nothing*

**Repo A — 0/2**
No CI pipeline (`.github/workflows` absent; Travis CI badge points to dead `travis-ci.org`). No active pre-commit hooks (only default `*.sample` files). No ESLint configuration. No commit convention enforcement.

**Repo B — 1/2**
ESLint config present (`.eslintrc.json` via `@nx/typescript` plugin). However, 33 violations exist in the codebase — ESLint is configured but not enforced as a blocking gate. No CI pipeline (`.github/workflows` absent). No pre-commit hooks. Partial credit for having the linting infrastructure, even if unenforced.

**Repo C — 1/2**
RX `build-log.txt`: `found 0 vulnerabilities` on `npm audit`. No hardcoded secrets (per spec requirement). ESLint required in specified stack. However: AX treatment (same GS methodology) confirmed no CI pipeline and no operationally enforced pre-commit hooks, despite GS artifacts specifying them. The GS spec defines these gates but does not emit a `.github/workflows` file. Consistent Defended=1/2 finding across AX and RX, driven by the AI agent's inability to provision external CI infrastructure.

---

### Property 5: Auditable (0–2)
*2 = conventional commits + ADRs for significant decisions + changelog; 1 = partial conventional commits, no ADRs; 0 = no discipline*

**Repo A — 1/2**
Git log shows partial conventional commits: `chore: update dependencies`, `chore(deps): bump lodash`, `chore: remove unused passport dependency`. Most commits non-conventional: `Update README.md`, `Replace crypto hashing with argon2`, `Fix articles feed endpoint`. No ADRs, no CHANGELOG.md.

**Repo B — 1/2**
Recent commits follow conventional format: `fix: missing user id`, `chore: update documentation`, `chore: move to nx`. Older commits non-conventional. No ADRs, no CHANGELOG.md.

**Repo C — 2/2**
RX spec explicitly requires ADRs emitted as files: `docs/adrs/ADR-0001-stack.md` (Stack Selection — Express + Prisma rationale) and `docs/adrs/ADR-0002-sql-injection.md` (Prisma parameterized queries). The spec contains this blocking rule: *"An ADR that appears in a README as 'see ADR-0001' but does not exist as `docs/adrs/ADR-0001-stack.md` fails the Auditable gate."* Unlike AX treatment (where ADRs were referenced but not emitted), RX spec enforces emission explicitly. Scored 2/2 on this stronger constraint; noted with caveat that generated code is gitignored.

---

### Property 6: Composable (0–2)
*2 = DI framework, interfaces over concrete types, swappable modules; 1 = some abstraction, coupling present; 0 = direct instantiation throughout*

**Repo A — 1/2**
NestJS DI via `@Injectable()` + `@InjectRepository(TypeORM Repository<Entity>)`. Constructor injection present throughout. However: no custom repository interfaces (`IArticleRepository`, `IUserRepository`). Services depend on TypeORM's generic `Repository<T>` (a concrete type). Cannot swap from TypeORM to another ORM without touching service files.

**Repo B — 1/2**
Feature-based directory structure provides module separation. No DI framework. Services import `prisma-client` directly (tight coupling). No repository interfaces. `article.service.ts` directly calls `prisma.article.findMany()`. Modules are not independently swappable.

**Repo C — 2/2**
Per AX treatment: `IUserRepository`, `IArticleRepository` interfaces in `src/ports/`. Composition root in `index.ts` wires `PrismaUserRepository` to `IUserRepository`. Services receive port interfaces via constructor injection. Swapping from Prisma to another ORM requires only new adapter implementations — no service changes. AX scored 2/2.

---

### Property 7: Executable (0–2)
*2 = README with exact steps + docker-compose or equivalent + migrations auto-run + tests pass against live DB; 1 = can be set up with manual steps; 0 = broken or undocumented*

**Repo A — 1/2**
README documents setup steps: install MySQL, create database, copy ormconfig.json, copy config.ts.example, npm start. `tsc --noEmit` passes after setup. No docker-compose; requires local MySQL. Setup requires 5+ manual steps and local MySQL knowledge. The config copy step (which fixes 4 tsc errors) is documented but non-obvious.

**Repo B — 1/2**
README has clear setup: `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npx nx serve api`. `tsc --noEmit` passes cleanly. Dockerfile present (runtime only). No docker-compose for development. Requires external PostgreSQL with `DATABASE_URL` configured.

**Repo C — 2/2**
RX `run-metadata.json`: `numPassedTests: 104`, `numFailedTests: 0`. `build-log.txt`: 0 tsc errors, 0 npm audit issues. `docker-compose.yml` at `experiments/rx/`. Prisma migrations run automatically as part of the runner. Test suite passes against live PostgreSQL. Satisfies the hard gate: `tsc --noEmit` exits 0 AND `jest --json` `numFailedTests === 0`.

---

## Finding: Does the Rubric Ranking Correlate?

### Rubric vs. External Static Analysis

| Signal | Repo A rank | Repo B rank | Repo C rank | Correlation |
|---|---|---|---|---|
| GS Rubric total | 3rd (6/14) | 2nd (7/14) | 1st (13/14) | — |
| npm audit CVEs (lower = better) | 3rd (105) | 2nd (43) | 1st (0) | **Matches** |
| npm audit critical (lower = better) | 3rd (16) | 2nd (1) | 1st (0) | **Matches** |
| tsc errors (lower = better) | 2nd* (0/4) | 1st (0) | 1st (0) | **Broadly matches** |
| Test count (higher = better) | 3rd (1) | 2nd (27) | 1st (104) | **Matches** |
| ESLint state | 3rd (no config) | 2nd (config, 33 violations) | 1st (config, ~0 violations) | **Matches** |

*\*Repo A tsc errors resolve to 0 after a documented manual step; minor mark-down.*

**The rubric ranking (C > B > A) is congruent with external tool ranking on every measured axis.**

### Rubric vs. Community Perception

Community perception (star count) ranks Repo A (2k stars) above Repo B (official but older). The rubric inverts this: B (7) > A (6). This is not a contradiction — it is a finding:

- **Repo A earns its 2k stars from NestJS architectural discipline** (Bounded=2/2). The rubric correctly identifies this.
- **Repo A's star count does not reflect its test coverage (1 test case) or security posture (105 CVEs including 16 critical)**. The rubric correctly penalizes these.
- The 1-point gap (6 vs 7) accurately represents that Repo A and Repo B are close in actual quality, with Repo A trading test coverage and security hygiene for stronger architectural enforcement.

**Conclusion: The GS rubric is a sharper quality discriminator than GitHub star count.** It rewards properties that objectively matter (coverage, security, enforcement infrastructure) rather than properties that attract attention (framework elegance, tutorial potential).

### Validity Claim

The BX experiment supports the following claim: **the GS 7-property rubric ranks external implementations in an order congruent with independent static analysis tools**. The rubric does not merely reward GS vocabulary — it captures measurable engineering properties that manifest in CVE counts, test counts, and TypeScript health.

The persistent gap identified across all three experiments (AX, RX, BX): **Defended scores below maximum** for all implementations because:
1. Community projects (A, B) do not invest in CI/hooks enforcement
2. AI-generated projects (C) can specify enforcement infrastructure but cannot provision external CI runners

This is the clearest signal of a rubric property that the GS methodology has not yet fully solved.

---

## Limitations

1. **Sample size**: 3 implementations is insufficient for statistical significance. BX is a validity probe, not a proof.
2. **Repo C not independently audited**: Generated code is gitignored. Repo C scores are inferred from evidence artifacts and AX treatment analysis. A fully blinded scoring of Repo C source would strengthen the claim.
3. **No live test execution**: Tests for Repos A and B were not run (no DB available). Test counts are from static analysis only.
4. **Rubric subjectivity**: Properties 1, 5, 6 involve judgment calls. A different scorer might award +/- 1 point on boundary cases.
5. **The 14/14 discrepancy**: The task prompt claims white paper documentation of 14/14 for Repo C. Evidence yields 13/14 (Defended=1/2). The discrepancy is noted; the evidence-based score is used throughout.

---

## Files

| File | Description |
|---|---|
| `README.md` | This document — experiment design, evidence, scoring rationale, finding |
| `scores.json` | Machine-readable scores, tool results, and ranking for all 3 implementations |
| `repo-a/` | Clone of `lujakob/nestjs-realworld-example-app` |
| `repo-b/` | Clone of `gothinkster/node-express-realworld-example-app` |
