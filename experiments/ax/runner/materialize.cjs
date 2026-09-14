/**
 * AX runner — materialize.cjs  (module 2 of 6)
 *
 * Extracts path-annotated fenced code blocks from a rep's response-P*.md files
 * into runs/<condition>/<rep>/project/. A block materializes ONLY if its first
 * line is a path-header comment (`// src/x.ts`, `# path`, `<!-- path -->`,
 * `/* path *​/`). Blocks without a path header are NOT extracted — this is the
 * real emit-discipline failure (the naive 0% coverage), preserved on purpose.
 * Later prompts overwrite earlier files (last-writer-wins).
 *
 * Usage: node materialize.cjs <condition> <rep>
 * Emits: project/ (the code) + materialize-report.json (counts, skipped list).
 */
const fs = require("fs");
const path = require("path");

const condition = process.argv[2];
const rep = process.argv[3];
if (!condition || !rep) { console.error("usage: node materialize.cjs <condition> <rep>"); process.exit(1); }

const repDir = path.join(__dirname, "runs", condition, String(rep));
const projDir = path.join(repDir, "project");
if (!fs.existsSync(repDir)) { console.error(`no rep dir: ${repDir}`); process.exit(1); }
fs.rmSync(projDir, { recursive: true, force: true });
fs.mkdirSync(projDir, { recursive: true });

// path-header patterns on the first line inside a fenced block.
// A trailing parenthetical annotation is allowed after the filename
// (models routinely write `// output/package.json (updated scripts section)`);
// this is still an EXPLICIT path header, not a fallback — the file is named. The
// first token must be a clean path ending in an extension, so prose is not matched.
const PATH_RE = /^\s*(?:\/\/|#|--|<!--|\/\*)\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\([^)]*\))?\s*(?:-->|\*\/)?\s*$/;
// also accept a bare "path:" style or a leading "File: path" (parenthetical allowed)
const PATH_RE2 = /^\s*(?:File:|path:)\s*([A-Za-z0-9_][\w./-]*\.[A-Za-z0-9]+)\s*(?:\([^)]*\))?\s*$/i;

function extractBlocks(md) {
  const blocks = [];
  const re = /```[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(md)) !== null) blocks.push(m[1]);
  return blocks;
}

function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  if (!p.startsWith(path.normalize(base))) return null; // no path escape
  return p;
}

const responses = fs.readdirSync(repDir).filter((f) => /^response-P\d+\.md$/.test(f))
  .sort((a, b) => (+a.match(/\d+/)[0]) - (+b.match(/\d+/)[0]));

let materialized = 0, skipped = 0;
const skippedFirstLines = [];
const writtenPaths = new Set();

for (const rf of responses) {
  const md = fs.readFileSync(path.join(repDir, rf), "utf-8");
  for (const block of extractBlocks(md)) {
    const lines = block.split(/\r?\n/);
    const first = lines[0] || "";
    const mm = first.match(PATH_RE) || first.match(PATH_RE2);
    if (!mm) { skipped++; if (skippedFirstLines.length < 20) skippedFirstLines.push(first.slice(0, 80)); continue; }
    const rel = mm[1];
    const dest = safeJoin(projDir, rel);
    if (!dest) { skipped++; continue; }
    const body = lines.slice(1).join("\n").replace(/^\n/, "");
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body.endsWith("\n") ? body : body + "\n");
    writtenPaths.add(rel);
    materialized++;
  }
}

const report = { condition, rep: String(rep), responses: responses.length,
  materialized, skipped, unique_files: writtenPaths.size,
  files: [...writtenPaths].sort(), skipped_first_lines: skippedFirstLines };
fs.writeFileSync(path.join(repDir, "materialize-report.json"), JSON.stringify(report, null, 2));
console.log(`[${condition}/${rep}] materialized ${materialized} blocks -> ${writtenPaths.size} files; skipped ${skipped} (no path header)`);
if (skipped > 0) console.log(`  (skipped first-lines sample: ${skippedFirstLines.slice(0, 3).join(" | ")})`);
