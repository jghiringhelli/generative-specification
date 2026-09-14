/**
 * AX runner — orchestrate.cjs  (module 6 of 6)
 * Runs the full pipeline (generate -> materialize -> measure -> audit x2) for
 * each condition x k replications, resumable (skips completed steps), logging
 * progress. Survives session resets: re-run and it continues where it left off.
 *
 * Usage:
 *   node orchestrate.cjs --k 10 --conditions naive,control,treatment [--mutation]
 *   node orchestrate.cjs --one          # single naive rep, full pipeline (smoke)
 *
 * Ablation ladder (once the rung contexts/prompts are authored):
 *   --conditions L0,L1,L2,L3,L4,L5
 */
const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
const has = (name) => argv.includes(name);

const one = has("--one");
const k = one ? 1 : parseInt(opt("--k", "10"), 10);
const conditions = one ? ["naive"] : opt("--conditions", "naive,control,treatment").split(",");
const mutation = has("--mutation");
const R = __dirname;
const logFile = path.join(R, "orchestrate.log");
const log = (m) => { const line = `[${new Date().toISOString().slice(11, 19)}] ${m}`; console.log(line); fs.appendFileSync(logFile, line + "\n"); };

function step(name, script, args) {
  const r = spawnSync("node", [path.join(R, script), ...args], { stdio: "inherit", shell: false });
  if (r.status !== 0) { log(`  ! ${name} exit ${r.status}`); return false; }
  return true;
}

const exists = (c, rep, f) => fs.existsSync(path.join(R, "runs", c, String(rep), f));

log(`START k=${k} conditions=${conditions.join(",")} mutation=${mutation}${one ? " (SMOKE --one)" : ""}`);
let done = 0, failed = 0;
for (const c of conditions) {
  for (let rep = 0; rep < k; rep++) {
    const tag = `${c}/${rep}`;
    // 1. generate (skip if meta.json exists)
    if (!exists(c, rep, "meta.json")) { log(`gen ${tag}`); if (!step("generate", "generate.cjs", [c, String(rep)])) { failed++; continue; } }
    // 2. materialize (always re-derivable; skip if project + report exist)
    if (!exists(c, rep, "materialize-report.json")) { log(`mat ${tag}`); if (!step("materialize", "materialize.cjs", [c, String(rep)])) { failed++; continue; } }
    // 3. measure (skip if metrics.json exists)
    if (!exists(c, rep, "metrics.json")) { log(`msr ${tag}`); if (!step("measure", "measure.cjs", [c, String(rep), ...(mutation ? ["--mutation"] : [])])) { failed++; continue; } }
    // 4. audit x2
    for (const a of ["1", "2"]) if (!exists(c, rep, `audit-${a}.json`)) { log(`aud ${tag} #${a}`); step("audit", "audit.cjs", [c, String(rep), "--auditor", a]); }
    done++;
    log(`ok ${tag}`);
  }
}
log(`DONE ${done} reps, ${failed} failed. Aggregating...`);
step("aggregate", "aggregate.cjs", []);
log(`ALL COMPLETE. See results.csv`);
