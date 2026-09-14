/**
 * AX runner — measure.cjs  (module 3 of 6)
 * Objective, rubric-independent metrics on a materialized project.
 * Each metric is independently captured (try/catch) so a failing step never
 * loses the others. Static metrics need no DB; coverage is best-effort against
 * a spun-up Postgres; mutation is opt-in (--mutation, heavy).
 *
 * Usage: node measure.cjs <condition> <rep> [--mutation] [--no-install]
 * Emits: runs/<condition>/<rep>/metrics.json
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const condition = process.argv[2];
const rep = process.argv[3];
const doMutation = process.argv.includes("--mutation");
const noInstall = process.argv.includes("--no-install");
if (!condition || !rep) { console.error("usage: node measure.cjs <condition> <rep> [--mutation] [--no-install]"); process.exit(1); }

const AX = path.resolve(__dirname, "..");
const proj = path.join(__dirname, "runs", condition, String(rep), "project");
if (!fs.existsSync(proj)) { console.error(`no project: ${proj} (run materialize first)`); process.exit(1); }
const metricsFile = path.join(path.dirname(proj), "metrics.json");

// Detect the REAL project root. Some conditions emit code under `output/` (their
// README says "generated code goes into output/"); others emit at the tree root.
// The toolchain (npm/tsc/eslint/jest) must run from the dir holding package.json,
// or install is skipped and every code metric measures the wrong tree.
function detectRoot(base) {
  if (fs.existsSync(path.join(base, "package.json"))) return base;
  let best = null, bestDepth = Infinity;
  const walk = (d, depth) => { if (depth > 3) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (/node_modules|\.git|coverage|dist/.test(e.name)) continue;
    if (e.isDirectory()) walk(path.join(d, e.name), depth + 1);
    else if (e.name === "package.json" && depth < bestDepth) { best = d; bestDepth = depth; } } };
  try { walk(base, 0); } catch {}
  return best || base;
}
const root = detectRoot(proj);

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: opts.cwd || root, encoding: "utf-8", timeout: opts.timeout || 300_000,
    maxBuffer: 128 * 1024 * 1024, shell: process.platform === "win32", env: { ...process.env, ...opts.env } });
  return { code: r.status, out: (r.stdout || "") + (r.stderr || "") };
}
function safe(label, fn) { try { return fn(); } catch (e) { return { error: String(e).slice(0, 300) }; } }

const M = { condition, rep: String(rep), measured_at: null, project_root: path.relative(proj, root).split(path.sep).join("/") || "." };

// files present
M.files = safe("files", () => {
  const list = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (/node_modules|\.git|coverage|dist/.test(e.name)) continue;
    const f = path.join(d, e.name); e.isDirectory() ? walk(f) : list.push(path.relative(proj, f).split(path.sep).join("/")); } };
  walk(proj); return { count: list.length, ts: list.filter((f) => f.endsWith(".ts")).length, test: list.filter((f) => /\.(test|spec)\.ts$/.test(f)).length, has_package: list.includes("package.json") };
});

// layer-boundary violations: prisma.* used directly in route files
M.layer_violations = safe("layer", () => {
  let count = 0; const hits = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (/node_modules|\.git|coverage|dist/.test(e.name)) continue;
    const f = path.join(d, e.name);
    if (e.isDirectory()) { walk(f); continue; }
    if (/routes?[\\/].*\.ts$/.test(f) || /route\.ts$/.test(f)) {
      const src = fs.readFileSync(f, "utf-8");
      const m = src.match(/\bprisma\s*\./g); if (m) { count += m.length; hits.push(path.relative(proj, f)); } } } };
  walk(proj); return { count, files: hits };
});

const hasPackage = fs.existsSync(path.join(root, "package.json"));
if (!noInstall && hasPackage) {
  console.log(`[${condition}/${rep}] npm install (root=${M.project_root})...`);
  const inst = run("npm", ["install", "--no-audit", "--no-fund"], { timeout: 600_000 });
  M.install = { code: inst.code, ok: inst.code === 0, tail: inst.out.slice(-300) };
}

// tsc strict error count
M.tsc = safe("tsc", () => {
  const r = run("npx", ["tsc", "--noEmit", "--strict"], { timeout: 180_000 });
  const errors = (r.out.match(/error TS\d+/g) || []).length;
  return { errors, code: r.code };
});

// eslint problems with a fixed, version-pinned config (legacy .eslintrc, forced
// off flat-config) so the metric is comparable across projects regardless of
// what (if anything) the generated project installed.
M.eslint = safe("eslint", () => {
  const cfg = path.join(root, ".eslintrc.measure.json");
  fs.writeFileSync(cfg, JSON.stringify({ root: true, parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"], extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
    parserOptions: { ecmaVersion: 2022, sourceType: "module" }, env: { node: true, es2022: true } }, null, 2));
  // Use the runner's own pinned eslint (installed once here) and resolve the
  // @typescript-eslint plugin relative to the runner, not the generated project —
  // npx -p failed to resolve the plugin (exit 2). This is version-stable + comparable.
  // Target "." (the whole root) so it lints whatever src layout the condition used.
  const bin = path.join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "eslint.cmd" : "eslint");
  const r = run(bin, [".", "--config", cfg, "--resolve-plugins-relative-to", __dirname,
    "--ext", ".ts", "-f", "json", "--no-eslintrc", "--ignore-pattern", "node_modules/", "--ignore-pattern", "coverage/"],
    { timeout: 240_000, env: { ESLINT_USE_FLAT_CONFIG: "false" } });
  let problems = null; try { const s = r.out.slice(r.out.indexOf("[")); problems = JSON.parse(s.slice(0, s.lastIndexOf("]") + 1)).reduce((a, f) => a + f.errorCount + f.warningCount, 0); } catch {}
  return { problems, code: r.code };
});

// npm audit CVE count
M.npm_audit = safe("audit", () => {
  const r = run("npm", ["audit", "--json"], { timeout: 120_000 });
  let cves = null; try { const j = JSON.parse(r.out); cves = j.metadata?.vulnerabilities?.total ?? null; } catch {}
  return { cves };
});

// executed coverage (best-effort; needs DB). One dedicated ephemeral Postgres on a
// fixed port, shared across all conditions/reps, schema reset per rep (--force-reset)
// so every rep gets a clean slate and unique-constraint fixtures never collide across
// runs. Self-contained: does NOT depend on the 11-service docker-compose or per-
// condition ports (which the new ablation rungs lack). Never blocks the other metrics.
const MEASURE_DB = { name: "conduit-measure", port: 5544, db: "conduit_measure" };
function ensureMeasureDb() {
  // start if not already up (idempotent; --rm auto-cleans on stop)
  const ps = run("docker", ["ps", "--filter", `name=^/${MEASURE_DB.name}$`, "--format", "{{.Names}}"], { timeout: 20_000 });
  if (!ps.out.includes(MEASURE_DB.name)) {
    run("docker", ["rm", "-f", MEASURE_DB.name], { timeout: 20_000 });
    run("docker", ["run", "-d", "--rm", "--name", MEASURE_DB.name,
      "-e", "POSTGRES_DB=" + MEASURE_DB.db, "-e", "POSTGRES_USER=conduit", "-e", "POSTGRES_PASSWORD=conduit",
      "-p", `${MEASURE_DB.port}:5432`, "postgres:16-alpine"], { timeout: 60_000 });
  }
  for (let i = 0; i < 30; i++) { // wait for readiness (~30s max)
    const rdy = run("docker", ["exec", MEASURE_DB.name, "pg_isready", "-U", "conduit", "-d", MEASURE_DB.db], { timeout: 10_000 });
    if (rdy.code === 0) return true;
    spawnSync(process.platform === "win32" ? "cmd" : "sh", process.platform === "win32" ? ["/c", "timeout", "/t", "1", "/nobreak"] : ["-c", "sleep 1"], { timeout: 3000 });
  }
  return false;
}
M.coverage = safe("coverage", () => {
  const dbUrl = process.env.DATABASE_URL || `postgresql://conduit:conduit@localhost:${MEASURE_DB.port}/${MEASURE_DB.db}`;
  const ready = ensureMeasureDb();
  if (!ready) return { statements_pct: null, jest_ran: false, note: "db-not-ready" };
  const env = { DATABASE_URL: dbUrl, NODE_ENV: "test" };
  // sync the schema fresh for this rep (best-effort; needs prisma/schema.prisma)
  if (fs.existsSync(path.join(root, "prisma", "schema.prisma"))) {
    run("npx", ["prisma", "generate"], { timeout: 120_000, env });
    run("npx", ["prisma", "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"], { timeout: 120_000, env });
  }
  const r = run("npx", ["jest", "--coverage", "--coverageReporters=json-summary", "--ci", "--runInBand", "--forceExit"],
    { timeout: 300_000, env });
  let pct = null; try { const s = JSON.parse(fs.readFileSync(path.join(root, "coverage", "coverage-summary.json"), "utf-8")); const p = s.total?.statements?.pct; pct = typeof p === "number" ? p : null; } catch {}
  const passed = /Tests:.*\d+ passed/.test(r.out) && !/\d+ failed/.test(r.out);
  return { statements_pct: pct, jest_ran: r.code === 0, passed, tail: r.out.slice(-400) };
});

if (doMutation) {
  M.mutation = safe("mutation", () => {
    const r = run("npx", ["stryker", "run"], { timeout: 900_000 });
    const m = r.out.match(/mutation score[^\d]*([\d.]+)/i);
    return { score: m ? +m[1] : null, code: r.code };
  });
}

fs.writeFileSync(metricsFile, JSON.stringify(M, null, 2));
console.log(`[${condition}/${rep}] metrics: tsc=${M.tsc?.errors} eslint=${M.eslint?.problems} cves=${M.npm_audit?.cves} layer=${M.layer_violations?.count} cov=${M.coverage?.statements_pct}${doMutation ? " mut=" + M.mutation?.score : ""}`);
