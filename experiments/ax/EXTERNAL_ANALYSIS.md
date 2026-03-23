# AX Experiment — External Static Analysis

**Generated:** 2026-03-23 10:43 UTC  
**Analyst:** GitHub Copilot CLI (automated)  
**Purpose:** Independent validation pass using external tooling — results are orthogonal to the GS rubric score and serve as a circularity mitigation for F1 (the scoring rubric self-referential concern raised in the adversarial audit).

---

## 1. Tools Run

| Tool | Version / Invocation | What it measures |
|------|----------------------|------------------|
| **madge** | `npx madge --circular --extensions ts src/` | Circular import chains in TypeScript source |
| **jscpd** | `npx jscpd src/ --min-tokens 50 --reporters console` | Copy-paste duplication — clones ≥ 50 tokens |
| **ESLint** | `npx eslint src/` (only where `eslint.config.*` or `.eslintrc*` exists) | Lint errors and warnings; only treatment-v3 had a config |
| **tsc** | `npx tsc --noEmit` | TypeScript compiler errors; line count is a proxy for total error count |
| **PowerShell** | `Get-ChildItem … -Filter "I*.ts"` | Presence of IRepository-pattern interface files |
| **PowerShell** | `Get-ChildItem … -Recurse -Filter "*.ts"` counts | Test-to-source file ratio and file distribution per layer |

All tools are independent of the GS rubric. No rubric language was used to guide tool selection or interpretation.

---

## 2. Summary Table

| Condition | tsc output lines (errors) | ESLint problems | Circular deps | Duplication % | Clones | Interface files (I*.ts) | Test/Src ratio | Key observation |
|-----------|--------------------------|-----------------|---------------|---------------|--------|------------------------|----------------|-----------------|
| **naive** | 41 | no config | 0 | 12.54% | 19 | 0 | 0.00 (0/29) | Highest duplication; PrismaClient model errors pervasive; no test isolation |
| **control** | 1 | no config | 0 | 9.51% | 43 | 0 | 0.00 (0/40) | Most clone count (43); tests embedded in src/; single tsc error |
| **treatment** | 0 | no config | 0 | 2.24% | 6 | 0 | 0.12 (5/40) | Cleanest duplication; no tsc errors; first condition with separate tests/ dir |
| **treatment-v2** | 3 | no config | 0 | 4.18% | 7 | 2 | 0.24 (5/21) | Best test/src ratio; IRepo pattern partial (2/5 repos); tsconfig rootDir misconfiguration |
| **treatment-v3** | 24 | 45 (38 err / 7 warn) | 0 | 7.99% | 16 | 5 | 0.14 (5/35) | Most tsc errors; ESLint enforced — 38 errors caught; full IRepo interface set; regression vs v2 |
| **treatment-v4** | 1 | no config | 0 | 3.37% | 9 | 5 | 0.21 (7/34) | Single jwt type error; good duplication; full IRepo interface set; best test count (7) |
| **treatment-v5** | 0 | no config | 0 | 5.37% | 14 | 5 | 0.17 (6/36) | Clean compiler; full IRepo interface set; duplication creep (5.37%) vs treatment (2.24%) |

> **Note on interface file count:** Windows file system is case-insensitive; `I*.ts` also matched `index.ts` in conditions that have one. The counts above reflect only genuine `I[A-Z]*` interface files.

---

## 3. Per-Condition Detail

### 3a. naive

**madge:**
```
Processed 29 files (828ms)
✔ No circular dependency found!
```

**jscpd:**
```
| typescript | 29 files | 2440 lines | 20974 tokens | 19 clones | 306 duplicated lines (12.54%) | 2326 tokens (11.09%) |
```

**ESLint:** No config present — not run.

**tsc (41 lines of output — sample):**
```
src/__tests__/helpers.ts(32,17): error TS2339: Property 'article' does not exist on type 'PrismaClient...'
src/__tests__/helpers.ts(53,16): error TS2339: Property 'comment' does not exist on type 'PrismaClient...'
src/services/articleService.ts(3,25): error TS2305: Module '"../utils/errors"' has no exported member 'ForbiddenError'.
src/services/articleService.ts(47,39): error TS2339: Property 'favorite' does not exist on type 'PrismaClient...'
... (41 total output lines)
```

**Interface files:** None found.

**Layers (src/ file count per directory):**
```
__tests__   7
controllers 5
middleware  1
routes      4
services    5
src         2
types       1
utils       4
```

