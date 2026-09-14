/**
 * AX2 runner — ollama_generate.cjs  (the weak-local capacity arm for RQ3)
 *
 * Mirrors generate.cjs EXACTLY except the model backend: instead of a `claude -p`
 * session chained with --resume, it drives an Ollama model via POST /api/chat,
 * carrying context across the prompt sequence in the `messages` array (the direct
 * analogue of --resume). Same buildContext (shared API spec + condition README +
 * cascade), same "emit fenced blocks with a path-header first line" instruction,
 * same prompt files from ax/<condition>/prompts. So the ONLY free variable versus
 * the Claude baseline is the model — which is the whole point of RQ3.
 *
 * Output is namespaced by model so the UNMODIFIED materialize.cjs / measure.cjs /
 * aggregate.cjs work: condition dir = "<modelslug>__<condition>". e.g.
 *   node materialize.cjs llama31-8b__naive 0
 *
 * Usage:
 *   node ollama_generate.cjs <naive|control|treatment> <rep> <ollama-model> [--smoke]
 * e.g. node ollama_generate.cjs naive 0 llama3.1:8b
 *
 * Resumable: progress.json checkpoints after every prompt (a killed run resumes
 * mid-sequence, does not re-spend wall time). meta.json marks a rep done.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const AX = path.resolve(__dirname, "..");
const OLLAMA = "http://127.0.0.1:11434/api/chat";
const NUM_CTX = 16384;     // weak models: give them a real window; truncation is a real RQ3 signal, not a bug to hide
const TEMPERATURE = 0.2;   // near-greedy for reproducibility across reps
const PER_PROMPT_TIMEOUT_MS = 1_800_000; // 30 min per prompt; weak models slow down as the chained context grows on the 7-prompt conditions (control/treatment). A genuine hang past this is recorded as a failure (data).

const CONDITIONS = {
  naive:     { context: [] },
  control:   { context: [] },
  treatment: { context: ["Status.md", "prisma", "docs"] },
};

const condition = process.argv[2];
const rep = process.argv[3];
const model = process.argv[4];
const smoke = process.argv.includes("--smoke");
if (!CONDITIONS[condition] || !rep || !model) {
  console.error("usage: node ollama_generate.cjs <naive|control|treatment> <rep> <ollama-model> [--smoke]");
  process.exit(1);
}
const slug = model.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""); // llama3.1:8b -> llama3-1-8b
const outCondition = `${slug}__${condition}`;

const condDir = path.join(AX, condition);
const outDir = path.join(__dirname, "runs", outCondition, String(rep));
const metaFile = path.join(outDir, "meta.json");
if (fs.existsSync(metaFile) && !smoke) { console.log(`[${outCondition}/${rep}] already done`); process.exit(0); }
fs.mkdirSync(outDir, { recursive: true });

// ── context building (copied from generate.cjs so the two harnesses are identical) ──
const stripFrontmatter = (md) => md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
function readFilesConcat(absPaths) {
  const parts = [];
  const walk = (p) => {
    const st = fs.existsSync(p) && fs.statSync(p);
    if (!st) return;
    if (st.isDirectory()) { for (const e of fs.readdirSync(p).sort()) walk(path.join(p, e)); }
    else if (/\.(md|prisma|ya?ml|json|ts)$/.test(p)) {
      const rel = path.relative(condDir, p).split(path.sep).join("/");
      parts.push(`\n===== FILE: ${rel} =====\n` + fs.readFileSync(p, "utf-8"));
    }
  };
  for (const a of absPaths) walk(a);
  return parts.join("\n");
}
function buildContext() {
  const spec = fs.readFileSync(path.join(AX, "REALWORLD_API_SPEC.md"), "utf-8");
  const readme = fs.existsSync(path.join(condDir, "README.md")) ? fs.readFileSync(path.join(condDir, "README.md"), "utf-8") : "";
  let ctx =
    "You are implementing a backend API. Emit ALL code as fenced code blocks, each with an explicit file-path header comment on the first line (for example `// src/routes/user.ts`). A file referenced but not emitted as a code block does not exist.\n\n" +
    "===== API SPECIFICATION =====\n" + spec + "\n";
  if (readme) ctx += "\n===== PROJECT README =====\n" + readme + "\n";
  const cascade = CONDITIONS[condition].context.map((c) => path.join(condDir, c));
  if (cascade.length) ctx += "\n===== SPECIFICATION ARTIFACTS =====\n" + readFilesConcat(cascade) + "\n";
  return ctx;
}

const prompts = fs.readdirSync(path.join(condDir, "prompts")).filter((f) => f.endsWith(".md")).sort();

function callOllama(messages) {
  const payload = JSON.stringify({ model, messages, stream: false, options: { temperature: TEMPERATURE, num_ctx: NUM_CTX } });
  return new Promise((resolve) => {
    const req = http.request(OLLAMA, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          const j = JSON.parse(data);
          if (j.error) return resolve({ ok: false, err: String(j.error).slice(0, 1000) });
          resolve({ ok: true, content: (j.message && j.message.content) || "", eval_count: j.eval_count || 0, prompt_eval_count: j.prompt_eval_count || 0, total_duration: j.total_duration || 0 });
        } catch (e) { resolve({ ok: false, err: (data || String(e)).slice(0, 1000) }); }
      });
    });
    req.on("error", (e) => resolve({ ok: false, err: String(e).slice(0, 1000) }));
    req.setTimeout(PER_PROMPT_TIMEOUT_MS, () => { req.destroy(); resolve({ ok: false, err: `timeout after ${PER_PROMPT_TIMEOUT_MS}ms` }); });
    req.write(payload); req.end();
  });
}

(async () => {
  const context = buildContext();
  const seq = smoke ? prompts.slice(0, 1) : prompts;
  console.log(`[${outCondition}/${rep}] model=${model} ctx=${context.length} chars, ${seq.length} prompts${smoke ? " (SMOKE)" : ""}`);
  const progressFile = path.join(outDir, smoke ? "progress-smoke.json" : "progress.json");

  let messages = [], sumIn = 0, sumOut = 0, sumDur = 0, passes = [], doneCount = 0;
  if (fs.existsSync(progressFile)) {
    try { const p = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
      messages = p.messages || []; sumIn = p.prompt_eval_count || 0; sumOut = p.eval_count || 0;
      sumDur = p.total_duration_ns || 0; passes = p.passes || []; doneCount = passes.length;
      if (doneCount) console.log(`[${outCondition}/${rep}] resuming after P${doneCount}`);
    } catch {}
  }

  for (let i = doneCount; i < seq.length; i++) {
    const body = stripFrontmatter(fs.readFileSync(path.join(condDir, "prompts", seq[i]), "utf-8"));
    const userMsg = i === 0 ? context + "\n\n===== TASK =====\n" + body : body;
    messages.push({ role: "user", content: userMsg });
    const t0 = Date.now();
    const r = await callOllama(messages);
    const wall = Date.now() - t0;
    if (!r.ok) {
      console.error(`[${outCondition}/${rep}] P${i + 1} FAILED: ${r.err}`);
      fs.writeFileSync(path.join(outDir, `error-P${i + 1}.txt`), r.err);
      // record the failure in progress so a resume does not silently skip it, then stop this rep
      fs.writeFileSync(progressFile, JSON.stringify({ condition: outCondition, rep: String(rep), model, messages, prompt_eval_count: sumIn, eval_count: sumOut, total_duration_ns: sumDur, passes, failed_at: i + 1, error: r.err }, null, 2));
      process.exit(2);
    }
    messages.push({ role: "assistant", content: r.content });
    sumIn += r.prompt_eval_count; sumOut += r.eval_count; sumDur += r.total_duration;
    fs.writeFileSync(path.join(outDir, `response-P${i + 1}.md`), r.content);
    passes.push({ prompt: seq[i], prompt_eval_count: r.prompt_eval_count, eval_count: r.eval_count, wall_ms: wall });
    fs.writeFileSync(progressFile, JSON.stringify({ condition: outCondition, rep: String(rep), model, messages, prompt_eval_count: sumIn, eval_count: sumOut, total_duration_ns: sumDur, passes }, null, 2));
    console.log(`[${outCondition}/${rep}] P${i + 1}/${seq.length} ${seq[i]} ok  ${Math.round(wall / 1000)}s  out_tok=${r.eval_count}`);
  }

  const meta = { condition: outCondition, base_condition: condition, rep: String(rep), model, vendor: "ollama-local", smoke,
    n_prompts: seq.length, prompt_eval_count: sumIn, eval_count: sumOut, total_duration_ns: sumDur, passes };
  fs.writeFileSync(smoke ? path.join(outDir, "meta-smoke.json") : metaFile, JSON.stringify(meta, null, 2));
  try { fs.rmSync(progressFile, { force: true }); } catch {}
  console.log(`[${outCondition}/${rep}] complete: ${seq.length} passes, in=${sumIn} out=${sumOut} tok`);
})();
