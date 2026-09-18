#!/usr/bin/env node
/**
 * static_cr.cjs — the CLEAN cross-capacity signal for the CR (capacity-relative) study.
 *
 * Same convention-independent static metrics as ../../ax/runner/static_ax2.cjs (duplication,
 * cyclomatic complexity, dead exports, LAYER VIOLATIONS, bounding, ts/test counts), with two
 * adaptations forced by the domain and the variable ladder:
 *   1. The layer-violation regex uses the PASTURA entities (paddock|herd|move|reading|forage),
 *      not RealWorld's (article|user|comment|tag). Using the AX2 regex verbatim would miss
 *      Pastura data-layer calls and undercount the key metric.
 *   2. Cells are DISCOVERED by scanning runs/ (dir names <slug>__<cond>), because the ladder is
 *      variable (see ../ladder.json), not a fixed 3-vendor list.
 * eslint + its TS plugins are borrowed from the AX2 runner's node_modules so no reinstall is
 * needed. jscpd / ts-prune run via `npx --yes`.
 *
 * Usage: node static_cr.cjs [substring-filter]
 * Emits: static_cr.json + a per-(slug x condition) summary.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RUNS = path.join(__dirname, "runs");
const AXRUNNER = path.resolve(__dirname, "..", "..", "ax", "runner"); // borrow eslint + plugins
const filter = process.argv[2] || "";
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", timeout: opts.timeout || 120000, maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32", ...opts });

// Pastura data-layer call signature (the layer-violation probe). Any data client (prisma/db/pool/
// knex/drizzle) invoked with a Pastura entity or a raw query, inside a route/controller file.
const LAYER_RE = /\b(prisma|db|pool|knex|drizzle|repo|sql)\s*\.\s*(paddock|herd|move|reading|forage|user|query|execute|\$queryRaw|select|insert|update|delete)/gi;
// Entity-only variant for ENTRYPOINT files (app/server/index/main): a data client invoked with a
// domain entity. Excludes the raw-verb alternation (query|execute|select|…) so startup boilerplate
// like `pool.query('SELECT 1')` health checks or `prisma.$connect()` is NOT miscounted. This lets
// the metric catch weak-rung naive MONOLITHS that access domain data straight from the entrypoint,
// without false-positiving on layered apps whose entrypoint only wires/pings the DB.
const LAYER_ENTITY_RE = /\b(prisma|db|pool|knex|drizzle|repo)\s*\.\s*(paddock|herd|move|reading|forage|user)s?\b/gi;
const ROUTE_FILE_RE = /routes?[\\/].*\.ts$|route\.ts$|controller/i;
const ENTRY_FILE_RE = /(^|[\\/])(app|server|index|main)\.ts$/i;
const DATA_LAYER_DIR_RE = /[\\/](repositor|repos?|dal|data|db|prisma|models?|infra|adapters?|persistence|storage|domain|services?)[\\/]/i;

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
  // jscpd's fast-glob treats Windows backslashes as escapes; scan/output relative to cwd (=proj).
  sh("npx", ["--yes", "jscpd", "src", "--reporters", "json", "--output", ".jscpd-out", "--min-lines", "5", "--silent"], { cwd: proj, timeout: 90000 });
  try { const rep = JSON.parse(fs.readFileSync(path.join(out, "jscpd-report.json"), "utf8")); return +rep.statistics.total.percentage; }
  catch { return null; } finally { try { fs.rmSync(out, { recursive: true, force: true }); } catch {} }
}
function complexity(proj) {
  const src = path.join(proj, "src"); if (!fs.existsSync(src)) return null;
  const bin = path.join(AXRUNNER, "node_modules", ".bin", process.platform === "win32" ? "eslint.cmd" : "eslint");
  if (!fs.existsSync(bin)) return null;
  const r = sh(bin, [src, "--no-eslintrc", "--parser", "@typescript-eslint/parser", "--resolve-plugins-relative-to", AXRUNNER,
    "--rule", '{"complexity":["error",0]}', "--ext", ".ts", "-f", "json"], { cwd: AXRUNNER, timeout: 120000, env: { ...process.env, ESLINT_USE_FLAT_CONFIG: "false" } });
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
  // raw = every unreferenced export; real = excluding index.ts barrel re-exports. ts-prune counts
  // a barrel/public-API re-export as "dead" because consumers import the symbol from its source
  // file, not through the barrel — so raw structurally over-counts codebases that expose a public
  // API surface (index.ts, ports, DTOs). real is the barrel-aware count. Both are reported; raw is
  // the pre-registered metric, real is the correction. Applied identically to naive and gs.
  const real = lines.filter((l) => !/[\\/]index\.ts:/.test(l));
  return { raw: lines.length, real: real.length };
}
function structural(proj) {
  let ts = 0, test = 0, layer = 0, filesOver300 = 0, longFns = 0;
  walk(proj, (f) => {
    if (!/\.ts$/.test(f)) return;
    ts++; const isTest = /\.(test|spec)\.ts$/.test(f); if (isTest) test++;
    const src = fs.readFileSync(f, "utf8"); const lines = src.split(/\r?\n/);
    if (lines.length > 300) filesOver300++;
    if (!isTest && ROUTE_FILE_RE.test(f)) { const m = src.match(LAYER_RE); if (m) layer += m.length; }
    else if (!isTest && ENTRY_FILE_RE.test(f) && !DATA_LAYER_DIR_RE.test(f)) { const m = src.match(LAYER_ENTITY_RE); if (m) layer += m.length; }
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
  const dead = deadExports(proj);
  rec.dead = dead ? dead.raw : null;
  rec.dead_real = dead ? dead.real : null;
  Object.assign(rec, structural(proj));
  return rec;
}

// discover cells: runs/<slug>__<cond>/<rep>
function discover() {
  const cells = [];
  if (!fs.existsSync(RUNS)) return cells;
  for (const d of fs.readdirSync(RUNS)) {
    const m = d.match(/^(.+)__(naive|gs)$/); if (!m) continue;
    const base = path.join(RUNS, d);
    for (const rep of fs.readdirSync(base)) {
      if (fs.existsSync(path.join(base, rep, "project"))) cells.push({ slug: m[1], cond: m[2], rep });
    }
  }
  return cells;
}

(function main() {
  const outFile = path.join(__dirname, "static_cr.json");
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : [];
  const done = new Set(results.map((r) => `${r.slug}__${r.cond}/${r.rep}`));
  console.log("slug                 cond   rep  dup%  cc.mean cc.max cc>10 dead dreal layer tsF  testF f>300 fn>50");
  for (const { slug, cond, rep } of discover()) {
    const key = `${slug}__${cond}/${rep}`;
    if (filter && !key.includes(filter)) continue;
    if (done.has(key)) continue;
    const r = runCell(slug, cond, rep); results.push(r);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    const cc = r.cc || {};
    console.log(`${slug.padEnd(20)} ${cond.padEnd(6)} ${r.rep}  ${String(r.dup ?? "-").padStart(4)}  ${String(cc.mean ?? "-").padStart(6)} ${String(cc.max ?? "-").padStart(5)} ${String(cc.over10 ?? "-").padStart(4)} ${String(r.dead ?? "-").padStart(4)} ${String(r.dead_real ?? "-").padStart(5)} ${String(r.layer ?? "-").padStart(4)} ${String(r.ts ?? "-").padStart(3)} ${String(r.test ?? "-").padStart(4)} ${String(r.filesOver300 ?? "-").padStart(4)} ${String(r.longFns ?? "-").padStart(4)}`);
  }
  const agg = {};
  for (const r of results) { (agg[`${r.slug}|${r.cond}`] = agg[`${r.slug}|${r.cond}`] || []).push(r); }
  const m = (g, fn) => { const v = g.map(fn).filter((x) => x != null && !isNaN(x)); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "-"; };
  console.log("\n=== STATIC summary (mean over reps) — convention-free, per rung x condition ===");
  console.log("slug|condition                 n  dup%  cc.mean cc>10  dead  dreal  layer  test-files");
  for (const k of Object.keys(agg).sort()) {
    const g = agg[k];
    console.log(`${k.padEnd(28)} ${g.length}  ${m(g, (x) => x.dup).padStart(4)}  ${m(g, (x) => x.cc && x.cc.mean).padStart(6)}  ${m(g, (x) => x.cc && x.cc.over10).padStart(4)}  ${m(g, (x) => x.dead).padStart(4)}  ${m(g, (x) => x.dead_real).padStart(5)}  ${m(g, (x) => x.layer).padStart(4)}  ${m(g, (x) => x.test).padStart(5)}`);
  }
})();
