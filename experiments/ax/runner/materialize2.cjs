/**
 * AX2 runner — materialize2.cjs  (dual-report materializer; JC-approved Sept 2026)
 *
 * The AX2 cross-model comparison needs to separate TWO things the original
 * materialize.cjs conflated for weak models:
 *   (1) EMIT DISCIPLINE — did the model follow the instruction to put a path
 *       header comment on the FIRST LINE INSIDE the fence (`// src/x.ts`)? This
 *       is the strict rule; it is the AX emit-discipline signal, preserved.
 *   (2) CODE QUALITY — regardless of annotation dialect, what code did the model
 *       produce? Weak models (e.g. llama) name the file as `**src/x.ts**` on the
 *       line IMMEDIATELY BEFORE the fence. That is a real file path, just a
 *       different dialect; to measure quality we must capture it.
 *
 * So this ONE pass classifies every fenced block as:
 *   - in_fence : path header on the first line inside the fence  (strict)
 *   - pre_line : no in-fence header, but the line just before the fence names a
 *                path (`**path**`, `path:`, `File: path`, or a bare `path.ext`)
 *   - none     : neither (genuinely unmaterializable)
 * It writes project/ from (in_fence UNION pre_line) so quality is measurable, and
 * reports BOTH counts. The strict count is the emit-discipline metric; the union
 * is what measure.cjs scores. Applied UNIFORMLY to every tier (Claude included),
 * so the comparison is fair. AX's own runs/ + results.csv are untouched — AX2 runs
 * under model-namespaced condition dirs (`<slug>__<cond>`).
 *
 * Usage: node materialize2.cjs <condition-dir> <rep>
 * Emits: project/ + materialize2-report.json (in_fence, pre_line, none, files).
 */
const fs = require("fs");
const path = require("path");

const condition = process.argv[2];
const rep = process.argv[3];
if (!condition || !rep) { console.error("usage: node materialize2.cjs <condition-dir> <rep>"); process.exit(1); }

const repDir = path.join(__dirname, "runs", condition, String(rep));
const projDir = path.join(repDir, "project");
if (!fs.existsSync(repDir)) { console.error(`no rep dir: ${repDir}`); process.exit(1); }
fs.rmSync(projDir, { recursive: true, force: true });
fs.mkdirSync(projDir, { recursive: true });

// in-fence header on the first line (the strict AX rule, incl. trailing parenthetical)
const IN_FENCE = /^\s*(?:\/\/|#|--|<!--|\/\*)\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\([^)]*\))?\s*(?:-->|\*\/)?\s*$/;
const IN_FENCE2 = /^\s*(?:File:|path:)\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\([^)]*\))?\s*$/i;
// path stated on the line immediately BEFORE the fence. Covers the weak-model
// dialects seen in the smoke: **path**, **// path**, `path`, `// path`, File: path,
// path:, bare path.ext — an optional bold/backtick wrapper, an optional comment
// marker (// # -- /*), an optional File:/path: label, then the path.
const PRE_LINE = /^\s*(?:\*\*|`|__)?\s*(?:\/\/|#|--|\/\*)?\s*(?:File:|path:)?\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\*\/)?\s*(?:`|\*\*|__)?\s*:?\s*$/i;

function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  if (!p.startsWith(path.normalize(base))) return null;
  return p;
}

// walk markdown capturing (preceding_nonempty_line, fence_body) pairs
function extractPairs(md) {
  const lines = md.split(/\r?\n/);
  const pairs = [];
  let i = 0;
  while (i < lines.length) {
    if (/^\s*```/.test(lines[i])) {
      // find preceding non-empty line
      let p = i - 1;
      while (p >= 0 && lines[p].trim() === "") p--;
      const pre = p >= 0 ? lines[p] : "";
      // collect body until closing fence
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) { body.push(lines[i]); i++; }
      i++; // skip closing fence
      pairs.push({ pre, body });
    } else i++;
  }
  return pairs;
}

const responses = fs.readdirSync(repDir).filter((f) => /^response-P\d+\.md$/.test(f))
  .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));

let inFence = 0, preLine = 0, none = 0;
const written = new Set();
const via = {}; // path -> "in_fence" | "pre_line" (first classification that wrote it)

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
      // guard: the pre-line must look like a filename with a path-ish extension, not prose
      if (pm && /\.[A-Za-z0-9]+$/.test(pm[1]) && !/\s/.test(pm[1])) { rel = pm[1]; kind = "pre_line"; }
    }
    if (!rel) { none++; continue; }
    const dest = safeJoin(projDir, rel);
    if (!dest) { none++; continue; }
    // for in_fence the header line is inside the body → drop it; for pre_line the body is all code
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
  strict_materializable: inFence,            // the emit-discipline metric
  union_materialized: inFence + preLine,     // what measure.cjs scores
  unique_files: written.size, files: [...written].sort(), via };
fs.writeFileSync(path.join(repDir, "materialize2-report.json"), JSON.stringify(report, null, 2));
console.log(`[${condition}/${rep}] in_fence=${inFence} pre_line=${preLine} none=${none} -> ${written.size} files`);
