---
nav_exclude: true
---

# DX Experiment — Self-Administered Pilot Results

**Run date:** 2026-03-17  
**Script re-run (bugs fixed):** 2026-03-23  
**Pilot operator:** GitHub Copilot (self-administered)  
**Purpose:** Rubric calibration, baseline scores, script validation before April 2026 session.

---

## Summary Table

| Repo   | Condition  | Tests | Passing | Prisma-in-Feature-Route | Feature Coverage | Script Score (fixed) | Rubric (manual) |
|--------|------------|-------|---------|------------------------|-----------------|----------------------|-----------------|
| base   | naive      | 0     | 0       | 2                      | N/A             | **1/10**†            | 0/14            |
| base   | competent  | 3     | 3       | 2                      | 65.7%           | **3/10**             | 2/14            |
| base   | gs         | 5     | 5       | 0 ✓                    | 89.7%           | **7/10**             | 6/14            |
| kanban | naive      | 0     | 0       | 2                      | N/A             | **1/10**†            | 0/14            |
| kanban | competent  | 4     | 4       | 2                      | 88.5%           | **3/10**             | 3/14            |
| kanban | gs         | 8     | 8       | 0 ✓                    | 100%            | **7/10**             | 8/14            |

† naive scores +1 on conventional commits because the pilot uses local subdirs of the generative-specification repo — all conditions share the same scaffold git history (93% conventional). For real GitHub forks in April, each participant's history will be scored independently; naive expected to score 0/7.

> Bounded check now targets only the new feature route (digest.ts / activity.ts), not all routes.
> GS achieves 7/7 on all automatable checks — the Composable +3 (live server test) is the only remaining gap.
> Gradient: **1 → 3 → 7** — clean monotone separation across conditions.

---

## Automated Score Breakdown — Fixed Script (10 pts max)

| Repo   | Condition  | Verifiable (2) | Bounded (2) | Self-desc (1) | ADR (1) | Commits (1) | Composable (3) | Auto Total |
|--------|------------|----------------|-------------|----------------|---------|-------------|----------------|-----------|
| base   | naive      | 0 (0 tests)    | 0           | 0              | 0       | 1†          | SKIPPED        | **1/7**   |
| base   | competent  | 2 (65.7% cov)  | 0           | 0              | 0       | 1†          | SKIPPED        | **3/7**   |
| base   | gs         | 2 (89.7% cov)  | 2 ✓         | 1              | 1       | 1†          | SKIPPED        | **7/7**   |
| kanban | naive      | 0 (0 tests)    | 0           | 0              | 0       | 1†          | SKIPPED        | **1/7**   |
| kanban | competent  | 2 (88.5% cov)  | 0           | 0              | 0       | 1†          | SKIPPED        | **3/7**   |
| kanban | gs         | 2 (100% cov)   | 2 ✓         | 1              | 1       | 1†          | SKIPPED        | **7/7**   |

† Conventional commits: all conditions share the scaffold's git history (62/67 conventional) when scored as local paths. April GitHub forks will have independent histories.

**GS achieves a perfect 7/7 on all automatable checks. Composable (+3) requires live server setup.**

## Observer Bonus Breakdown (+4 pts)

| Repo   | Condition  | $transaction | Membership check | Error middleware | No console.log (routes) | Bonus |
|--------|------------|:---:|:---:|:---:|:---:|:---:|
| base   | naive      | —   | —   | ✗   | ✗   | +0  |
| base   | competent  | —   | —   | ✗   | ✗   | +0  |
| base   | gs         | —   | —   | ✓   | ✗†  | +1  |
| kanban | naive      | ✗   | ✗   | ✗   | ✗   | +0  |
| kanban | competent  | ✓   | ✗   | ✗   | ✗   | +1  |
| kanban | gs         | ✓   | ✓   | ✓   | ✗†  | +3  |

† Zero `console.log` in new feature routes only. Pre-existing routes (projects.ts, users.ts) still
have `console.log` in the scaffold.

---

## Score-Fork Script Run Results (as-is on Windows)

The scoring script was run against all 6 conditions using local `file://` paths instead of GitHub URLs.

