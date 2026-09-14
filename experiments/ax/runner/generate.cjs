/**
 * AX runner — generate.cjs  (reconstructed Sept 2026 from RUNNER-SPEC.md;
 * session/token-capture pattern lifted from experiments/kx/run-kx.cjs)
 *
 * Runs ONE replication of ONE condition: a fresh `claude -p` session that
 * receives the condition's prompt sequence in order (context carried across
 * prompts via --resume <session_id>), with NO file tools (--tools "") so the
 * model emits code as fenced blocks in its text (the materializer extracts
 * them later; the naive annotation failure is a real emit-discipline result).
 *
 * Per-condition CONTEXT is injected into the first prompt (the model has no
 * tools to read files): the shared API spec, the condition README, and, for
 * treatment, the full GS artifact cascade.
 *
 * Usage:
 *   node generate.cjs <naive|control|treatment> <rep>       # full sequence
 *   node generate.cjs <naive|control|treatment> <rep> --smoke   # prompt 1 only
 *
 * Output: runs/<condition>/<rep>/response-P<n>.md  +  meta.json (cumulative
 * usage/cost/turns/session_id).  Resume: skips a rep whose meta.json exists.
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const AX = path.resolve(__dirname, "..");
const MODEL = "claude-sonnet-4-5"; // match the original AX runs; smoke test reveals if unavailable
const CONDITIONS = {
  naive:     { context: [] },                                   // README only  (= L0)
  control:   { context: [] },                                   // README only  (rules-in-prose, ≈ L1+L2)
  treatment: { context: ["Status.md", "prisma", "docs"] },      // + full cascade (≈ L3)
  // Ablation ladder rungs (authored Sept 2026; each isolates ONE component):
  L1:            { context: [] },                               // complete spec, derive-all (spec injected for all)
  L2:            { context: [] },                               // + tests-as-gate harness (discipline)
  // Bridge test (fixed rung ≈ L1; varies specification altitude, not components):
  "bridge-strong": { context: [] },                            // conceptual shore
  "bridge-weak":   { context: [] },                            // mechanical shore
};

const condition = process.argv[2];
const rep = process.argv[3];
const smoke = process.argv.includes("--smoke");
if (!CONDITIONS[condition] || !rep) {
  console.error("usage: node generate.cjs <naive|control|treatment> <rep> [--smoke]");
  process.exit(1);
}

const condDir = path.join(AX, condition);
const outDir = path.join(__dirname, "runs", condition, String(rep));
const metaFile = path.join(outDir, "meta.json");
if (fs.existsSync(metaFile) && !smoke) { console.log(`[${condition}/${rep}] already done`); process.exit(0); }
fs.mkdirSync(outDir, { recursive: true });

// ── helpers ───────────────────────────────────────────────────────────
const stripFrontmatter = (md) => md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();

function readFilesConcat(absPaths) {
  const parts = [];
  const walk = (p) => {
    const st = fs.existsSync(p) && fs.statSync(p);
    if (!st) return;
    if (st.isDirectory()) {
      for (const e of fs.readdirSync(p).sort()) walk(path.join(p, e));
    } else if (/\.(md|prisma|ya?ml|json|ts)$/.test(p)) {
      const rel = path.relative(condDir, p).split(path.sep).join("/");
      parts.push(`\n===== FILE: ${rel} =====\n` + fs.readFileSync(p, "utf-8"));
    }
  };
  for (const a of absPaths) walk(a);
  return parts.join("\n");
}

function buildContext() {
  const spec = fs.readFileSync(path.join(AX, "REALWORLD_API_SPEC.md"), "utf-8");
  const readme = fs.existsSync(path.join(condDir, "README.md"))
    ? fs.readFileSync(path.join(condDir, "README.md"), "utf-8") : "";
  let ctx =
    "You are implementing a backend API. Emit ALL code as fenced code blocks, each with an explicit file-path header comment on the first line (for example `// src/routes/user.ts`). A file referenced but not emitted as a code block does not exist.\n\n" +
    "===== API SPECIFICATION =====\n" + spec + "\n";
  if (readme) ctx += "\n===== PROJECT README =====\n" + readme + "\n";
  const cascade = CONDITIONS[condition].context.map((c) => path.join(condDir, c));
  if (cascade.length) ctx += "\n===== SPECIFICATION ARTIFACTS =====\n" + readFilesConcat(cascade) + "\n";
  return ctx;
}

const prompts = fs.readdirSync(path.join(condDir, "prompts")).filter((f) => f.endsWith(".md")).sort();

function callClaude({ input, resume }) {
  const args = ["-p", "--dangerously-skip-permissions", "--output-format", "json",
                "--model", MODEL, "--tools", "", "--strict-mcp-config"];
  if (resume) args.push("--resume", resume);
  const res = spawnSync("claude", args, {
    cwd: outDir, input, encoding: "utf-8",
    timeout: 600_000, maxBuffer: 128 * 1024 * 1024,
    shell: process.platform === "win32",
  });
  try { return { ok: true, j: JSON.parse(res.stdout) }; }
  catch { return { ok: false, err: (res.stderr || res.stdout || "no output").slice(0, 1000) }; }
}

// ── run the sequence (prompt-level resumable) ─────────────────────────
// A rep is 6-7 chained prompts (~5-15 min). In a session that resets often, a
// killed/timed-out run must not restart from prompt 1 and re-spend. progress.json
// checkpoints after every prompt: session id, which prompts finished, cumulative
// cost/turns. On restart we resume that session and skip completed prompts.
const context = buildContext();
console.log(`[${condition}/${rep}] context ${context.length} chars, ${prompts.length} prompts${smoke ? " (SMOKE: P1 only)" : ""}`);
const seq = smoke ? prompts.slice(0, 1) : prompts;
const progressFile = path.join(outDir, smoke ? "progress-smoke.json" : "progress.json");

let sessionId = null, sumCost = 0, sumTurns = 0, passes = [], doneCount = 0;
if (fs.existsSync(progressFile)) {
  try { const p = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
    sessionId = p.session_id || null; sumCost = p.total_cost_usd || 0; sumTurns = p.total_turns || 0;
    passes = p.passes || []; doneCount = passes.length;
    if (doneCount) console.log(`[${condition}/${rep}] resuming after P${doneCount} (sid=${(sessionId || "").slice(0, 8)}, $${sumCost.toFixed(3)} so far)`);
  } catch {}
}

for (let i = doneCount; i < seq.length; i++) {
  const body = stripFrontmatter(fs.readFileSync(path.join(condDir, "prompts", seq[i]), "utf-8"));
  const input = i === 0 ? context + "\n\n===== TASK =====\n" + body : body;
  const t0 = Date.now();
  const r = callClaude({ input, resume: sessionId });
  const wall = Date.now() - t0;
  if (!r.ok) {
    console.error(`[${condition}/${rep}] P${i + 1} FAILED: ${r.err}`);
    fs.writeFileSync(path.join(outDir, `error-P${i + 1}.txt`), r.err);
    process.exit(2);
  }
  const j = r.j;
  sessionId = j.session_id || sessionId; // carry the session for --resume
  sumCost += j.total_cost_usd || 0;
  sumTurns += j.num_turns || 0;
  fs.writeFileSync(path.join(outDir, `response-P${i + 1}.md`), j.result || "");
  passes.push({ prompt: seq[i], usage: j.usage, cost: j.total_cost_usd, turns: j.num_turns, wall_ms: wall, session_id: j.session_id });
  // checkpoint after every prompt
  fs.writeFileSync(progressFile, JSON.stringify({ condition, rep: String(rep), model: MODEL,
    session_id: sessionId, total_cost_usd: +sumCost.toFixed(4), total_turns: sumTurns, passes }, null, 2));
  console.log(`[${condition}/${rep}] P${i + 1}/${seq.length} ${seq[i]} ok  ${Math.round(wall / 1000)}s  $${(j.total_cost_usd || 0).toFixed(3)}  sid=${(j.session_id || "").slice(0, 8)}`);
}

const meta = { condition, rep: String(rep), model: MODEL, smoke, session_id: sessionId,
  n_prompts: seq.length, total_cost_usd: +sumCost.toFixed(4), total_turns: sumTurns, passes };
fs.writeFileSync(smoke ? path.join(outDir, "meta-smoke.json") : metaFile, JSON.stringify(meta, null, 2));
try { fs.rmSync(progressFile, { force: true }); } catch {} // checkpoint no longer needed
console.log(`[${condition}/${rep}] complete: ${seq.length} passes, $${sumCost.toFixed(3)}, ${sumTurns} turns`);
