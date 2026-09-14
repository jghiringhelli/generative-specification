/**
 * AX runner — audit.cjs  (module 4 of 6)
 * Blind adversarial audit: a FRESH context-free `claude -p` session scores the
 * materialized project on the seven properties (0/1/2), reading the project
 * directory (read tools ON, unlike generation). Convergent instrument, NOT the
 * metric of record. Run twice (--auditor N) for inter-rater kappa.
 *
 * Usage: node audit.cjs <condition> <rep> [--auditor 1]
 * Emits: runs/<condition>/<rep>/audit-<auditor>.json
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const condition = process.argv[2];
const rep = process.argv[3];
const ai = (process.argv.includes("--auditor") ? process.argv[process.argv.indexOf("--auditor") + 1] : "1");
if (!condition || !rep) { console.error("usage: node audit.cjs <condition> <rep> [--auditor N]"); process.exit(1); }

const proj = path.join(__dirname, "runs", condition, String(rep), "project");
if (!fs.existsSync(proj)) { console.error(`no project: ${proj}`); process.exit(1); }
const outFile = path.join(path.dirname(proj), `audit-${ai}.json`);

const PROMPT = `You are auditing a software project. You have no prior knowledge of how it was built. Read the files in this directory and score it on SEVEN properties, each 0, 1, or 2 (0 = absent, 1 = partial, 2 = fully present). Score ONLY what is materially present in the code and files, never what documentation claims.

1. Self-describing — the system explains its own architecture/decisions from its artifacts, no external knowledge needed.
2. Bounded — units have explicit scope and seams; functions/modules do one thing; no oversized files.
3. Verifiable — correctness is checkable without human judgment (types, tests, lint, coverage present and meaningful).
4. Defended — destructive/invalid operations are structurally prevented (validation, hooks, guards), not just discouraged.
5. Auditable — decisions and history are recoverable from artifacts (ADRs, meaningful commits, changelog).
6. Composable — parts are isolated, single-purpose, combinable without hidden coupling (interfaces/DI).
7. Executable — behavioral contracts run against a real system (integration/e2e tests that exercise it), not merely compile.

Respond with ONLY a JSON object, no prose:
{"self_describing":N,"bounded":N,"verifiable":N,"defended":N,"auditable":N,"composable":N,"executable":N,"notes":"one line"}`;

const t0 = Date.now();
const r = spawnSync("claude", ["-p", "--dangerously-skip-permissions", "--output-format", "json", "--model", "claude-sonnet-4-5"],
  { cwd: proj, input: PROMPT, encoding: "utf-8", timeout: 300_000, maxBuffer: 64 * 1024 * 1024, shell: process.platform === "win32" });

let rec;
try {
  const j = JSON.parse(r.stdout);
  const text = j.result || "";
  const jm = text.match(/\{[\s\S]*\}/);
  const scores = jm ? JSON.parse(jm[0]) : null;
  const props = ["self_describing", "bounded", "verifiable", "defended", "auditable", "composable", "executable"];
  const total = scores ? props.reduce((a, p) => a + (Number(scores[p]) || 0), 0) : null;
  rec = { condition, rep: String(rep), auditor: ai, scores, total, max: 14, cost: j.total_cost_usd, wall_ms: Date.now() - t0, session_id: j.session_id };
} catch (e) {
  rec = { condition, rep: String(rep), auditor: ai, error: String(e).slice(0, 300), raw: (r.stdout || r.stderr || "").slice(0, 500) };
}
fs.writeFileSync(outFile, JSON.stringify(rec, null, 2));
console.log(`[${condition}/${rep}] audit-${ai}: total=${rec.total}/14 ${rec.error ? "ERR " + rec.error : ""}`);