| Condition     | Script score | Notes                                      |
|---------------|--------------|--------------------------------------------|
| base-naive    | 4/10         | +4 from two false positives (see bugs)     |
| base-competent| 4/10         | +2 false positive on Bounded               |
| base-gs       | 7/10         | +2 false positive on Bounded               |
| kanban-naive  | 4/10         | +4 from two false positives                |
| kanban-competent| 4/10       | +2 false positive on Bounded               |
| kanban-gs     | 7/10         | +2 false positive on Bounded               |

### Scoring Script Issues Found

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | **`grep` unavailable on Windows** — The Bounded check runs `grep -rn 'prisma\.'` which always fails silently on Windows (not in PATH). The `ignoreError=true` flag swallows the error and returns empty string, scoring all conditions as Clean. | **Critical** | Bounded check always scores +2 on Windows, masking the key architectural differentiator |
| 2 | **`rm -rf` unavailable on Windows** — The cleanup step `run(\`rm -rf ${tmpDir}\`, ...)` fails silently but temp dirs accumulate in `%TEMP%` | Low | Disk space only |
| 3 | **`--passWithNoTests` makes Verifiable a false positive** — Running `npm test -- --passWithNoTests` returns exit code 0 even with 0 tests. The script checks only for `FAIL` not for test count, so conditions with no tests score +2 on Verifiable. | **High** | naive conditions score +2 they don't deserve |
| 4 | **Coverage ≥ 60% not enforced** — The rubric description says "coverage ≥ 60%" contributes to Verifiable, but the script checks only whether tests pass or fail. | Medium | Competent condition has 29.6% coverage but scores 2/2 on Verifiable |
| 5 | **`git clone --depth 1` limits commit history** — The conventional commit check only sees 1 commit (the most recent). A participant could have 19 non-conventional commits and 1 conventional commit (the final push) and score 100%. | Medium | Commit format check is gameable and unreliable |
| 6 | **Composable check requires manual setup** — The 3-point feature shape check requires `SCORE_WITH_SERVER=1` and `TEST_TOKEN` env vars. No instructions for seeding test data to obtain a token. | Medium | 3 of 10 points cannot be automated without additional infrastructure |

### Recommended Fixes for April

```javascript
// Fix 1: Cross-platform prisma grep (replace the grep command)
const { execSync } = require('child_process');
// Use node's fs.readFileSync to scan routes instead of grep
function countPrismaInRoutes(repoDir) {
  const routesDir = path.join(repoDir, 'src', 'routes');
  let count = 0;
  for (const file of fs.readdirSync(routesDir)) {
    if (!file.endsWith('.ts')) continue;
    const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
    const lines = content.split('\n').filter(l => !l.trim().startsWith('//'));
    count += lines.filter(l => l.includes('prisma.')).length;
  }
  return count;
}

// Fix 2: Check test count explicitly 
const testCount = parseInt(out.match(/Tests:\s+(\d+)\s+passed/)?.[1] ?? '0');
if (testCount === 0) throw new Error('No tests found');

// Fix 3: Clone with --depth 10 minimum
run(`git clone --depth 10 ${FORK_URL} repo`, tmpDir);

// Fix 4: Use PowerShell rm on Windows
run(process.platform === 'win32' 
  ? `rmdir /s /q "${tmpDir}"` 
  : `rm -rf ${tmpDir}`, os.tmpdir(), true);
```

---

## Rubric Calibration Findings

### Finding 1 — Bounded check is binary and penalises scaffold inheritance ⚠️

The check is: 0 `prisma.*` in `src/routes/` = 2pts, else 0pts.  

In the workshop setting, participants **start from a scaffold** that already has Prisma in all routes.
The GS condition adds a clean new feature route (0 Prisma) but doesn't fully refactor the 4–5
pre-existing routes within the 90-minute window. Result: GS condition scores 0 on Bounded.

**Options:**
- A. Check only the **new/changed files** (requires knowing which files are new — compare to base scaffold)
- B. Reduce to a **count-weighted** score: `max(0, 2 - floor(prismaCount / threshold))`
- C. Keep binary, but **instruct GS participants** that CLAUDE.md means ALL routes must be clean
  (increases required scope significantly)
- **Recommended for April:** Option A — auto-detect new files with `git diff --name-only HEAD~N src/routes/`

### Finding 2 — Coverage metric is misleading for scaffold-inheriting tasks

Pre-existing untested routes drag overall coverage below 60% for all conditions even when the new
feature code has 88–100% coverage. Competent scores 29.6% overall (fails rubric) but 64.5% on
the feature file it actually wrote.