**Test/Src ratio:** src=29, tests=0 (tests embedded in src/__tests__/), ratio=0.00

---

### 3b. control

**madge:**
```
Processed 40 files (985ms)
✔ No circular dependency found!
```

**jscpd:**
```
| typescript | 38 files | 4681 lines | 40388 tokens | 43 clones | 445 duplicated lines (9.51%) | 4120 tokens (10.20%) |
```

**ESLint:** No config present — not run.

**tsc (1 line of output):**
```
src/services/articleService.ts(159,18): error TS2339: Property 'slug' does not exist on type '{ title?: string | undefined; description?: string | undefined; body?: string | undefined; }'.
```

**Interface files:** None found.

**Layers (src/ file count per directory):**
```
constants    2
integration  8
middleware   2
repositories 5
routes       5
services     5
src          1
unit         6
utils        3
validation   3
```

**Test/Src ratio:** src=40, tests=0 (tests embedded in src/), ratio=0.00

---

### 3c. treatment

**madge:**
```
Processed 40 files (949ms)
✔ No circular dependency found!
```

**jscpd:**
```
| typescript | 40 files | 3398 lines | 26412 tokens | 6 clones | 76 duplicated lines (2.24%) | 610 tokens (2.31%) |
```

**ESLint:** No config present — not run.

**tsc:** 0 lines of output — **clean**.

**Interface files:** None found.

**Layers (src/ file count per directory):**
```
config       2
errors       6
middleware   2
repositories 5
routes       5
services    10
src          2
types        5
validation   3
```

**Test/Src ratio:** src=40, tests=5, ratio=0.12

---

### 3d. treatment-v2

**madge:**
```
Processed 21 files (709ms) (15 warnings)
✔ No circular dependency found!
```
> 15 warnings likely indicate unresolvable module paths (path aliases or missing peer modules in the madge resolve graph). Not circular dependencies.

**jscpd:**
```
| typescript | 21 files | 2010 lines | 16459 tokens | 7 clones | 84 duplicated lines (4.18%) | 668 tokens (4.06%) |
```

**ESLint:** No config present — not run.

**tsc (3 lines of output):**
```
error TS6059: File 'jest.setup.ts' is not under 'rootDir' '.../src'.
  'rootDir' is expected to contain all source files.
  Matched by include pattern 'jest.setup.ts' in tsconfig.json
```
> A tsconfig misconfiguration: `jest.setup.ts` is included by the tsconfig but lives outside `rootDir`. Not a logic error.

**Interface files:** `IArticleRepository.ts`, `ICommentRepository.ts` (2 of 5 repositories have interfaces)

**Layers (src/ file count per directory):**
```
repositories 6
routes       4
services     8
src          1
types        2
```

**Test/Src ratio:** src=21, tests=5, ratio=0.24 — **highest of all conditions**

---

### 3e. treatment-v3

**madge:**
```
Processed 35 files (832ms)
✔ No circular dependency found!
```

**jscpd:**
```
| typescript | 35 files | 3343 lines | 24885 tokens | 16 clones | 267 duplicated lines (7.99%) | 2167 tokens (8.71%) |
```

**ESLint (45 problems — only condition with ESLint config `eslint.config.mjs`):**
```
38 errors, 7 warnings

Error categories:
  @typescript-eslint/naming-convention  — 17 errors (interface names not matching /^I[A-Z]/ pattern — DTOs and data classes named without I-prefix)
  @typescript-eslint/no-explicit-any    —  4 errors (in PrismaArticleRepository.ts)
  @typescript-eslint/no-unused-vars     —  3 errors (unused imports in ArticleService, CommentService, middleware)
  no-console                            —  7 warnings (console statements in index.ts, config, middleware)
  Other errors                          — 14 errors
```

**tsc (24 lines of output):**
```
src/repositories/PrismaArticleRepository.ts(311,9): error TS2353: 'following' does not exist in type '{ username; bio; image }'
src/services/ArticleService.ts(4,3):   error TS6133: 'CreateArticleData' declared but never read
src/services/ArticleService.ts(72,22): error TS6138: Property 'userRepository' declared but value never read
src/services/ArticleService.ts(94,7):  error TS2554: Expected 2 arguments, but got 3
src/services/ArticleService.ts(260,34): error TS2339: Property 'favorite' does not exist on type 'IArticleRepository'
src/services/ArticleService.ts(285,34): error TS2339: Property 'unfavorite' does not exist on type 'IArticleRepository'
src/services/UserService.ts(196,16):   error TS2769: No overload matches this call (jwt.sign)
... (24 total output lines)
```
> Interface/implementation mismatch: IArticleRepository does not declare `favorite`/`unfavorite` methods that ArticleService tries to call. Suggests interface was defined but not fully aligned with service usage.

