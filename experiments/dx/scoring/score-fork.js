#!/usr/bin/env node
/**
 * DX experiment scoring script.
 *
 * Usage: node score-fork.js <fork-url-or-path> <task> [--json]
 *
 * task: "vaquita" | "taskflow"
 *
 * Accepts a GitHub URL or a local file:// path (for pilot runs).
 * Clones or copies the repo, installs dependencies, runs automated
 * checks, and outputs a score report.
 *
 * Requires: git, node, npm
 * Optional: SCORE_WITH_SERVER=1 + TEST_TOKEN env vars for Composable check
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const FORK_URL = process.argv[2];
const TASK = process.argv[3];  // "vaquita" | "taskflow"
const JSON_OUTPUT = process.argv.includes('--json');

/** New feature route added by participant — only this file is checked for Bounded */
const FEATURE_ROUTE = {
  vaquita: 'src/routes/digest.ts',
  taskflow: 'src/routes/activity.ts',
};

/** Minimum coverage % on the new feature file to pass Verifiable */
const COVERAGE_THRESHOLD = 60;

const PORT = TASK === 'vaquita' ? 3000 : 3001;

if (!FORK_URL || !TASK || !FEATURE_ROUTE[TASK]) {
  console.error('Usage: node score-fork.js <fork-url-or-path> <task: vaquita|taskflow> [--json]');
  process.exit(2);
}

/**
 * Run a shell command synchronously.
 * @param {string} cmd
 * @param {string} cwd
 * @param {boolean} ignoreError
 * @returns {string}
 */
function run(cmd, cwd, ignoreError = false) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe', timeout: 120000 }).toString().trim();
  } catch (err) {
    if (ignoreError) return err.stdout?.toString().trim() ?? '';
    throw err;
  }
}

/**
 * Wrap a scoring check — catches throws and returns pass/fail result.
 * @param {string} name
 * @param {() => string} fn
 * @returns {{ name: string, passed: boolean, detail: string }}
 */
function check(name, fn) {
  try {
    const result = fn();
    return { name, passed: true, detail: result };
  } catch (err) {
    return { name, passed: false, detail: err.message?.slice(0, 300) };
  }
}

/**
 * Count `prisma.` calls in a file, ignoring comment lines.
 * Cross-platform replacement for `grep -rn 'prisma\.'`.
 * @param {string} filePath
 * @returns {number}
 */
function countPrismaCallsInFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  return lines.filter(l => !l.trim().startsWith('//') && l.includes('prisma.')).length;
}

/**
 * Remove a directory tree cross-platform (Node 14.14+).
 * @param {string} dirPath
 */
function removeDir(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {
    // best-effort on Windows if files are locked
  }
}

/**
 * Test whether a file's content matches a regex pattern.
 * Cross-platform replacement for grep.
 * @param {string} filePath
 * @param {RegExp} pattern
 * @returns {boolean}
 */
function scanFileForPattern(filePath, pattern) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return pattern.test(content);
  } catch { return false; }
}

/**
 * Return .ts/.js files added or changed relative to baseBranch.
 * Uses `git diff --name-only` — avoids scanning the whole repo.
 * @param {string} repoDir
 * @param {string} baseBranch
 * @returns {string[]} relative file paths
 */
function getNewFiles(repoDir, baseBranch = 'main') {
  try {
    const output = execSync(
      `git -C "${repoDir}" diff --name-only ${baseBranch}...HEAD`,
      { encoding: 'utf8' }
    );
    return output.trim().split('\n').filter(f => f && (f.endsWith('.ts') || f.endsWith('.js')));
  } catch { return []; }
}

const isLocalPath = FORK_URL.startsWith('file://') || fs.existsSync(FORK_URL);
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dx-score-'));
console.error(`Scoring ${FORK_URL} into ${tmpDir}...`);

