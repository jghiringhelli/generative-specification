#!/usr/bin/env node
/**
 * static_ax2.cjs — the CLEAN cross-vendor signal.
 *
 * Only convention-independent, statically-computed metrics: they do not depend on runtime
 * behaviour, REST status conventions, or per-project test infrastructure, so they are FAIR
 * to compare across independently-generated apps (unlike coverage or the strict oracle).
 *
 * Per staged cell (runs/<slug>__<cond>/<rep>/project): duplication % (jscpd), cyclomatic
 * complexity distribution (eslint), dead exports (ts-prune, best-effort), architectural
 * layer violations (db calls in route/controller files), and bounding (files > 300 lines,
 * functions > 50 lines), plus ts/test file counts. No DB, no server. Fast, memory-safe.
 *
 * Emits static_ax2.json + a per-vendor x condition summary.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RUNS = path.join(__dirname, "runs");
const VENDORS = ["gpt-openai", "gemini-google", "claude-copilot"];
const CONDS = ["naive", "control", "treatment"];
const filter = process.argv[2] || "";
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", timeout: opts.timeout || 120000, maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32", ...opts });

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (/node_modules|\.git|dist|coverage|\.jscpd/.test(e.name)) continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, cb); else cb(f);
  }
}

function duplication(proj) {
  const src = path.join(proj, "src"); if (!fs.existsSync(src)) return null;
  const out = path.join(proj, ".jscpd-out");
  const r = sh("npx", ["--yes", "jscpd", src, "--reporters", "json", "--output", out, "--min-lines", "5", "--silent"], { cwd: proj, timeout: 90000 });
  try { const rep = JSON.parse(fs.readFileSync(path.join(out, "jscpd-report.json"), "utf8")); return +rep.statistics.total.percentage; }
  catch { return null; } finally { try { fs.rmSync(out, { recursive: true, force: true }); } catch {} }
}

function complexity(proj) {
  const src = path.join(proj, "src"); if (!fs.existsSync(src)) return null;
  const bin = path.join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "eslint.cmd" : "eslint");
  if (!fs.existsSync(bin)) return null;
  const r = sh(bin, [src, "--no-eslintrc", "--parser", "@typescript-eslint/parser", "--resolve-plugins-relative-to", __dirname,
    "--rule", '{"complexity":["error",0]}', "--ext", ".ts", "-f", "json"], { cwd: proj, timeout: 120000, env: { ...process.env, ESLINT_USE_FLAT_CONFIG: "false" } });
  let j; try { const s = r.stdout.slice(r.stdout.indexOf("[")); j = JSON.parse(s.slice(0, s.lastIndexOf("]") + 1)); } catch { return null; }
  const vals = [];
  for (const file of j) for (const m of file.messages || []) { const mm = /complexity of (\d+)/.exec(m.message); if (mm) vals.push(+mm[1]); }
  if (!vals.length) return { n: 0, mean: null, p95: null, max: null, over10: 0 };
  vals.sort((a, b) => a - b);
  return { n: vals.length, mean: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2), p95: vals[Math.min(vals.length - 1, Math.floor(0.95 * vals.length))], max: vals[vals.length - 1], over10: vals.filter((v) => v > 10).length };
}

function deadExports(proj) {
  if (!fs.existsSync(path.join(proj, "tsconfig.json"))) return null;
  const r = sh("npx", ["--yes", "ts-prune"], { cwd: proj, timeout: 90000 });
  if (r.status == null && !r.stdout) return null;
  const lines = (r.stdout || "").split(/\r?\n/).filter((l) => l.trim() && !/used in module/.test(l) && /\.ts:/.test(l));
  return lines.length;
}

function structural(proj) {
  let ts = 0, test = 0, layer = 0, filesOver300 = 0, longFns = 0;
  walk(proj, (f) => {
    if (!/\.ts$/.test(f)) return;
    ts++; const isTest = /\.(test|spec)\.ts$/.test(f); if (isTest) test++;
    const src = fs.readFileSync(f, "utf8"); const lines = src.split(/\r?\n/);
    if (lines.length > 300) filesOver300++;
    if (/routes?[\\/].*\.ts$|route\.ts$|controller/i.test(f) && !isTest) { const m = src.match(/\b(prisma|db|pool|knex)\s*\.\s*(article|user|comment|tag|profile|favorite|query|\$queryRaw)/gi); if (m) layer += m.length; }
    let depth = 0, start = -1;
    lines.forEach((ln, i) => { if (/\b(function|=>|async)\b/.test(ln) && /\{/.test(ln) && depth === 0) start = i; depth += (ln.match(/\{/g) || []).length - (ln.match(/\}/g) || []).length; if (depth === 0 && start >= 0) { if (i - start > 50) longFns++; start = -1; } });
  });
  return { ts, test, layer, filesOver300, longFns };
}

function runCell(slug, cond, rep) {
  const proj = path.join(RUNS, `${slug}__${cond}`, String(rep), "project");
  const rec = { slug, cond, rep };
  if (!fs.existsSync(proj)) { rec.note = "no-project"; return rec; }
  rec.dup = duplication(proj);
  rec.cc = complexity(proj);
  rec.dead = deadExports(proj);
  Object.assign(rec, structural(proj));
  return rec;
}

(function main() {
  const outFile = path.join(__dirname, "static_ax2.json");
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : [];
  const done = new Set(results.map((r) => `${r.slug}__${r.cond}/${r.rep}`));
  console.log("slug            cond        rep  dup%  cc.mean cc.max cc>10 dead  layer tsF  testF f>300 fn>50");
  for (const slug of VENDORS) for (const cond of CONDS) for (let rep = 0; rep < 5; rep++) {
    const key = `${slug}__${cond}/${rep}`;
    if (filter && !key.includes(filter)) continue;
    if (done.has(key)) continue;
    const r = runCell(slug, cond, rep); results.push(r);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    const cc = r.cc || {};
    console.log(`${slug.padEnd(15)} ${cond.padEnd(10)} ${r.rep}  ${String(r.dup ?? "-").padStart(4)}  ${String(cc.mean ?? "-").padStart(6)} ${String(cc.max ?? "-").padStart(5)} ${String(cc.over10 ?? "-").padStart(4)} ${String(r.dead ?? "-").padStart(4)}  ${String(r.layer ?? "-").padStart(4)} ${String(r.ts ?? "-").padStart(3)} ${String(r.test ?? "-").padStart(4)} ${String(r.filesOver300 ?? "-").padStart(4)} ${String(r.longFns ?? "-").padStart(4)}`);
  }
  const agg = {};
  for (const r of results) { (agg[`${r.slug}|${r.cond}`] = agg[`${r.slug}|${r.cond}`] || []).push(r); }
  const m = (g, fn) => { const v = g.map(fn).filter((x) => x != null && !isNaN(x)); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "-"; };
  console.log("\n=== STATIC summary (mean over reps) — convention-free, cross-vendor ===");
  console.log("vendor | condition   n  dup%  cc.mean cc>10  dead  layer  test-files");
  for (const k of Object.keys(agg).sort()) {
    const g = agg[k];
    console.log(`${k.padEnd(28)} ${g.length}  ${m(g, (x) => x.dup).padStart(4)}  ${m(g, (x) => x.cc && x.cc.mean).padStart(6)}  ${m(g, (x) => x.cc && x.cc.over10).padStart(4)}  ${m(g, (x) => x.dead).padStart(4)}  ${m(g, (x) => x.layer).padStart(4)}  ${m(g, (x) => x.test).padStart(5)}`);
  }
})();
