#!/usr/bin/env node
/**
 * conformance_ax2.cjs [filter]
 *
 * Behavioural conformance for the AX2 cross-vendor cells: does each generated project
 * actually RUN and answer the RealWorld API correctly? For each staged, installed cell
 * (runner/runs/<slug>__<cond>/<rep>/project) it: resets a shared Postgres schema, pushes
 * the project's prisma schema, serves the app, waits for readiness, runs the 13-file Hurl
 * oracle, and records served? + oracle_pass/13 + a REASON when it does not serve.
 *
 * The reason field is load-bearing: it separates "the code is broken" (served but oracle
 * fails) from "the harness could not configure this project" (no prisma schema, no
 * detectable entry, db push failed, never became ready) so the conformance number stays
 * honest. One server at a time, killed between cells (memory-safe).
 *
 * Coverage (optional, on passing cells): set AX2_COVERAGE=1 to also run `npx jest
 * --coverage` after a cell passes the oracle.
 *
 * Usage: node conformance_ax2.cjs [substring-filter]   e.g. `node conformance_ax2.cjs treatment`
 * Emits: conformance_ax2.json (all cells) + prints a per-vendor summary.
 */
const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const RUNS = path.join(__dirname, "runs");
const HURL = "/c/Program Files/Hurl/hurl.exe";
const HURL_DIR = path.resolve(__dirname, "..", "realworld-spec-lenient");
const PORT = 4137;
const DB = { name: "conduit-measure", port: 5544, db: "conduit_measure", user: "conduit", pass: "conduit" };
const filter = process.argv[2] || "";
const VENDORS = ["gpt-openai", "gemini-google", "claude-copilot"];
const CONDS = ["naive", "control", "treatment"];

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
function waitReady(p, ms = 45000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const r = sh("curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", `http://127.0.0.1:${p}/api/tags`], { timeout: 6000 });
    if (r.stdout && /^[2-5]\d\d$/.test(r.stdout.trim()) && r.stdout.trim() !== "000") return true;
    sh(process.platform === "win32" ? "cmd" : "sh", process.platform === "win32" ? ["/c", "timeout", "/t", "1", "/nobreak"] : ["-c", "sleep 1"], { timeout: 3000 });
  }
  return false;
}

