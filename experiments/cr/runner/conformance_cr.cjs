#!/usr/bin/env node
/**
 * conformance_cr.cjs [filter]
 *
 * Behavioural conformance for the CR (capacity-relative) study: does each generated Pastura
 * project RUN and satisfy the invented-domain contract? Adapted from
 * ../../ax/runner/conformance_ax2.cjs with the changes the heterogeneous, non-Prisma-guaranteed
 * CR apps require:
 *   - Oracle = the 6 Pastura probe groups in ../benchmark/oracle/probes (24 probes), NOT the
 *     RealWorld 13. oracle_pass is per-GROUP (matching the AX2 per-file convention).
 *   - Migration is prisma-first with an npm-script fallback (db:push / migrate / setup), because
 *     the DOMAIN_SPEC allows any ORM. `no-migration` is recorded honestly when neither is found.
 *   - `npm install` is run if node_modules is absent (turnkey on a freshly pulled tree).
 *   - Serve is tsx-entry-first with an `npm run` (start/dev) fallback.
 *   - Readiness probes /paddocks (401 without a token still proves the server is up).
 *   - Reports the BUSINESS-RULE sub-score = pass over {g3,g4,g5}/3, the load-bearing figure.
 *   - Cells discovered by scanning runs/ (variable ladder).
 *
 * DB: a dedicated pastura-measure Postgres (port 5545) so it never clashes with AX2's
 * conduit-measure. One server at a time, killed between cells (memory-safe).
 *
 * Usage: node conformance_cr.cjs [substring-filter]
 * Emits: conformance_cr.json + a per-(slug x condition) summary.
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const RUNS = path.join(__dirname, "runs");
const HURL = "C:\\PROGRA~1\\hurl\\hurl.exe";
const PROBE_DIR = path.resolve(__dirname, "..", "benchmark", "oracle", "probes");
const BUSINESS = new Set(["g3_rule_rest", "g4_rule_capacity", "g5_rule_overlap"]);
const PORT = 4147;
const DB = { name: "pastura-measure", port: 5545, db: "pastura_measure", user: "pastura", pass: "pastura" };
const filter = process.argv[2] || "";

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", timeout: opts.timeout || 120000, shell: process.platform === "win32", ...opts });

function ensureDb() {
  const ps = sh("docker", ["ps", "--filter", `name=^/${DB.name}$`, "--format", "{{.Names}}"], { timeout: 20000 });
  if (!ps.stdout.includes(DB.name)) {
    sh("docker", ["rm", "-f", DB.name], { timeout: 20000 });
    sh("docker", ["run", "-d", "--rm", "--name", DB.name, "-e", `POSTGRES_DB=${DB.db}`, "-e", `POSTGRES_USER=${DB.user}`, "-e", `POSTGRES_PASSWORD=${DB.pass}`, "-p", `${DB.port}:5432`, "postgres:16-alpine"], { timeout: 60000 });
  }
  for (let i = 0; i < 40; i++) {
    if (sh("docker", ["exec", DB.name, "pg_isready", "-U", DB.user, "-d", DB.db], { timeout: 8000 }).status === 0) return true;
    sh(process.platform === "win32" ? "cmd" : "sh", process.platform === "win32" ? ["/c", "timeout", "/t", "1", "/nobreak"] : ["-c", "sleep 1"], { timeout: 3000 });
  }
  return false;
}
function killPort(p) {
  const out = sh("netstat", ["-ano"], { timeout: 15000 }).stdout || "";
  const pids = new Set();
  out.split(/\r?\n/).forEach((l) => { if (new RegExp(`[:.]${p}\\s`).test(l) && /LISTENING/i.test(l)) { const m = l.trim().split(/\s+/).pop(); if (m && m !== "0") pids.add(m); } });
  for (const pid of pids) sh("taskkill", ["/F", "/PID", pid], { timeout: 10000 });
}
function detectEntry(proj) {
  for (const e of ["src/server.ts", "src/index.ts", "src/main.ts", "src/app.ts", "server.ts", "index.ts"]) {
    if (fs.existsSync(path.join(proj, e))) return e;
  }
  return null;
}
function pkgScripts(proj) {
  try { return JSON.parse(fs.readFileSync(path.join(proj, "package.json"), "utf8")).scripts || {}; } catch { return {}; }
}
function waitReady(p, ms = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const r = sh("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", `http://127.0.0.1:${p}/paddocks`], { timeout: 6000 });
    if (r.stdout && /^[2-5]\d\d$/.test(r.stdout.trim()) && r.stdout.trim() !== "000") return true;
    sh(process.platform === "win32" ? "cmd" : "sh", process.platform === "win32" ? ["/c", "timeout", "/t", "1", "/nobreak"] : ["-c", "sleep 1"], { timeout: 3000 });
  }
  return false;
}

function discoverSqlMigrations(proj) {
  // The DOMAIN_SPEC allows any ORM/mechanism; find raw .sql schema/migration files wherever the
  // model chose to put them, apply them in filename order. Skip down/rollback and seed-only files.
  const dirs = ["", "sql", "db", "src/db", "database", "migrations", "db/migrations", "prisma/migrations", "src/migrations", "src/database"];
  const found = new Set();
  const collect = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (/^(node_modules|\.git|dist|build|coverage|\.next|out)$/i.test(e.name)) continue;
      const f = path.join(dir, e.name);
      if (e.isDirectory()) collect(f);
      else if (/\.sql$/i.test(e.name) && !/(down|rollback|revert|undo|seed|fixture)/i.test(e.name)) found.add(f);
    }
  };
  for (const d of dirs) collect(path.join(proj, d));
  return [...found].sort();
}
function applySqlFiles(files) {
  if (!files.length) return null;
  for (const f of files) {
    const r = sh("docker", ["exec", "-i", DB.name, "psql", "-v", "ON_ERROR_STOP=1", "-U", DB.user, "-d", DB.db, "-f", "-"], { input: fs.readFileSync(f, "utf8"), timeout: 60000 });
    if (r.status !== 0) return null;
  }
  return `sql:${files.length}`;
}
function resetDb() {
  // Guarantee a clean database per cell so results are independent of cell order. The prisma
  // path uses --force-reset, but the raw-SQL/npm-script paths do not; reset here covers all.
  // SQL goes via stdin (not -c): under shell:true on Windows, a spaced -c argument is not quoted
  // and would be split apart, silently skipping the reset.
  sh("docker", ["exec", "-i", DB.name, "psql", "-U", DB.user, "-d", DB.db], { input: "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;\n", timeout: 30000 });
}
function prismaCli(proj) {
  // Prefer a locally-installed prisma CLI. If the model declared @prisma/client but forgot the
  // matching `prisma` devDependency, npx would otherwise fetch the LATEST prisma — currently a
  // broken 8.x release-candidate. Pin npx to the installed client's version so `generate` uses a
  // compatible, stable CLI. This is an environment/turnkey fix, not a change to conformance rules.
  if (fs.existsSync(path.join(proj, "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma"))) return "prisma";
  try {
    const v = JSON.parse(fs.readFileSync(path.join(proj, "node_modules", "@prisma", "client", "package.json"), "utf8")).version;
    if (v) return `prisma@${v}`;
  } catch {}
  return "prisma";
}
function migrate(proj, env) {
  resetDb();
  if (fs.existsSync(path.join(proj, "prisma", "schema.prisma"))) {
    const cli = prismaCli(proj);
    sh("npx", ["--yes", cli, "generate"], { cwd: proj, env, timeout: 180000 });
    const push = sh("npx", ["--yes", cli, "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"], { cwd: proj, env, timeout: 180000 });
    if (process.env.CR_DEBUG) console.error(`[mig] prisma(${cli}) push status=${push.status}`);
    if (push.status === 0) return "prisma";
    // prisma push failed (e.g. no migrate CLI wiring) — fall through to raw SQL / npm scripts below.
  }
  const scripts = pkgScripts(proj);
  const scriptNames = Object.keys(scripts).filter((n) => /^(db|prisma|migrat|schema)[:_-]?|migration/i.test(n) && !/(down|rollback|revert|undo|seed|studio|generate|status)/i.test(n));
  for (const name of scriptNames) {
    const r = sh("npm", ["run", name], { cwd: proj, env, timeout: 180000 });
    if (r.status === 0) return `npm:${name}`;
  }
  const sqlFiles = (resetDb(), discoverSqlMigrations(proj));
  if (process.env.CR_DEBUG) console.error(`[mig] sqlFiles=${JSON.stringify(sqlFiles)}`);
  const sqlApplied = applySqlFiles(sqlFiles);
  if (process.env.CR_DEBUG) console.error(`[mig] sqlApplied=${sqlApplied}`);
  if (sqlApplied) return sqlApplied;
  return null;
}
function serve(proj, entry, env) {
  killPort(PORT);
  if (entry) return spawn("npx", ["tsx", entry], { cwd: proj, env, shell: process.platform === "win32", detached: false, stdio: ["ignore", "ignore", "ignore"] });
  const scripts = pkgScripts(proj);
  const name = ["start", "dev", "serve"].find((n) => scripts[n]);
  if (name) return spawn("npm", ["run", name], { cwd: proj, env, shell: process.platform === "win32", detached: false, stdio: ["ignore", "ignore", "ignore"] });
  return null;
}

function runCell(slug, cond, rep) {
  const proj = path.join(RUNS, `${slug}__${cond}`, String(rep), "project");
  const files = fs.readdirSync(PROBE_DIR).filter((f) => f.endsWith(".hurl")).sort();
  const rec = { slug, cond, rep, served: false, oracle_pass: 0, oracle_total: files.length, business_pass: 0, business_total: BUSINESS.size, reason: "" };
  if (!fs.existsSync(proj)) { rec.reason = "no-project"; return rec; }
  const entry = detectEntry(proj);
  rec.entry = entry;

  const env = { ...process.env, DATABASE_URL: `postgresql://${DB.user}:${DB.pass}@127.0.0.1:${DB.port}/${DB.db}`,
    PORT: String(PORT), JWT_SECRET: "cr_secret_key_at_least_32_characters_long_padding", JWT_EXPIRY: "24h", JWT_EXPIRES_IN: "24h",
    JWT_EXPIRATION: "24h", JWT_EXPIRES: "24h", ACCESS_TOKEN_EXPIRY: "24h", NODE_ENV: "development" };

  if (!fs.existsSync(path.join(proj, "node_modules"))) {
    const inst = sh("npm", ["install", "--no-audit", "--no-fund"], { cwd: proj, env, timeout: 300000 });
    if (inst.status !== 0) { rec.reason = "npm-install-failed"; return rec; }
  }
  const migResult = migrate(proj, env);
  // A null result means no EXTERNAL migration mechanism was found. Many valid apps self-migrate on
  // boot (run their DDL at startup), so do not abort here — resetDb already gave a clean schema;
  // proceed to serve and let the oracle decide. Record the mechanism honestly.
  rec.migration = migResult || "self-or-none";

  const srv = serve(proj, entry, env);
  if (!srv) { rec.reason = migResult ? "no-entry" : "no-migration"; return rec; }
  const ready = waitReady(PORT);
  if (!ready) { rec.reason = migResult ? "no-serve" : "no-migration"; try { srv.kill(); } catch {} killPort(PORT); return rec; }
  rec.served = true;

  rec.per_file = {};
  for (let i = 0; i < files.length; i++) {
    const uid = `${Date.now()}${rep}${i}`;
    const h = sh(HURL, ["--test", "--jobs", "1", "--variable", `host=http://127.0.0.1:${PORT}`, "--variable", `uid=${uid}`, path.join(PROBE_DIR, files[i])], { timeout: 120000 });
    const out = (h.stdout || "") + (h.stderr || "");
    const passed = /Succeeded files:\s*1\b/i.test(out) || (h.status === 0 && /Failed files:\s*0\b/i.test(out));
    const name = files[i].replace(".hurl", "");
    if (passed) { rec.oracle_pass++; if (BUSINESS.has(name)) rec.business_pass++; }
    rec.per_file[name] = passed ? "pass" : "fail";
  }
  if (rec.oracle_pass < rec.oracle_total) rec.reason = rec.oracle_pass === 0 ? "oracle-0" : "oracle-partial";

  try { srv.kill(); } catch {}
  killPort(PORT);
  return rec;
}

function discover() {
  const cells = [];
  if (!fs.existsSync(RUNS)) return cells;
  for (const d of fs.readdirSync(RUNS)) {
    const m = d.match(/^(.+)__(naive|gs)$/); if (!m) continue;
    const base = path.join(RUNS, d);
    for (const rep of fs.readdirSync(base)) if (fs.existsSync(path.join(base, rep, "project"))) cells.push({ slug: m[1], cond: m[2], rep });
  }
  return cells;
}

(function main() {
  if (!ensureDb()) { console.error("DB not ready — aborting"); process.exit(1); }
  const outFile = path.join(__dirname, "conformance_cr.json");
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : [];
  const done = new Set(results.map((r) => `${r.slug}__${r.cond}/${r.rep}`));
  console.log("slug                 cond   rep  served  oracle  rules  reason");
  for (const { slug, cond, rep } of discover()) {
    const key = `${slug}__${cond}/${rep}`;
    if (filter && !key.includes(filter)) continue;
    if (done.has(key)) continue;
    const r = runCell(slug, cond, rep);
    results.push(r);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`${slug.padEnd(20)} ${cond.padEnd(6)} ${r.rep}    ${String(r.served).padEnd(6)}  ${r.oracle_pass}/${r.oracle_total}   ${r.business_pass}/${r.business_total}   ${r.reason || "PASS"}`);
  }
  const agg = {};
  for (const r of results) { (agg[`${r.slug}|${r.cond}`] = agg[`${r.slug}|${r.cond}`] || []).push(r); }
  console.log("\n=== conformance summary (mean oracle/6 · mean business-rule/3) ===");
  for (const k of Object.keys(agg).sort()) {
    const g = agg[k]; const served = g.filter((x) => x.served).length;
    const o = (g.reduce((a, x) => a + x.oracle_pass, 0) / g.length).toFixed(1);
    const b = (g.reduce((a, x) => a + x.business_pass, 0) / g.length).toFixed(1);
    console.log(`${k.padEnd(28)} served ${served}/${g.length} · oracle ${o}/6 · rules ${b}/3`);
  }
})();
