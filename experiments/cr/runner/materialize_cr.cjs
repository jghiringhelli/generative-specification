/**
 * CR runner — materialize_cr.cjs
 *
 * VERBATIM copy of ../../ax/runner/materialize2.cjs (the JC-approved dual-report
 * materializer: strict in-fence emit discipline UNION pre-line dialect), retargeted only by
 * living in cr/runner/ so its `__dirname/runs` resolves to cr/runner/runs. Kept as a copy
 * (not a require) so the CR experiment folder is self-contained for the pull-and-run workflow.
 *
 * Usage: node materialize_cr.cjs <condition-dir> <rep>   e.g. node materialize_cr.cjs qwen25coder7b__naive 0
 * Emits: runs/<cond>/<rep>/project/ + materialize_cr-report.json
 */
const fs = require("fs");
const path = require("path");

const condition = process.argv[2];
const rep = process.argv[3];
if (!condition || !rep) { console.error("usage: node materialize_cr.cjs <condition-dir> <rep>"); process.exit(1); }

const repDir = path.join(__dirname, "runs", condition, String(rep));
const projDir = path.join(repDir, "project");
if (!fs.existsSync(repDir)) { console.error(`no rep dir: ${repDir}`); process.exit(1); }
fs.rmSync(projDir, { recursive: true, force: true });
fs.mkdirSync(projDir, { recursive: true });

const IN_FENCE = /^\s*(?:\/\/|#|--|<!--|\/\*)\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\([^)]*\))?\s*(?:-->|\*\/)?\s*$/;
const IN_FENCE2 = /^\s*(?:File:|path:)\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\([^)]*\))?\s*$/i;
const PRE_LINE = /^\s*(?:\*\*|`|__)?\s*(?:\/\/|#|--|\/\*)?\s*(?:File:|path:)?\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\*\/)?\s*(?:`|\*\*|__)?\s*:?\s*$/i;

function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  if (!p.startsWith(path.normalize(base))) return null;
  return p;
}
function extractPairs(md) {
  const lines = md.split(/\r?\n/);
  const pairs = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*```/.test(lines[i])) {
      let p = i - 1;
      while (p >= 0 && lines[p].trim() === "") p--;
      const pre = p >= 0 ? lines[p] : "";
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { body.push(lines[i]); i++; }
      i++;
      pairs.push({ pre, body });
    } else i++;
  }
  return pairs;
}

const responses = fs.readdirSync(repDir).filter((f) => /^response-P\d+\.md$/.test(f))
  .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));

let inFence = 0, preLine = 0, none = 0;
const written = new Set();
const via = {};

for (const rf of responses) {
  const md = fs.readFileSync(path.join(repDir, rf), "utf-8");
  for (const { pre, body } of extractPairs(md)) {
    const bodyLines = body;
    const first = bodyLines[0] || "";
    let rel = null, kind = null;
    const mm = first.match(IN_FENCE) || first.match(IN_FENCE2);
    if (mm) { rel = mm[1]; kind = "in_fence"; }
    else {
      const pm = pre.match(PRE_LINE);
      if (pm && /\.[A-Za-z0-9]+$/.test(pm[1]) && !/\s/.test(pm[1])) { rel = pm[1]; kind = "pre_line"; }
    }
    if (!rel) { none++; continue; }
    const dest = safeJoin(projDir, rel);
    if (!dest) { none++; continue; }
    const codeLines = kind === "in_fence" ? bodyLines.slice(1) : bodyLines;
    const out = codeLines.join("\n").replace(/^\n/, "");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, out.endsWith("\n") ? out : out + "\n");
    if (!written.has(rel)) via[rel] = kind;
    written.add(rel);
    if (kind === "in_fence") inFence++; else preLine++;
  }
}

const report = { condition, rep: String(rep), responses: responses.length,
  in_fence: inFence, pre_line: preLine, none,
  strict_materializable: inFence, union_materialized: inFence + preLine,
  unique_files: written.size, files: [...written].sort(), via };
fs.writeFileSync(path.join(repDir, "materialize_cr-report.json"), JSON.stringify(report, null, 2));
console.log(`[${condition}/${rep}] in_fence=${inFence} pre_line=${preLine} none=${none} -> ${written.size} files`);
