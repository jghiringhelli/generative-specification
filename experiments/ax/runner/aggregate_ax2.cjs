/**
 * AX2 aggregator — join meta + materialize2 + metrics for every runs/<slug>__<cond>/<rep>
 * into one tidy CSV with a MODEL column, so RQ3 (does the C3-vs-C1 quality gap widen
 * as capability falls) can be computed across tiers. One row per rep.
 */
const fs = require("fs");
const path = require("path");
const RUNS = path.join(__dirname, "runs");

const rows = [];
for (const dir of fs.readdirSync(RUNS)) {
  const m = dir.match(/^(.+)__(naive|control|treatment)$/);
  if (!m) continue;
  const [, slug, cond] = m;
  const condDir = path.join(RUNS, dir);
  for (const rep of fs.readdirSync(condDir)) {
    if (!/^\d+$/.test(rep)) continue;
    const rd = path.join(condDir, rep);
    const rj = (f) => { try { return JSON.parse(fs.readFileSync(path.join(rd, f), "utf-8")); } catch { return null; } };
    const meta = rj("meta.json"); const mat = rj("materialize2-report.json"); const met = rj("metrics.json");
    if (!met && !mat) continue;
    rows.push({
      model: slug, condition: cond, rep,
      vendor: meta?.vendor || (slug.startsWith("claude") ? "anthropic" : "?"),
      strict_files: mat?.strict_materializable ?? "",
      union_files: mat?.union_materialized ?? "",
      unique_files: mat?.unique_files ?? "",
      ts_files: met?.files?.ts ?? "",
      test_files: met?.files?.test ?? "",
      has_package: met?.files?.has_package ?? "",
      tsc_errors: met?.tsc?.errors ?? "",
      eslint: met?.eslint?.problems ?? "",
      cves: met?.npm_audit?.cves ?? "",
      layer_violations: met?.layer_violations?.count ?? "",
      layer_per_ts: (met?.layer_violations?.count != null && met?.files?.ts) ? +(met.layer_violations.count / met.files.ts).toFixed(3) : "",
      coverage_pct: met?.coverage?.statements_pct ?? "",
      tokens_out: meta?.eval_count ?? "",
      cost_usd: meta?.total_cost_usd ?? "",
    });
  }
}
const cols = ["model","vendor","condition","rep","strict_files","union_files","unique_files","ts_files","test_files","has_package","tsc_errors","eslint","cves","layer_violations","layer_per_ts","coverage_pct","tokens_out","cost_usd"];
const csv = [cols.join(",")].concat(rows.map((r) => cols.map((c) => r[c]).join(","))).join("\n");
fs.writeFileSync(path.join(__dirname, "results_ax2.csv"), csv);
console.log(`results_ax2.csv: ${rows.length} rows across ${new Set(rows.map((r) => r.model)).size} models`);
// quick RQ3 view: mean layer_per_ts and strict_files by (model, condition)
const key = (r) => `${r.model} | ${r.condition}`;
const agg = {};
for (const r of rows) { (agg[key(r)] ||= []).push(r); }
console.log("\nmodel | condition | n | mean strict_files | mean union_files | mean layer/ts | mean eslint");
for (const k of Object.keys(agg).sort()) {
  const g = agg[k]; const n = g.length;
  const mean = (f) => { const v = g.map(f).filter((x) => x !== "" && x != null && !isNaN(x)).map(Number); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : "-"; };
  console.log(`${k} | ${n} | ${mean((r) => r.strict_files)} | ${mean((r) => r.union_files)} | ${mean((r) => r.layer_per_ts)} | ${mean((r) => r.eslint)}`);
}
