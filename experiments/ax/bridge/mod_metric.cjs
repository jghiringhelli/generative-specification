#!/usr/bin/env node
// mod_metric.cjs <outJson> <rawPath> <twin> <rep> <netLines> <tscOk> <wired>
// Parses a modification run's stream-json for read-breadth/writes/cost, computes success + cost-per-line.
const fs = require("fs");
const [, , outJson, rawPath, twin, rep, net, tsc, wired] = process.argv;
const raw = fs.readFileSync(rawPath, "utf8");
const reads = new Set(); let writes = 0, turns = null, cost = null, out = null;
for (const ln of raw.split("\n")) {
  if (!ln.trim()) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  if (o.type === "assistant" && o.message && Array.isArray(o.message.content)) {
    for (const c of o.message.content) {
      if (c.type !== "tool_use") continue;
      if (c.name === "Read" && c.input && c.input.file_path) reads.add(String(c.input.file_path).toLowerCase());
      if (["Write", "Edit", "MultiEdit"].includes(c.name)) writes++;
    }
  } else if (o.type === "result") { turns = o.num_turns; cost = o.total_cost_usd; out = (o.usage || {}).output_tokens; }
}
const N = +net, TSC = +tsc, WIRED = +wired, success = TSC === 1 && WIRED === 1;
const cpl = (success && N > 0) ? cost / N : null;
const r = { twin, rep: +rep, net_lines: N, tsc: TSC, wired: WIRED, success, cost, cost_per_line: cpl, read_breadth: reads.size, writes, turns, out_tokens: out };
fs.writeFileSync(outJson, JSON.stringify(r, null, 2));
console.log(`${twin} rep${rep} net=${N} tsc=${TSC} wired=${WIRED} success=${success} cost=${cost} cpl=${cpl ? cpl.toFixed(5) : "-"} rb=${reads.size} writes=${writes}`);