function runCell(slug, cond, rep) {
  const proj = path.join(RUNS, `${slug}__${cond}`, String(rep), "project");
  const rec = { slug, cond, rep, served: false, oracle_pass: 0, oracle_total: 13, reason: "" };
  if (!fs.existsSync(proj)) { rec.reason = "no-project"; return rec; }
  const entry = detectEntry(proj);
  if (!entry) { rec.reason = "no-entry"; return rec; }
  rec.entry = entry;
  const hasPrisma = fs.existsSync(path.join(proj, "prisma", "schema.prisma"));
  if (!hasPrisma) { rec.reason = "no-prisma-schema"; return rec; }
  // JWT expiry MUST be a units-string ("24h"), not a bare number: apps pass it straight to
  // jsonwebtoken's expiresIn, and the `ms` library reads a unit-less "3600" as 3600 MILLIseconds
  // (~3.6s), so the token expires before the second request and auth fails in cascade (a harness
  // bug, not a code bug). Set every common env name to a long, unit-qualified value.
  const env = { ...process.env, DATABASE_URL: `postgresql://${DB.user}:${DB.pass}@127.0.0.1:${DB.port}/${DB.db}`,
    PORT: String(PORT), JWT_SECRET: "ax2_secret_key_at_least_32_characters_long_padding", JWT_EXPIRY: "24h", JWT_EXPIRES_IN: "24h",
    JWT_EXPIRATION: "24h", JWT_EXPIRES: "24h", ACCESS_TOKEN_EXPIRY: "24h", NODE_ENV: "development" };

  // fresh schema for this cell
  sh("npx", ["prisma", "generate"], { cwd: proj, env, timeout: 120000 });
  const push = sh("npx", ["prisma", "db", "push", "--force-reset", "--skip-generate", "--accept-data-loss"], { cwd: proj, env, timeout: 120000 });
  if (push.status !== 0) { rec.reason = "db-push-failed"; return rec; }

  // serve
  killPort(PORT);
  const srv = spawn("npx", ["tsx", entry], { cwd: proj, env, shell: process.platform === "win32", detached: false, stdio: ["ignore", "ignore", "ignore"] });
  const ready = waitReady(PORT);
  if (!ready) { rec.reason = "no-serve"; try { srv.kill(); } catch {} killPort(PORT); return rec; }
  rec.served = true;

  // oracle — run each file SEPARATELY with a unique uid (a shared uid collides on unique
  // email/username across files and sinks everything; a strict all-13-in-one is also brittle
  // because a single edge-case assert fails a whole file). Per-file with a fresh uid gives a
  // graded, fair "how many of the 13 feature areas fully conform" plus per-request granularity.
  const files = fs.readdirSync(HURL_DIR).filter((f) => f.endsWith(".hurl")).sort();
  rec.oracle_total = files.length;
  rec.per_file = {}; let reqOK = 0, reqTot = 0;
  for (let i = 0; i < files.length; i++) {
    const uid = `${Date.now()}${rep}${i}`;
    const h = sh(HURL, ["--test", "--jobs", "1", "--variable", `host=http://127.0.0.1:${PORT}`, "--variable", `uid=${uid}`, path.join(HURL_DIR, files[i])], { timeout: 120000 });
    const out = (h.stdout || "") + (h.stderr || "");
    const passed = /Succeeded files:\s*1\b/i.test(out) || (h.status === 0 && /Failed files:\s*0\b/i.test(out));
    if (passed) rec.oracle_pass++;
    rec.per_file[files[i].replace(".hurl", "")] = passed ? "pass" : "fail";
    const rq = out.match(/Executed requests:\s*(\d+)/i); const fr = out.match(/Failed files:\s*\d+/); // request-level best-effort
    if (rq) { reqTot += parseInt(rq[1], 10); if (passed) reqOK += parseInt(rq[1], 10); }
  }
  rec.req_seen = reqTot;
  if (rec.oracle_pass < rec.oracle_total) rec.reason = rec.oracle_pass === 0 ? "oracle-0" : "oracle-partial";

  if (process.env.AX2_COVERAGE === "1" && rec.oracle_pass === rec.oracle_total) {
    const cov = sh("npx", ["jest", "--coverage", "--coverageReporters=json-summary", "--ci", "--runInBand", "--forceExit"], { cwd: proj, env, timeout: 300000 });
    try { const s = JSON.parse(fs.readFileSync(path.join(proj, "coverage", "coverage-summary.json"), "utf8")); rec.coverage_pct = s.total?.statements?.pct ?? null; } catch { rec.coverage_pct = null; }
    rec.jest_ok = /Tests:.*\d+ passed/.test(cov.stdout + cov.stderr) && !/\bfailed\b/.test(cov.stdout + cov.stderr);
  }

  try { srv.kill(); } catch {}
  killPort(PORT);
  return rec;
}

(function main() {
  if (!ensureDb()) { console.error("DB not ready — aborting"); process.exit(1); }
  const results = [];
  const outFile = path.join(__dirname, "conformance_ax2.json");
  if (fs.existsSync(outFile)) { try { results.push(...JSON.parse(fs.readFileSync(outFile, "utf8"))); } catch {} }
  const done = new Set(results.map((r) => `${r.slug}__${r.cond}/${r.rep}`));
  console.log("slug            cond        rep  served  oracle  reason");
  for (const slug of VENDORS) for (const cond of CONDS) for (let rep = 0; rep < 5; rep++) {
    const key = `${slug}__${cond}/${rep}`;
    if (filter && !key.includes(filter)) continue;
    if (done.has(key)) continue;
    const r = runCell(slug, cond, rep);
    results.push(r);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`${slug.padEnd(15)} ${cond.padEnd(10)} ${r.rep}    ${String(r.served).padEnd(6)}  ${r.oracle_pass}/13   ${r.reason || "PASS"}`);
  }
  // summary
  const agg = {};
  for (const r of results) { const k = `${r.slug}|${r.cond}`; (agg[k] = agg[k] || []).push(r); }
  console.log("\n=== conformance summary (served & full-pass / n) ===");
  for (const k of Object.keys(agg).sort()) {
    const g = agg[k]; const served = g.filter((x) => x.served).length; const full = g.filter((x) => x.oracle_pass === 13).length;
    const avg = (g.reduce((a, x) => a + x.oracle_pass, 0) / g.length).toFixed(1);
    console.log(`${k.padEnd(28)} served ${served}/${g.length} · full-pass ${full}/${g.length} · mean oracle ${avg}/13`);
  }
})();
