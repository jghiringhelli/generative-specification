#!/usr/bin/env node
// agg_bx.cjs <runsDir> <task>  — median + raw distributions per twin for each metric
const fs = require("fs"), path = require("path");
const [, , dir, task] = process.argv;
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
const load = (twin) => fs.readdirSync(dir)
  .filter((f) => f.startsWith(`${twin}_${task}_`) && f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
const M = load("M"), D = load("D");
console.log(`n: M=${M.length} D=${D.length}  (task=${task})`);
console.log(`${"metric".padEnd(14)} ${"M median".padEnd(10)} M raw${" ".repeat(18)} D median  D raw`);
for (const m of ["read_breadth", "num_searches", "num_reads", "turns", "out_tokens", "cost"]) {
  const mv = M.map((o) => o[m]), dv = D.map((o) => o[m]);
  const r = (x) => (typeof x === "number" ? (x < 1 ? x.toFixed(4) : x) : x);
  console.log(`${m.padEnd(14)} ${String(r(med(mv))).padEnd(10)} [${mv.map(r).join(",")}]`.padEnd(46) + ` ${String(r(med(dv))).padEnd(9)} [${dv.map(r).join(",")}]`);
}
const errM = M.filter((o) => o.is_error).length, errD = D.filter((o) => o.is_error).length;
if (errM || errD) console.log(`errors: M=${errM} D=${errD}`);
