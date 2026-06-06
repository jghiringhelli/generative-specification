/**
 * KX runner — executes all queries for one condition via fresh `claude -p`
 * sessions, capturing the usage JSON per query.
 *
 * Conditions:
 *   monolith — full harness+docs dump injected into the prompt, neutral cwd,
 *              tools discouraged (RAG-dump analog: everything in context)
 *   cnt      — project cwd, agent navigates the CNT (CKG analog)
 *   bare     — stripped project copy (no .claude/CLAUDE.md/docs/.forgecraft/
 *              Status.md/forgecraft.yaml/tests-harness), agent greps code
 *              (derive-at-query-time analog)
 *
 * Usage: node run-kx.cjs <monolith|cnt|bare>
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const condition = process.argv[2];
if (!["monolith", "cnt", "bare"].includes(condition)) {
  console.error("usage: node run-kx.cjs <monolith|cnt|bare>");
  process.exit(1);
}

const KX = __dirname;
const PROJECT = path.resolve(KX, "..", "ax", "treatment-v8", "output", "project");
const queries = JSON.parse(fs.readFileSync(path.join(KX, "queries.json"), "utf-8"));
const outDir = path.join(KX, "evidence", condition);
fs.mkdirSync(outDir, { recursive: true });

// ── Condition setup ───────────────────────────────────────────────────
function collectDocs(root, rels) {
  const parts = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".md") || e.name.endsWith(".yaml")) {
        const rel = path.relative(root, full).split(path.sep).join("/");
        parts.push(`\n===== FILE: ${rel} =====\n` + fs.readFileSync(full, "utf-8"));
      }
    }
  };
  for (const r of rels) {
    const d = path.join(root, ...r.split("/"));
    if (fs.existsSync(d)) walk(d);
  }
  const claudeMd = path.join(root, "CLAUDE.md");
  if (fs.existsSync(claudeMd))
    parts.unshift(`\n===== FILE: CLAUDE.md =====\n` + fs.readFileSync(claudeMd, "utf-8"));
  return parts.join("\n");
}

let cwd, buildPrompt;
if (condition === "monolith") {
  cwd = path.join(KX, "neutral");
  fs.mkdirSync(cwd, { recursive: true });
  const dump = collectDocs(PROJECT, [".claude", "docs", ".forgecraft/gates"]);
  console.log("monolith dump chars:", dump.length);
  buildPrompt = (q) =>
    "You are answering questions about a software project. Use ONLY the project documentation provided below. Do not use any tools.\n\n" +
    "<PROJECT_DOCUMENTATION>\n" + dump + "\n</PROJECT_DOCUMENTATION>\n\nQuestion: " + q.query;
} else if (condition === "cnt") {
  cwd = PROJECT;
  buildPrompt = (q) =>
    "Answer the following question about this project. You may read files; do not modify anything.\n\nQuestion: " + q.query;
} else {
  // bare: build stripped copy once — ISOLATED in temp so directory-walking
  // cannot rediscover the original harness (first run escaped the sandbox:
  // the agent found ../ax/treatment-v8 via find and read the gates registry).
  cwd = path.join(process.env.LOCALAPPDATA || require("os").tmpdir(), "kx-bare-project");
  if (!fs.existsSync(path.join(cwd, "package.json"))) {
    console.log("building bare copy...");
    fs.cpSync(PROJECT, cwd, {
      recursive: true,
      filter: (src) => !/node_modules|\.git$|\.git[\\/]|coverage|[\\/]dist/.test(src),
    });
    for (const k of [".claude", "CLAUDE.md", "docs", ".forgecraft", "Status.md", "forgecraft.yaml", path.join("tests", "harness")]) {
      fs.rmSync(path.join(cwd, k), { recursive: true, force: true });
    }
  }
  buildPrompt = (q) =>
    "Answer the following question about this project. You may read files within this project directory only — do not search or read outside it; do not modify anything.\n\nQuestion: " + q.query;
}

// ── Run ───────────────────────────────────────────────────────────────
let done = 0;
for (const q of queries) {
  const outFile = path.join(outDir, `${q.id}.json`);
  if (fs.existsSync(outFile)) {
    done++;
    continue; // resume support
  }
  const t0 = Date.now();
  const res = spawnSync(
    "claude",
    ["-p", "--dangerously-skip-permissions", "--output-format", "json"],
    {
      cwd,
      input: buildPrompt(q),
      encoding: "utf-8",
      timeout: 300_000,
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === "win32",
    },
  );
  const wall = Date.now() - t0;
  let record;
  try {
    const j = JSON.parse(res.stdout);
    record = {
      id: q.id,
      type: q.type,
      condition,
      answer: j.result ?? "",
      usage: j.usage,
      total_cost_usd: j.total_cost_usd,
      duration_ms: j.duration_ms,
      num_turns: j.num_turns,
      wall_ms: wall,
      is_error: j.is_error ?? false,
    };
  } catch {
    record = { id: q.id, type: q.type, condition, answer: "", error: (res.stderr || res.stdout || "").slice(0, 500), wall_ms: wall, is_error: true };
  }
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2));
  done++;
  console.log(`[${condition}] ${done}/${queries.length} ${q.id} ${record.is_error ? "ERR" : "ok"} ${Math.round(wall / 1000)}s`);
}
console.log(`[${condition}] complete: ${done}/${queries.length}`);
