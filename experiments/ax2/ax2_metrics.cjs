#!/usr/bin/env node
/*
 * ax2_metrics.cjs <target_dir>
 *
 * Objective, author-independent quality metrics for one AX2 output (a produced
 * RealWorld backend). These are the AX2 HEADLINE metrics — tool-computed, so
 * scoring is inherently blind. The 14-point rubric is explicitly NOT the headline.
 *
 * Emits one JSON object to stdout. Never throws: every metric degrades to null +
 * an error string so a single missing tool does not sink the whole run record.
 *
 * Precondition: conformance (the Hurl oracle) is gated by the RUNNER, not here.
 * A run that does not pass the oracle is not scored on quality.
 *
 * Tools invoked (all dev-deps or npx-fetchable): eslint (complexity), c8 (branch
 * coverage), stryker (mutation), jscpd (duplication), ts-prune (dead code),
 * tsc --strict (type health), npm audit (security). Configs/versions are recorded.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir || !fs.existsSync(dir)) {
  console.error('usage: ax2_metrics.cjs <target_dir>');
  process.exit(2);
}

function sh(cmd, opts = {}) {
  // Run in target dir; capture stdout; tolerate non-zero exit (many tools exit 1
  // when they FIND something). Caller parses; we never let a throw escape.
  try {
    return { ok: true, out: execSync(cmd, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, ...opts }) };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || ''), err: String(e.message || e) };
  }
}
function tryJSON(s) { try { return JSON.parse(s); } catch { return null; } }
function toolVersion(bin) { const r = sh(`npx --no-install ${bin} --version`); return r.ok ? r.out.trim().split('\n').pop() : null; }

const m = { target: dir, ts: new Date().toISOString(), tool_versions: {}, errors: {} };

// --- Type health: tsc --strict + explicit-any count ---
(() => {
  const r = sh('npx --no-install tsc --noEmit --strict');
  m.tsc_strict_pass = r.ok;
  m.tsc_error_count = (r.out.match(/error TS\d+/g) || []).length;
  // count explicit `any` in src (a code-smell proxy, not from tsc)
  const grep = sh(`node -e "const fs=require('fs'),p=require('path');let n=0;(function w(d){for(const f of fs.readdirSync(d)){const fp=p.join(d,f);const s=fs.statSync(fp);if(s.isDirectory()){if(!/node_modules|dist|.git/.test(fp))w(fp)}else if(/\\.ts$/.test(f)){n+=(fs.readFileSync(fp,'utf8').match(/[:<]\\s*any\\b/g)||[]).length}}})('src');process.stdout.write(String(n))"`);
  m.explicit_any = grep.ok ? parseInt(grep.out.trim(), 10) : null;
  if (!r.ok && m.tsc_error_count === 0) m.errors.tsc = r.err;
})();

// --- Cyclomatic complexity (eslint) — mean + p95 + max, per function ---
(() => {
  m.tool_versions.eslint = toolVersion('eslint');
  const r = sh(`npx --no-install eslint src --ext .ts -f json --rule "{\\"complexity\\":[\\"error\\",0]}" --no-eslintrc --parser @typescript-eslint/parser`);
  const j = tryJSON(r.out);
  if (!j) { m.errors.complexity = r.err || 'no json'; m.cc = null; return; }
  const vals = [];
  for (const file of j) for (const msg of (file.messages || [])) {
    const mm = /complexity of (\d+)/.exec(msg.message);
    if (mm) vals.push(parseInt(mm[1], 10));
  }
  vals.sort((a, b) => a - b);
  const pct = (p) => vals.length ? vals[Math.min(vals.length - 1, Math.floor(p * vals.length))] : null;
  m.cc = vals.length ? {
    n: vals.length,
    mean: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2),
    p95: pct(0.95), max: vals[vals.length - 1],
    over_10: vals.filter((v) => v > 10).length,
  } : { n: 0 };
})();

// --- Duplication (jscpd) ---
(() => {
  m.tool_versions.jscpd = toolVersion('jscpd');
  const r = sh('npx --no-install jscpd src --reporters json --silent --output .ax2-jscpd');
  const rep = path.join(dir, '.ax2-jscpd', 'jscpd-report.json');
  const j = fs.existsSync(rep) ? tryJSON(fs.readFileSync(rep, 'utf8')) : tryJSON(r.out);
  m.duplication_pct = j && j.statistics && j.statistics.total ? +j.statistics.total.percentage : null;
  if (m.duplication_pct == null) m.errors.jscpd = r.err || 'no report';
})();

// --- Dead code (ts-prune): count of unused exports ---
(() => {
  m.tool_versions['ts-prune'] = toolVersion('ts-prune');
  const r = sh('npx --no-install ts-prune');
  // ts-prune prints one line per unused export; "(used in module)" lines are excluded with -i default off
  const lines = (r.out || '').split('\n').filter((l) => l.trim() && !/used in module/.test(l));
  m.dead_exports = lines.length || 0;
})();

// --- Security (npm audit) ---
(() => {
  const r = sh('npm audit --json');
  const j = tryJSON(r.out);
  const v = j && j.metadata && j.metadata.vulnerabilities;
  m.npm_audit = v ? { critical: v.critical || 0, high: v.high || 0, moderate: v.moderate || 0 } : null;
  if (!m.npm_audit) m.errors.npm_audit = r.err || 'no json';
})();

// --- Branch coverage (c8) + mutation (stryker): heavy; run only if requested ---
// These are gated behind AX2_HEAVY=1 in the runner because they re-run the suite
// (coverage) or the whole mutation matrix (stryker, minutes per run).
if (process.env.AX2_HEAVY === '1') {
  (() => {
    const r = sh('npx --no-install c8 --reporter=json-summary --branches 0 npm test');
    const sum = path.join(dir, 'coverage', 'coverage-summary.json');
    const j = fs.existsSync(sum) ? tryJSON(fs.readFileSync(sum, 'utf8')) : null;
    m.branch_coverage_pct = j && j.total && j.total.branches ? j.total.branches.pct : null;
    if (m.branch_coverage_pct == null) m.errors.coverage = r.err || 'no summary';
  })();
  (() => {
    m.tool_versions.stryker = toolVersion('stryker');
    const r = sh('npx --no-install stryker run --reporters json');
    const rep = path.join(dir, 'reports', 'mutation', 'mutation.json');
    const j = fs.existsSync(rep) ? tryJSON(fs.readFileSync(rep, 'utf8')) : null;
    // mutation score = killed / (killed+survived+timeout+no-coverage) — read from report metrics if present
    m.mutation_score = j && j.metrics && typeof j.metrics.mutationScore === 'number' ? +j.metrics.mutationScore.toFixed(1) : null;
    if (m.mutation_score == null) m.errors.stryker = r.err || 'no report';
  })();
}

// --- Bounding: file- and function-length violations (simple, tool-free) ---
(() => {
  let fileViol = 0, longFuncs = 0, files = 0;
  const walk = (d) => { for (const f of fs.readdirSync(d)) {
    const fp = path.join(d, f); const s = fs.statSync(fp);
    if (s.isDirectory()) { if (!/node_modules|dist|\.git|coverage|\.ax2/.test(fp)) walk(fp); }
    else if (/\.ts$/.test(f)) {
      files++;
      const lines = fs.readFileSync(fp, 'utf8').split('\n');
      if (lines.length > 300) fileViol++;
      // crude long-function heuristic: run of lines between a `{`-opening decl and matching close > 50
      let depth = 0, start = -1;
      lines.forEach((ln, i) => {
        if (/\b(function|=>|async)\b/.test(ln) && /\{/.test(ln) && depth === 0) start = i;
        depth += (ln.match(/\{/g) || []).length - (ln.match(/\}/g) || []).length;
        if (depth === 0 && start >= 0) { if (i - start > 50) longFuncs++; start = -1; }
      });
    }
  } };
  if (fs.existsSync(path.join(dir, 'src'))) walk(path.join(dir, 'src'));
  m.bounding = { ts_files: files, files_over_300_lines: fileViol, functions_over_50_lines: longFuncs };
})();

process.stdout.write(JSON.stringify(m, null, 2));