**Interface files:** `IArticleRepository.ts`, `ICommentRepository.ts`, `IProfileRepository.ts`, `ITagRepository.ts`, `IUserRepository.ts` (5 — full set)

**Layers (src/ file count per directory):**
```
config       2
errors       1
middleware   2
repositories 10
routes       5
services     9
src          2
types        2
utils        2
```

**Test/Src ratio:** src=35, tests=5, ratio=0.14

---

### 3f. treatment-v4

**madge:**
```
Processed 34 files (833ms)
✔ No circular dependency found!
```

**jscpd:**
```
| typescript | 34 files | 3500 lines | 26782 tokens | 9 clones | 118 duplicated lines (3.37%) | 993 tokens (3.71%) |
```

**ESLint:** No config present — not run.

**tsc (1 line of output):**
```
src/utils/jwt.ts(18,34): error TS2322: Type 'string' is not assignable to type 'number | StringValue | undefined'.
```
> A single type mismatch in JWT utility — expiresIn option passed as `string` instead of `StringValue` type.

**Interface files:** `IArticleRepository.ts`, `ICommentRepository.ts`, `IProfileRepository.ts`, `ITagRepository.ts`, `IUserRepository.ts` (5 — full set)

**Layers (src/ file count per directory):**
```
errors       1
middleware   2
repositories 10
routes       6
services    10
src          2
types        1
utils        2
```

**Test/Src ratio:** src=34, tests=7, ratio=0.21 — **highest test file count (7)**

---

### 3g. treatment-v5

**madge:**
```
Processed 36 files (851ms)
✔ No circular dependency found!
```

**jscpd:**
```
| typescript | 36 files | 3721 lines | 27035 tokens | 14 clones | 200 duplicated lines (5.37%) | 1759 tokens (6.51%) |
```

**ESLint:** No config present — not run.

**tsc:** 0 lines of output — **clean**.

**Interface files:** `IArticleRepository.ts`, `ICommentRepository.ts`, `IProfileRepository.ts`, `ITagRepository.ts`, `IUserRepository.ts` (5 — full set)

**Layers (src/ file count per directory):**
```
config       1
errors       1
middleware   2
repositories 10
routes       5
services    10
src          2
utils        2
validators   3
```

**Test/Src ratio:** src=36, tests=6, ratio=0.17

---

## 4. Findings: Patterns and Interpretation

### 4.1 Progressive Adoption of Interfaces (IRepository Pattern)

The clearest signal across conditions is the adoption of the IRepository/interface-first pattern:

| Tier | Conditions | Interface files |
|------|-----------|-----------------|
| None | naive, control, treatment | 0 |
| Partial | treatment-v2 | 2/5 |
| Full | treatment-v3, treatment-v4, treatment-v5 | 5/5 |

This mirrors the GS rubric's architectural scoring: conditions without interfaces (naive, control) correspond to lower architectural fidelity, while v3–v5 converge on the expected hexagonal pattern.

### 4.2 Duplication Trend

```
naive    12.54%  ██████████████████████████████████████
control   9.51%  ██████████████████████████████
treatment 2.24%  ██████
treatment-v2 4.18% █████████████
treatment-v3 7.99% █████████████████████████
treatment-v4 3.37% ██████████
treatment-v5 5.37% ████████████████
```

- **treatment** (2.24%) is the cleanest. This is likely because it extracted services and validators but didn't yet adopt the IRepository pattern (which adds interface+implementation boilerplate that can look like duplication).
- **treatment-v3** (7.99%) regresses significantly — this aligns with its ESLint and tsc errors; the condition appears to have introduced more code without sufficient DRY discipline.
- **v5** (5.37%) is the second highest among treatment variants, suggesting duplication crept back in as the implementation grew.

### 4.3 TypeScript Compiler Errors

