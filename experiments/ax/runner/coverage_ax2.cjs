#!/usr/bin/env node
/**
 * coverage_ax2.cjs — oracle-independent quality signal for the AX2 cross-vendor cells.
 *
 * The strict Hurl oracle measures REST-convention conformance (201 vs 200, 204 on delete,
 * null-clearing), not functional correctness, so it is the wrong instrument for scoring
 * independently-generated apps. Each app's OWN test suite, on the other hand, is a fair,
 * tool-computed quality metric: how much of the code the generated tests actually exercise.
 *
 * For each staged, installed cell (runs/<slug>__<cond>/<rep>/project): reset the shared
 * Postgres schema, run `jest --coverage`, and record statements/branches/functions/lines %
 * plus tests passed. No server needed (jest spins its own). Sequential, resumable.
 *
 * Emits coverage_ax2.json + a per-vendor x condition summary.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RUNS = path.join(__dirname, "runs");
const DB = { name: "conduit-measure", port: 5544, db: "conduit_measure", user: "conduit", pass: "conduit" };
const VENDORS = ["gpt-openai", "gemini-google", "claude-copilot"];
const CONDS = ["naive", "control", "treatment"];
const filter = process.argv[2] || "";
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", timeout: opts.timeout || 300000, shell: process.platform === "win32", ...opts });

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

function runCell(slug, cond, rep) {
  const proj = path.join(RUNS, `${slug}__${cond}`, String(rep), "project");
  const rec = { slug, cond, rep, statements: null, branches: null, functions: null, lines: null, tests: null, note: "" };
  if (!fs.existsSync(proj)) { rec.note = "no-project"; return rec; }
  const env = { ...process.env, DATABASE_URL: `postgresql://${DB.user}:${DB.pass}@127.0.0.1:${DB.port}/${DB.db}`,
    JWT_SECRET: "ax2_secret_key_at_least_32_characters_long_padding", JWT_EXPIRY: "24h", JWT_EXPIRES_IN: "24h",
    JWT_EXPIRATION: "24h", ACCESS_TOKEN_EXPIRY: "24h", NODE_ENV: "test", CI: "true" };
  if (fs.existsSync(path.join(proj, "prisma", "schema.prisma"))) {
    sh("npx", ["prisma", "generate"], { cwd: proj, env, timeout: 120000 });
    sh("npx", ["prisma", "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"], { cwd: proj, env, timeout: 120000 });
  }
  try { fs.rmSync(path.join(proj, "coverage"), { recursive: true, force: true }); } catch {}
  const r = sh("npx", ["jest", "--coverage", "--coverageReporters=json-summary", "--ci", "--runInBand", "--forceExit", "--passWithNoTests"], { cwd: proj, env, timeout: 300000 });
  const out = (r.stdout || "") + (r.stderr || "");
  const tm = out.match(/Tests:\s+(\d+) passed/); rec.tests = tm ? parseInt(tm[1], 10) : (/No tests found/.test(out) ? 0 : null);
  try {
    const s = JSON.parse(fs.readFileSync(path.join(proj, "coverage", "coverage-summary.json"), "utf8")).total;
    rec.statements = s.statements?.pct ?? null; rec.branches = s.branches?.pct ?? null;
    rec.functions = s.functions?.pct ?? null; rec.lines = s.lines?.pct ?? null;
  } catch { rec.note = rec.tests === 0 ? "no-tests" : "no-coverage-summary"; }
  return rec;
}

(function main() {
  if (!ensureDb()) { console.error("DB not ready"); process.exit(1); }
  const outFile = path.join(__dirname, "coverage_ax2.json");
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : [];
  const done = new Set(results.map((r) => `${r.slug}__${r.cond}/${r.rep}`));
  console.log("slug            cond        rep  stmts  branch  funcs  tests  note");
  for (const slug of VENDORS) for (const cond of CONDS) for (let rep = 0; rep < 5; rep++) {
    const key = `${slug}__${cond}/${rep}`;
    if (filter && !key.includes(filter)) continue;
    if (done.has(key)) continue;
    const r = runCell(slug, cond, rep); results.push(r);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`${slug.padEnd(15)} ${cond.padEnd(10)} ${r.rep}    ${String(r.statements ?? "-").padStart(5)}  ${String(r.branches ?? "-").padStart(6)}  ${String(r.functions ?? "-").padStart(5)}  ${String(r.tests ?? "-").padStart(5)}  ${r.note}`);
  }
  const agg = {};
  for (const r of results) { (agg[`${r.slug}|${r.cond}`] = agg[`${r.slug}|${r.cond}`] || []).push(r); }
  const mean = (g, c) => { const v = g.map((x) => x[c]).filter((x) => x != null); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "-"; };
  console.log("\n=== coverage summary (mean over reps) ===");
  console.log("vendor | condition   n  stmts%  branch%  funcs%  mean-tests");
  for (const k of Object.keys(agg).sort()) {
    const g = agg[k];
    console.log(`${k.padEnd(28)} ${g.length}  ${mean(g, "statements").padStart(5)}  ${mean(g, "branches").padStart(6)}  ${mean(g, "functions").padStart(5)}  ${mean(g, "tests").padStart(5)}`);
  }
})();
