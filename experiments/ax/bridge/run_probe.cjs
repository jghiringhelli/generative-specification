#!/usr/bin/env node
/*
 * run_probe.cjs <twinDir> <promptFile> <outJson>
 * Runs ONE stateless `claude -p` probe inside <twinDir>, streaming stream-json so we can
 * parse the agent's TOOL CALLS and measure READ-BREADTH (distinct files it actually opened)
 * plus search effort and token/turn cost. Read-breadth (targeted vs whole-tree sweep) is the
 * real bridge-test DV; aggregate tokens alone were confounded by D's larger total surface.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const [, , twinDir, promptFile, outJson] = process.argv;
if (!twinDir || !promptFile || !outJson) { console.error("usage: run_probe.cjs <twinDir> <promptFile> <outJson>"); process.exit(2); }
const prompt = fs.readFileSync(promptFile, "utf8");

const args = ["-p", "--output-format", "stream-json", "--verbose",
              "--dangerously-skip-permissions", "--model", "claude-sonnet-4-5"];
const res = spawnSync("claude", args, {
  cwd: twinDir, input: prompt, encoding: "utf8",
  maxBuffer: 1024 * 1024 * 128, shell: process.platform === "win32",
});
const raw = res.stdout || "";
try { fs.writeFileSync(outJson.replace(/\.json$/, ".raw.jsonl"), raw); } catch (e) {}

const readFiles = new Set();     // distinct files opened via Read
const bashReadFiles = new Set(); // files cat/head/tail'd via Bash
let numReads = 0, numSearches = 0, numBash = 0, numTools = 0;
const toolSeq = [];
let result = null, usage = null, turns = null, cost = null, isError = null;

const fileFromBash = (cmd) => {
  const m = cmd.match(/\b(?:cat|head|tail|less|bat)\b\s+(?:-\S+\s+)*([^\s|;&>]+)/);
  const f = m ? m[1] : null;
  return (f && /[./\\]/.test(f) && !f.startsWith("-")) ? f : null; // path-like, not a flag
};
for (const ln of raw.split("\n")) {
  if (!ln.trim()) continue;
  let o; try { o = JSON.parse(ln); } catch (e) { continue; }
  if (o.type === "assistant" && o.message && Array.isArray(o.message.content)) {
    for (const c of o.message.content) {
      if (c.type !== "tool_use") continue;
      numTools++; toolSeq.push(c.name);
      const inp = c.input || {};
      if (c.name === "Read" && inp.file_path) { readFiles.add(String(inp.file_path).toLowerCase()); numReads++; }
      else if (c.name === "Grep" || c.name === "Glob") { numSearches++; }
      else if (c.name === "Bash") {
        numBash++; const cmd = String(inp.command || "");
        if (/\b(grep|rg|find|ls)\b/.test(cmd)) numSearches++;
        const f = fileFromBash(cmd); if (f) bashReadFiles.add(f.toLowerCase());
      }
    }
  } else if (o.type === "result") {
    result = o.result; usage = o.usage || {}; turns = o.num_turns;
    cost = o.total_cost_usd; isError = o.is_error;
  }
}
const allRead = new Set([...readFiles, ...bashReadFiles]);
const out = {
  twin: require("path").basename(twinDir),
  read_breadth: allRead.size,
  files_opened: [...allRead],
  num_reads: numReads, num_searches: numSearches, num_bash: numBash,
  num_tool_calls: numTools, turns,
  in_tokens: usage && usage.input_tokens, out_tokens: usage && usage.output_tokens,
  cache_read: usage && usage.cache_read_input_tokens, cost, is_error: isError,
  tool_seq: toolSeq, result: (result || "").slice(0, 1000),
};
fs.writeFileSync(outJson, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ twin: out.twin, read_breadth: out.read_breadth, num_reads: numReads,
  num_searches: numSearches, turns, out_tokens: out.out_tokens, cost, err: isError }));