**Recommendation:** Measure coverage on new files only, consistent with Finding 1.

### Finding 3 — Composable check requires significant manual setup

Getting a JWT token for the live endpoint test requires a seeded database, a running server, and
coordination of env vars. In a 40-participant session, this is operationally fragile.

**Recommendation:** Pre-seed a standard test database and provide a canonical TEST_TOKEN in the
session coordinator's toolkit. Or add a `test:e2e` script to each workshop repo that handles this.

### Finding 4 — kanban scaffold has compile-blocking schema bugs

The kanban scaffold intentionally has schema mismatches (`authorId`/`userId`, `body`/`content`,
`creatorId` on Task) but these are TypeScript **compile errors**, not just runtime issues. All
conditions need to fix these before ts-jest can run. This is actually a valid intentional issue
(participants immediately hit it when running `npx tsc`), but the rubric should note it.

---

## What Each Condition Produces — Feature Comparison

### base repo — Weekly Digest

| Feature | naive | competent | gs |
|---------|-------|-----------|-----|
| GET /digest implemented | ✓ | ✓ | ✓ |
| POST /digest/notify implemented | ✓ | ✓ | ✓ |
| Correct response shape `{generatedAt, bookmarks[]}` | ✓ | ✓ | ✓ |
| Single DB query (no N+1) | ✗ N+1 | ✓ | ✓ |
| Service layer (no Prisma in route) | ✗ | ✗ | ✓ |
| Tests written | ✗ | ✓ (3 basic) | ✓ (5 comprehensive) |
| CLAUDE.md | ✗ | ✗ | ✓ |
| ADR | ✗ | ✗ | ✓ |
| Error middleware | ✗ | ✗ | ✓ |
| console.log in feature route | ✓ (present) | ✓ (present) | ✗ (clean) |

### kanban repo — Activity Log + Status Fix

| Feature | naive | competent | gs |
|---------|-------|-----------|-----|
| GET /activity implemented | ✓ | ✓ | ✓ |
| POST /tasks/:id/status atomic | ✗ missed | ✓ $transaction | ✓ $transaction |
| Correct response shape `{generatedAt, entries[]}` | ✓ | ✓ | ✓ |
| Service layer (no Prisma in activity route) | ✗ | ✗ | ✓ |
| Repository layer (no Prisma in service) | ✗ | ✗ | ✓ |
| Membership check on comments | ✗ | ✗ | ✓ |
| Tests written | ✗ | ✓ (4 basic) | ✓ (8 comprehensive) |
| CLAUDE.md | ✗ | ✗ | ✓ |
| ADR (2 docs) | ✗ | ✗ | ✓ |
| Error middleware | ✗ | ✗ | ✓ |
| schema bugs fixed (passwordHash etc) | ✗† | ✓ | ✓ |

† kanban-naive has no test infrastructure so compile errors don't surface during the pilot run.

---

## Output Directory Structure

```
experiments/dx/pilot/
  base-naive/        — Naive implementation: Prisma in routes, no tests
  base-competent/    — Group A implementation: 3 structured prompts, 3 tests
  base-gs/           — Group B GS: service layer, 5 tests, CLAUDE.md, ADR
  kanban-naive/      — Naive: Prisma in routes, no tests, no $transaction fix
  kanban-competent/  — Group A: $transaction fix, 4 tests, PROMPT_LOG.md
  kanban-gs/         — Group B GS: service+repo layers, 8 tests, CLAUDE.md, 2 ADRs
  results.md         — This file
```

---

## Pre-April Action Items

| Priority | Item |
|----------|------|
| P0 | Fix Bounded check to use Node.js fs instead of `grep` (Windows incompatible) |
| P0 | Fix Verifiable check to require test count > 0 |
| P1 | Fix cleanup to use platform-appropriate rm command |
| P1 | Clone with `--depth 20` or full clone for reliable commit format check |
| P1 | Decide on Bounded scope: all routes vs new-files-only |
| P1 | Pre-seed test database and publish TEST_TOKEN instructions for Composable check |
| P2 | Add coverage ≥ 60% enforcement to Verifiable check (on new files) |
| P2 | Document kanban schema bugs as explicit "first task" for all participants |
| P3 | Clarify observer bonus: "zero console.log in routes" means new routes only or all |
