#!/usr/bin/env node
/**
 * feature_recovery_ax2.cjs [filter]
 *
 * The LIFECYCLE metric: what does it cost to add a feature to each generated codebase?
 * This is the honest other half of "GS costs more to generate" — if the disciplined
 * codebases are cheaper to CHANGE, the generation premium is paid back in maintenance.
 *
 * Fixed task, identical for all cells: add `GET /api/tags/popular` (top-10 tags by article
 * count). A structure-sensitive feature (touches data access + a route) with no schema
 * migration, so the cost difference reflects how navigable/extensible the code is — which is
 * exactly the variable we want. The executor is a fixed model (claude-sonnet-4-5) with tools
 * enabled, so the only thing that varies is the codebase it is editing.
 *
 * Per staged cell: snapshot src, run `claude -p` (agentic, edits files), parse the stream
 * for cost/tokens/read-breadth/edits (reuses ../../sx/sx_metric.cjs), tsc --noEmit (did it
 * stay compilable?), then RESTORE src (each cell measured pristine, no permanent change).
 * Sequential, one session at a time (memory-safe). Resumable.
 *
 * Emits feature_recovery_ax2.json + a per-vendor x condition summary.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const RUNS = path.join(__dirname, "runs");
const METRIC = path.resolve(__dirname, "..", "..", "sx", "sx_metric.cjs");
const MODEL = "claude-sonnet-4-5";
const VENDORS = ["gpt-openai", "gemini-google", "claude-copilot"];
const CONDS = ["naive", "control", "treatment"];
const filter = process.argv[2] || "";
const OUT = path.join(__dirname, "feature_recovery_runs");
fs.mkdirSync(OUT, { recursive: true });

const PROMPT = [
  "Add a new endpoint to this RealWorld/Conduit backend: GET /api/tags/popular.",
  'It must return the ten most-used tags across all articles, most-used first, as JSON shaped exactly:',
  '{ "tags": [ { "name": "<tag>", "count": <number of articles that have that tag> } ] }.',
  "Follow the existing architecture, patterns, naming and conventions of THIS codebase.",
  "Register the route so it is actually reachable. Do not change unrelated behaviour.",
  "Keep it minimal and correct. When done, list the files you changed.",
].join(" ");

const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", timeout: opts.timeout || 120000, maxBuffer: 256 * 1024 * 1024, shell: process.platform === "win32", ...opts });

function runCell(slug, cond, rep) {
  const proj = path.join(RUNS, `${slug}__${cond}`, String(rep), "project");
  const rec = { slug, cond, rep };
  if (!fs.existsSync(path.join(proj, "src"))) { rec.note = "no-src"; return rec; }
  const bak = path.join(proj, ".srcbak_feat");
  const raw = path.join(OUT, `${slug}__${cond}_${rep}.raw`);
  // snapshot src
  fs.rmSync(bak, { recursive: true, force: true });
  fs.cpSync(path.join(proj, "src"), bak, { recursive: true });
  try {
    // run the agentic modification (tools enabled so it reads + edits)
    const r = spawnSync("claude", ["-p", "--output-format", "stream-json", "--verbose",
      "--dangerously-skip-permissions", "--model", MODEL],
      { cwd: proj, input: PROMPT, encoding: "utf8", timeout: 600000, maxBuffer: 256 * 1024 * 1024, shell: process.platform === "win32" });
    fs.writeFileSync(raw, r.stdout || "");
    // parse metrics
    const m = sh("node", [METRIC, raw], { timeout: 60000 });
    let met = {}; try { met = JSON.parse(m.stdout); } catch {}
    rec.total_tokens = met.total_tokens ?? null;
    rec.read_breadth = met.total_read_breadth ?? null;
    rec.localization_tokens = met.localization_tokens ?? null;
    rec.localization_read_breadth = met.localization_read_breadth ?? null;
    rec.writes = met.writes ?? null;
    rec.turns = met.turns ?? null;
    rec.cost_usd = met.total_cost_usd ?? null;
    // did it stay compilable?
    const tsc = sh("npx", ["tsc", "--noEmit"], { cwd: proj, timeout: 180000 });
    rec.tsc_errors = ((tsc.stdout || "") + (tsc.stderr || "")).match(/error TS\d+/g)?.length ?? 0;
    // did it add the route? (cheap textual check, best-effort)
    let hasRoute = false;
    const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (/node_modules|\.git|dist/.test(e.name)) continue; const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (/\.ts$/.test(f) && /tags\/popular|['"`]popular['"`]/.test(fs.readFileSync(f, "utf8"))) hasRoute = true; } };
    try { walk(path.join(proj, "src")); } catch {}
    rec.route_added = hasRoute;
  } finally {
    // restore src
    fs.rmSync(path.join(proj, "src"), { recursive: true, force: true });
    fs.renameSync(bak, path.join(proj, "src"));
  }
  return rec;
}

(function main() {
  const outFile = path.join(__dirname, "feature_recovery_ax2.json");
  const results = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, "utf8")) : [];
  const done = new Set(results.map((r) => `${r.slug}__${r.cond}/${r.rep}`));
  console.log("slug            cond        rep  tokens  read  edits turns  cost   tsc route");
  for (const slug of VENDORS) for (const cond of CONDS) for (let rep = 0; rep < 5; rep++) {
    const key = `${slug}__${cond}/${rep}`;
    if (filter && !key.includes(filter)) continue;
    if (done.has(key)) continue;
    const r = runCell(slug, cond, rep); results.push(r);
    fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
    console.log(`${slug.padEnd(15)} ${cond.padEnd(10)} ${r.rep}  ${String(r.total_tokens ?? "-").padStart(6)}  ${String(r.read_breadth ?? "-").padStart(4)}  ${String(r.writes ?? "-").padStart(4)} ${String(r.turns ?? "-").padStart(4)}  ${String(r.cost_usd ?? "-").padStart(5)}  ${String(r.tsc_errors ?? "-").padStart(3)} ${r.route_added ? "yes" : "no"}`);
  }
  const agg = {};
  for (const r of results) { (agg[`${r.slug}|${r.cond}`] = agg[`${r.slug}|${r.cond}`] || []).push(r); }
  const m = (g, f) => { const v = g.map(f).filter((x) => x != null && !isNaN(x)); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(0) : "-"; };
  const m2 = (g, f) => { const v = g.map(f).filter((x) => x != null && !isNaN(x)); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "-"; };
  console.log("\n=== RECOVERY summary (mean over reps) — cost to add the same feature ===");
  console.log("vendor | condition   n  tokens  read-breadth  edits  cost$  route-added");
  for (const k of Object.keys(agg).sort()) {
    const g = agg[k]; const ra = g.filter((x) => x.route_added).length;
    console.log(`${k.padEnd(28)} ${g.length}  ${m(g, (x) => x.total_tokens).padStart(6)}  ${m2(g, (x) => x.read_breadth).padStart(6)}       ${m2(g, (x) => x.writes).padStart(4)}  ${m2(g, (x) => x.cost_usd).padStart(5)}  ${ra}/${g.length}`);
  }
})();
