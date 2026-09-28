#!/usr/bin/env node
// mod_agg.cjs <runsDir>
const fs = require("fs"), path = require("path");
const dir = process.argv[2];
const med = (a) => { const s = a.filter((x) => x != null).sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
for (const t of ["M", "D"]) {
  const a = fs.readdirSync(dir)
    .filter((f) => f.startsWith(`mod_${t}_`) && f.endsWith(".json") && !f.endsWith(".metrics.json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  const succ = a.filter((x) => x.success).length;
  const cpl = med(a.map((x) => x.cost_per_line));
  console.log(`${t}: n=${a.length} success=${succ}/${a.length} | cost/line med=${cpl != null ? cpl.toFixed(5) : "-"} | net_lines med=${med(a.map((x) => x.net_lines))} | cost med=${med(a.map((x) => x.cost))} | read_breadth med=${med(a.map((x) => x.read_breadth))} | writes med=${med(a.map((x) => x.writes))}`);
  console.log(`   cpl raw=${JSON.stringify(a.map((x) => x.cost_per_line == null ? null : +x.cost_per_line.toFixed(5)))}  net raw=${JSON.stringify(a.map((x) => x.net_lines))}  rb raw=${JSON.stringify(a.map((x) => x.read_breadth))}  cost raw=${JSON.stringify(a.map((x) => x.cost))}`);
}