try {
  let repoDir;

  if (isLocalPath) {
    const localPath = FORK_URL.replace(/^file:\/\//, '');
    repoDir = localPath;
    console.error('Using local path — skipping clone.');
  } else {
    // Fix: depth 20 so commit history check sees enough commits
    run(`git clone --depth 20 ${FORK_URL} repo`, tmpDir);
    repoDir = path.join(tmpDir, 'repo');
  }

  run('npm install --silent', repoDir);

  const results = [];
  let totalPoints = 0;

  // ---------------------------------------------------------------------------
  // Check 1: Tests pass AND test count > 0 (Verifiable — 2pts)
  // Fix: --passWithNoTests caused false positives for naive (0 tests scored 2/2)
  // Fix: also attempt coverage parse on feature file
  // ---------------------------------------------------------------------------
  const testResult = check('tests-pass-with-count', () => {
    const out = run('npm test -- --coverage --coverageReporters=text 2>&1', repoDir, true);

    // Require at least one passing test
    const passMatch = out.match(/Tests:\s+(\d+)\s+passed/);
    const testCount = passMatch ? parseInt(passMatch[1], 10) : 0;
    if (testCount === 0) throw new Error('No passing tests found (0 tests)');

    // Check for explicit failures
    const failMatch = out.match(/Tests:.*?(\d+)\s+failed/);
    if (failMatch && parseInt(failMatch[1], 10) > 0) {
      throw new Error(`${failMatch[1]} test(s) failing`);
    }

    // Parse coverage on NEW files only (FIX 4). If data is unavailable, skip — do not penalize.
    const newFiles = getNewFiles(repoDir);
    let coverageNote = ' | coverage: unknown';
    let coverageFailed = false;

    if (newFiles.length > 0) {
      const lowCoverageFiles = [];
      for (const f of newFiles) {
        const fileBase = path.basename(f, path.extname(f));
        const coverageMatch = out.match(new RegExp(`${fileBase}[^|]*\\|\\s*(\\d+(?:\\.\\d+)?)`));
        if (coverageMatch) {
          const pct = parseFloat(coverageMatch[1]);
          if (pct < COVERAGE_THRESHOLD) {
            lowCoverageFiles.push(`${fileBase}: ${pct}%`);
            coverageFailed = true;
          }
        }
      }
      coverageNote = lowCoverageFiles.length > 0
        ? ` | coverage below ${COVERAGE_THRESHOLD}%: ${lowCoverageFiles.join(', ')}`
        : ' | coverage: OK';
    }

    if (coverageFailed) {
      throw new Error(`Coverage below ${COVERAGE_THRESHOLD}% on new file(s):${coverageNote}`);
    }

    return `${testCount} test(s) passing${coverageNote}`;
  });
  const testPoints = testResult.passed ? 2 : 0;
  results.push({ ...testResult, property: 'Verifiable', points: testPoints });
  totalPoints += testPoints;

  // ---------------------------------------------------------------------------
  // Check 2: No direct Prisma calls in new/changed files (Bounded — 2pts)
  // FIX 1: Original used grep -rn 'prisma\.' which is unavailable on Windows.
  // Now scans only new/changed files via git diff --name-only, using Node fs.
  // ---------------------------------------------------------------------------
  const boundedResult = check('no-prisma-in-feature-route', () => {
    const featureFilePath = path.join(repoDir, FEATURE_ROUTE[TASK]);
    if (!fs.existsSync(featureFilePath)) {
      throw new Error(`Feature route not found: ${FEATURE_ROUTE[TASK]}`);
    }
    const newFiles = getNewFiles(repoDir);
    const violations = newFiles
      .map(f => ({ file: f, count: countPrismaCallsInFile(path.join(repoDir, f)) }))
      .filter(v => v.count > 0);

    if (violations.length > 0) {
      const summary = violations.map(v => `${v.file} (${v.count})`).join(', ');
      throw new Error(`Direct Prisma call(s) found in new files: ${summary}`);
    }
    return `Clean (0 Prisma calls in ${newFiles.length} new file(s))`;
  });
  const boundedPoints = boundedResult.passed ? 2 : 0;
  results.push({ ...boundedResult, property: 'Bounded', points: boundedPoints });
  totalPoints += boundedPoints;

  // ---------------------------------------------------------------------------
  // Check 3: CLAUDE.md exists (Self-describing — 1pt)
  // ---------------------------------------------------------------------------
  const selfDescResult = check('claude-md-exists', () => {
    if (!fs.existsSync(path.join(repoDir, 'CLAUDE.md'))) throw new Error('CLAUDE.md not found');
    const size = fs.statSync(path.join(repoDir, 'CLAUDE.md')).size;
    if (size < 100) throw new Error('CLAUDE.md exists but appears empty (<100 bytes)');
    return `Found (${size} bytes)`;
  });
  results.push({ ...selfDescResult, property: 'Self-describing', points: selfDescResult.passed ? 1 : 0 });
  totalPoints += selfDescResult.passed ? 1 : 0;

  // ---------------------------------------------------------------------------
  // Check 4: ADR directory exists (Auditable — 1pt)
  // ---------------------------------------------------------------------------
  const auditableResult = check('adr-directory-exists', () => {
    const candidates = ['docs/adr', 'adrs', 'docs/adrs', 'adr'];
    const found = candidates.find(d => fs.existsSync(path.join(repoDir, d)));
    if (!found) throw new Error(`No ADR directory found (checked: ${candidates.join(', ')})`);
    return `Found at ${found}`;
  });
  results.push({ ...auditableResult, property: 'Auditable', points: auditableResult.passed ? 1 : 0 });
  totalPoints += auditableResult.passed ? 1 : 0;

  // ---------------------------------------------------------------------------
  // Check 5: Conventional commits (Auditable — 1pt)
  // Fix: was --depth 1, only saw 1 commit. Now depth 20, checks all available.
  // ---------------------------------------------------------------------------
  const commitResult = check('conventional-commits', () => {
    // For local paths git log works directly; for cloned repos depth 20 is available
    const log = run('git log --format=%s', repoDir, true);
    const commits = log.split('\n').filter(Boolean);
    if (commits.length === 0) throw new Error('No commits found in history');

    const conventional = commits.filter(c =>
      /^(feat|fix|refactor|docs|test|chore|perf|ci|build|style)(\(.+\))?: .+/.test(c)
    );
    const ratio = conventional.length / commits.length;
    if (ratio < 0.5) {
      throw new Error(
        `Only ${Math.round(ratio * 100)}% conventional commits (${conventional.length}/${commits.length})`
      );
    }
    return `${Math.round(ratio * 100)}% conventional (${conventional.length}/${commits.length})`;
  });
  results.push({ ...commitResult, property: 'Auditable', points: commitResult.passed ? 1 : 0 });
  totalPoints += commitResult.passed ? 1 : 0;

  // ---------------------------------------------------------------------------
  // Check 6: Feature endpoint returns correct shape (Composable — 3pts)
  //
  // Composable check requires:
  //   SCORE_WITH_SERVER=1 env var to enable
  //   TEST_TOKEN env var with a valid JWT for the cloned repo
  //   A running test database (or the script starts one)
  // If SCORE_WITH_SERVER is not set, this check is skipped and logged as "manual required"
  // ---------------------------------------------------------------------------
  const featureResult = check('feature-endpoint-shape', () => {
    if (!process.env.SCORE_WITH_SERVER) {
      return 'SKIPPED (set SCORE_WITH_SERVER=1 with server running + TEST_TOKEN)';
    }
    const endpoint = TASK === 'vaquita' ? 'digest' : 'activity';
    const out = run(
      `curl -sf http://localhost:${PORT}/${endpoint} -H "Authorization: Bearer ${process.env.TEST_TOKEN}"`,
      repoDir,
      true
    );
    const json = JSON.parse(out);
    if (TASK === 'vaquita') {
      if (!json.generatedAt || !Array.isArray(json.bookmarks)) {
        throw new Error('Wrong shape: expected { generatedAt, bookmarks[] }');
      }
    } else {
      if (!json.generatedAt || !Array.isArray(json.entries)) {
        throw new Error('Wrong shape: expected { generatedAt, entries[] }');
      }
    }
    return 'Correct shape';
  });
  const featurePoints =
    featureResult.passed && !featureResult.detail?.includes('SKIPPED') ? 3 : 0;
  results.push({ ...featureResult, property: 'Composable', points: featurePoints });
  totalPoints += featurePoints;

  // ---------------------------------------------------------------------------
  // Output
  // ---------------------------------------------------------------------------
  const score = {
    fork: FORK_URL,
    task: TASK,
    timestamp: new Date().toISOString(),
    totalPoints,
    maxPoints: 10,
    checks: results,
  };

  if (JSON_OUTPUT) {
    console.log(JSON.stringify(score, null, 2));
  } else {
    console.log(`\n=== DX Score: ${FORK_URL} (${TASK}) ===`);
    for (const r of results) {
      const icon = r.passed ? '✅' : '❌';
      console.log(`${icon} ${r.name} [${r.property}] +${r.points}pts — ${r.detail}`);
    }
    console.log(`\nTotal: ${totalPoints}/10`);
  }

  const outPath = path.join(process.cwd(), `score-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(score, null, 2));
  console.error(`Score written to ${outPath}`);

} finally {
  if (!isLocalPath) removeDir(tmpDir);
}
