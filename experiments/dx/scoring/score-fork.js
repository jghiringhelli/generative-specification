#!/usr/bin/env node
/**
 * DX experiment scoring script.
 *
 * Usage: node score-fork.js <fork-url> <task> [--json]
 *
 * task: "base" | "kanban"
 *
 * Clones the fork into a temp directory, installs dependencies,
 * runs automated checks, and outputs a score.json.
 *
 * Requires: git, node, npm, docker (for database if running tests)
 */

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const FORK_URL = process.argv[2];
const TASK = process.argv[3];  // "base" | "kanban"
const JSON_OUTPUT = process.argv.includes('--json');

if (!FORK_URL || !TASK) {
  console.error('Usage: node score-fork.js <fork-url> <task: base|kanban> [--json]');
  process.exit(2);
}

const PORT = TASK === 'base' ? 3000 : 3001;

function run(cmd, cwd, ignoreError = false) {
  try {
    return execSync(cmd, { cwd, stdio: 'pipe', timeout: 60000 }).toString().trim();
  } catch (err) {
    if (ignoreError) return '';
    throw err;
  }
}

function check(name, fn) {
  try {
    const result = fn();
    return { name, passed: true, detail: result };
  } catch (err) {
    return { name, passed: false, detail: err.message?.slice(0, 200) };
  }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dx-score-'));
console.error(`Cloning ${FORK_URL} into ${tmpDir}...`);

try {
  run(`git clone --depth 1 ${FORK_URL} repo`, tmpDir);
  const repoDir = path.join(tmpDir, 'repo');
  run('npm install --silent', repoDir);

  const results = [];
  let totalPoints = 0;

  // Check 1: npm test passes (Verifiable — 2pts)
  const testResult = check('npm-test-passes', () => {
    const out = run('npm test -- --passWithNoTests 2>&1 || true', repoDir, true);
    if (out.includes('FAIL') && !out.includes('PASS')) throw new Error('Tests failing');
    return out.slice(-500);
  });
  const testPoints = testResult.passed ? 2 : 0;
  results.push({ ...testResult, property: 'Verifiable', points: testPoints });
  totalPoints += testPoints;

  // Check 2: No prisma in routes (Bounded — 2pts)
  const boundedResult = check('no-prisma-in-routes', () => {
    const out = run("grep -rn 'prisma\\.' src/routes/ 2>/dev/null | grep -v '//' || true", repoDir, true);
    if (out.trim()) throw new Error(`Direct Prisma calls found in routes:\n${out}`);
    return 'Clean';
  });
  const boundedPoints = boundedResult.passed ? 2 : 0;
  results.push({ ...boundedResult, property: 'Bounded', points: boundedPoints });
  totalPoints += boundedPoints;

  // Check 3: CLAUDE.md exists (Self-describing — 1pt)
  const selfDescResult = check('claude-md-exists', () => {
    if (!fs.existsSync(path.join(repoDir, 'CLAUDE.md'))) throw new Error('CLAUDE.md not found');
    return 'Found';
  });
  results.push({ ...selfDescResult, property: 'Self-describing', points: selfDescResult.passed ? 1 : 0 });
  totalPoints += selfDescResult.passed ? 1 : 0;

  // Check 4: ADR directory exists (Auditable — 1pt)
  const auditableResult = check('adr-directory-exists', () => {
    const hasAdr = fs.existsSync(path.join(repoDir, 'docs/adr')) ||
                   fs.existsSync(path.join(repoDir, 'adrs')) ||
                   fs.existsSync(path.join(repoDir, 'docs/adrs'));
    if (!hasAdr) throw new Error('No ADR directory found');
    return 'Found';
  });
  results.push({ ...auditableResult, property: 'Auditable', points: auditableResult.passed ? 1 : 0 });
  totalPoints += auditableResult.passed ? 1 : 0;

  // Check 5: Conventional commits (Auditable — 1pt)
  const commitResult = check('conventional-commits', () => {
    const log = run('git log --format=%s -n 20', repoDir, true);
    const commits = log.split('\n').filter(Boolean);
    const conventional = commits.filter(c =>
      /^(feat|fix|refactor|docs|test|chore|perf|ci)(\(.+\))?: .+/.test(c)
    );
    const ratio = commits.length > 0 ? conventional.length / commits.length : 0;
    if (ratio < 0.5) throw new Error(`Only ${Math.round(ratio * 100)}% conventional commits (${conventional.length}/${commits.length})`);
    return `${Math.round(ratio * 100)}% (${conventional.length}/${commits.length})`;
  });
  results.push({ ...commitResult, property: 'Auditable', points: commitResult.passed ? 1 : 0 });
  totalPoints += commitResult.passed ? 1 : 0;

  // Check 6: Feature endpoint returns correct shape (Composable — 3pts)
  const featureResult = check('feature-endpoint-shape', () => {
    // This check requires the server to be running — skip in CI without DB
    // For manual scoring sessions, run with server up
    if (!process.env.SCORE_WITH_SERVER) {
      return 'SKIPPED (set SCORE_WITH_SERVER=1 with server running)';
    }
    const endpoint = TASK === 'base' ? 'digest' : 'activity';
    const out = run(`curl -sf http://localhost:${PORT}/${endpoint} -H "Authorization: Bearer $TEST_TOKEN" 2>&1`, repoDir, true);
    const json = JSON.parse(out);
    if (TASK === 'base') {
      if (!json.generatedAt || !Array.isArray(json.bookmarks)) throw new Error('Wrong shape: expected {generatedAt, bookmarks[]}');
    } else {
      if (!json.generatedAt || !Array.isArray(json.entries)) throw new Error('Wrong shape: expected {generatedAt, entries[]}');
    }
    return 'Correct shape';
  });
  const featurePoints = featureResult.passed && !featureResult.detail?.includes('SKIPPED') ? 3 : 0;
  results.push({ ...featureResult, property: 'Composable', points: featurePoints });
  totalPoints += featurePoints;

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

  // Write score.json alongside script
  const outPath = path.join(process.cwd(), `score-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(score, null, 2));
  console.error(`Score written to ${outPath}`);

} finally {
  // Cleanup
  try { run(`rm -rf ${tmpDir}`, os.tmpdir(), true); } catch {}
}