| Condition | tsc lines | Interpretation |
|-----------|-----------|----------------|
| naive | 41 | Systemic: Prisma schema out of sync; missing exports; fundamental model errors |
| control | 1 | Near-clean; single property access error |
| treatment | 0 | **Fully clean** |
| treatment-v2 | 3 | Config-only: tsconfig rootDir misconfiguration; not a logic error |
| treatment-v3 | 24 | Interface/implementation mismatch: IArticleRepository missing favorite/unfavorite; ArticleService using methods not in interface |
| treatment-v4 | 1 | Single type mismatch in JWT utility |
| treatment-v5 | 0 | **Fully clean** |

treatment-v3's 24 error lines are qualitatively worse than a single line: the errors span multiple services and include interface contract violations (calling `.favorite()` on `IArticleRepository` when the method isn't declared there). This is a deeper structural defect than a single type coercion.

### 4.4 ESLint Signal (treatment-v3 Only)

treatment-v3 is the only condition that configured ESLint — which means it is also the only condition where lint quality is measurable. The 38 ESLint errors reveal:

1. **Naming convention violations (17):** DTOs and data shape interfaces created without the `I`-prefix despite an ESLint rule requiring it — the IRepository pattern was added but the naming discipline wasn't applied to all interfaces.
2. **`no-explicit-any` violations (4):** Concrete repository uses `any` in internal type casts.
3. **Unused imports (3):** Dead type imports across services — left-over from refactoring.

This suggests treatment-v3 introduced the IRepository pattern mechanically without fully integrating it into the codebase.

### 4.5 Test Coverage Ratio

| Condition | Ratio | Notes |
|-----------|-------|-------|
| naive | 0.00 | Tests in src/__tests__, no dedicated dir |
| control | 0.00 | Tests in src/, no dedicated dir |
| treatment | 0.12 | Separate tests/ dir introduced |
| treatment-v2 | **0.24** | Best ratio; tests/ dir with 5 files for 21 src files |
| treatment-v3 | 0.14 | Ratio drops despite more source files |
| treatment-v4 | 0.21 | 7 test files — highest count |
| treatment-v5 | 0.17 | 6 test files; moderate |

treatment-v2 achieves the best ratio (0.24) with the smallest codebase (21 src files), suggesting focused testing. treatment-v4 has the most test files (7) but the ratio is diluted by the larger source count.

### 4.6 Alignment with GS Audit Scores

The external metrics broadly corroborate the GS rubric ranking:

- **naive and control** show the weakest signals on every metric (high duplication, most or near-most tsc errors, zero interfaces, no test isolation).
- **treatment** emerges as a clean baseline: zero tsc errors, lowest duplication, separate test directory — even without the full IRepository pattern.
- **treatment-v3** is an anomaly: it has the most architectural scaffolding (5 interfaces, ESLint config, validators directory) but the **worst quality metrics** (24 tsc errors, 45 ESLint problems, 7.99% duplication). The GS rubric likely scored it higher on structure but the external tools reveal that the structure was added without ensuring correctness.
- **treatment-v4** and **treatment-v5** converge: clean tsc, full interface set, moderate duplication — v5 slightly more files, slightly more duplication.

---

## 5. Defects Found

### CRITICAL — treatment-v3

| Defect | Tool | Evidence |
|--------|------|----------|
| Interface/implementation contract violation | tsc | `ArticleService` calls `.favorite()` and `.unfavorite()` on `IArticleRepository` but these methods are not declared in the interface; causes runtime-invisible type errors |
| JWT sign overload mismatch | tsc | `UserService.ts(196)`: wrong overload for `jwt.sign()` |
| Unused dependency injection | tsc | `userRepository` and `profileRepository` declared but never read in `ArticleService` |
| Duplicate interfaces (naming convention) | ESLint | 17 `@typescript-eslint/naming-convention` errors — DTOs named without `I` prefix despite enforced rule |
| Dead imports | ESLint | `CreateArticleData`, `ArticleListResult`, `CommentWithAuthor`, `CreateCommentData` imported but never used |
| Any-typed Prisma adapter | ESLint | 4 `no-explicit-any` in `PrismaArticleRepository.ts` |
| Elevated duplication (7.99%) | jscpd | 16 clones; highest among treatment variants |

### MODERATE — naive

| Defect | Tool | Evidence |
|--------|------|----------|
| Prisma schema desync | tsc | `PrismaClient` models `article`, `comment`, `favorite`, `tag` not generated; 41 lines of type errors |
| Missing error export | tsc | `ForbiddenError` not exported from `../utils/errors` |
| High duplication | jscpd | 12.54%, 19 clones — highest of all conditions |
| No test isolation | — | Tests embedded in `src/__tests__`; ratio=0.00 |

