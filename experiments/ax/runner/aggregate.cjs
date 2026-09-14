/**
 * AX runner — aggregate.cjs  (module 5 of 6)
 * Joins every rep's meta.json + metrics.json + audit-*.json into one tidy CSV
 * (one row per rep) — the analysis input for Protocol B statistics.
 *
 * Usage: node aggregate.cjs   ->  writes results.csv + results.json
 */
const fs = require("fs");
const path = require("path");

const runsDir = path.join(__dirname, "runs");
if (!fs.existsSync(runsDir)) { console.error("no runs/ dir"); process.exit(1); }

const cols = ["condition", "rep", "session_id", "total_cost_usd", "total_turns",
  "tsc_errors", "eslint_problems", "cves", "layer_violations",
  "coverage_pct", "coverage_passed", "mutation_score",
  "audit1_total", "audit2_total", "files_count", "ts_files", "test_files"];
const rows = [];
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf-8")); } catch { return null; } };

for (const condition of fs.readdirSync(runsDir)) {
  const cdir = path.join(runsDir, condition);
  if (!fs.statSync(cdir).isDirectory()) continue;
  for (const rep of fs.readdirSync(cdir)) {
    const rdir = path.join(cdir, rep);
    if (!fs.statSync(rdir).isDirectory()) continue;
    const meta = readJson(path.join(rdir, "meta.json"));
    const met = readJson(path.join(rdir, "metrics.json"));
    const a1 = readJson(path.join(rdir, "audit-1.json"));
    const a2 = readJson(path.join(rdir, "audit-2.json"));
    if (!meta && !met) continue;
    rows.push({
      condition, rep,
      session_id: meta?.session_id || "",
      total_cost_usd: (meta?.total_cost_usd ?? "") + (met?.coverage ? 0 : 0),
      total_turns: meta?.total_turns ?? "",
      tsc_errors: met?.tsc?.errors ?? "",
      eslint_problems: met?.eslint?.problems ?? "",
      cves: met?.npm_audit?.cves ?? "",
      layer_violations: met?.layer_violations?.count ?? "",
      coverage_pct: met?.coverage?.statements_pct ?? "",
      coverage_passed: met?.coverage?.passed ?? "",
      mutation_score: met?.mutation?.score ?? "",
      audit1_total: a1?.total ?? "",
      audit2_total: a2?.total ?? "",
      files_count: met?.files?.count ?? "",
      ts_files: met?.files?.ts ?? "",
      test_files: met?.files?.test ?? "",
    });
  }
}

rows.sort((a, b) => a.condition.localeCompare(b.condition) || (+a.rep) - (+b.rep));
const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => {
  const v = r[c]; return typeof v === "string" && v.includes(",") ? `"${v}"` : v; }).join(","))).join("\n");
fs.writeFileSync(path.join(__dirname, "results.csv"), csv);
fs.writeFileSync(path.join(__dirname, "results.json"), JSON.stringify(rows, null, 2));
console.log(`aggregated ${rows.length} reps -> results.csv`);
console.table(rows.map((r) => ({ cond: r.condition, rep: r.rep, tsc: r.tsc_errors, eslint: r.eslint_problems, layer: r.layer_violations, cov: r.coverage_pct, audit: r.audit1_total, $: r.total_cost_usd })));