### MODERATE — control

| Defect | Tool | Evidence |
|--------|------|----------|
| Property access error | tsc | `articleService.ts(159)`: `slug` property missing |
| Highest clone count | jscpd | 43 clones (9.51% duplication) — 43 is the highest clone count of any condition |
| No test isolation | — | Tests embedded in `src/`; ratio=0.00 |

### LOW — treatment-v2

| Defect | Tool | Evidence |
|--------|------|----------|
| tsconfig misconfiguration | tsc | `jest.setup.ts` outside `rootDir` causes TS6059; not a logic error but will break build pipelines that call `tsc` |
| Incomplete interface adoption | — | Only 2 of 5 repository interfaces defined |
| Madge warnings (15) | madge | Unresolvable module paths; likely path alias configuration |

### LOW — treatment-v4

| Defect | Tool | Evidence |
|--------|------|----------|
| JWT type mismatch | tsc | `expiresIn` passed as `string` instead of `StringValue | number | undefined` |

### LOW — treatment-v5

| Defect | Tool | Evidence |
|--------|------|----------|
| Duplication creep | jscpd | 5.37% / 14 clones — elevated relative to treatment (2.24%) and treatment-v4 (3.37%) |
| No ESLint config | — | Cannot measure lint quality; treatment-v3's ESLint session revealed that interface-heavy code accumulates naming violations without enforcement |
| Test ratio decline | — | 0.17 vs treatment-v4's 0.21 despite similar source size |

---

## 6. treatment-v5 Assessment and v6 Flag

### treatment-v5 Clean Signals
- Zero TypeScript compiler errors (`tsc --noEmit` clean)
- Zero circular dependencies (madge)
- Full IRepository interface set (5 interfaces)
- Dedicated `tests/` and `validators/` directories

### treatment-v5 Defect Signals
- **Duplication creep** (5.37%, 14 clones): more than 2× treatment's baseline (2.24%). The jscpd data shows that as the codebase grows across v3–v5, duplication accumulates rather than decreasing. v5 is not regressing to naive/control levels but is trending in the wrong direction.
- **No ESLint enforcement**: without a lint config, there is no automated guard against the naming convention and any-type violations seen in treatment-v3 (which had a config and still accumulated 38 errors).
- **Test/src ratio declining**: v5 (0.17) < v4 (0.21) < v2 (0.24). Each successive version is adding more source files proportionally faster than test files.
- **Missing error handling layer**: v5 has `errors/` directory in src (1 file) but no dedicated `types/` directory (treatment had 5 type files); structural coverage may have regressed.

### v6 Run Verdict

> **⚠️ v6 is warranted — moderate confidence.**

The external metrics show treatment-v5 is structurally sound (clean tsc, no circular deps, full interfaces) but has two compounding quality signals that are trending in the wrong direction:

1. **Duplication creep** (5.37%) suggests the codebase is growing with copy-paste patterns rather than extraction. A v6 run targeting explicit DRY enforcement and the addition of an ESLint config (modeled on treatment-v3's `eslint.config.mjs` but with correct naming conventions) would likely reduce this.

2. **Test ratio decline** suggests the testing discipline from treatment-v2 (0.24 ratio) has not been preserved. A v6 run with an explicit testing coverage requirement in the specification would address this.

Neither defect is blocking (no runtime errors, no circular deps), but the trend across v3–v5 is duplication increasing and test ratio declining, which are the early indicators of architectural erosion. v6 represents the inflection opportunity to reverse both trends.

---

## 7. Raw Data Reference

| Condition | tsc lines | Duplication % | Clones | Circular | Interface count | Test files | Src files |
|-----------|-----------|---------------|--------|----------|-----------------|------------|-----------|
| naive | 41 | 12.54% | 19 | 0 | 0 | 0 | 29 |
| control | 1 | 9.51% | 43 | 0 | 0 | 0 | 40 |
| treatment | 0 | 2.24% | 6 | 0 | 0 | 5 | 40 |
| treatment-v2 | 3 | 4.18% | 7 | 0 | 2 | 5 | 21 |
| treatment-v3 | 24 | 7.99% | 16 | 0 | 5 | 5 | 35 |
| treatment-v4 | 1 | 3.37% | 9 | 0 | 5 | 7 | 34 |
| treatment-v5 | 0 | 5.37% | 14 | 0 | 5 | 6 | 36 |
