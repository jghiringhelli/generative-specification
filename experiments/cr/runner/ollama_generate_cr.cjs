/**
 * CR runner — ollama_generate_cr.cjs  (the weak-local capacity rungs)
 *
 * Mirrors ../../ax/runner/ollama_generate.cjs: drives an Ollama model via POST /api/chat,
 * carrying context across the prompt sequence in `messages` (the --resume analogue), same
 * "emit fenced blocks with a path-header first line" instruction, near-greedy temperature.
 * Two CR adaptations:
 *   - Context is the Pastura DOMAIN_SPEC + the condition materials (naive/README.md, or the
 *     whole gs/ cascade), not the RealWorld spec.
 *   - The CR prompts live in a SINGLE file per condition (benchmark/prompts/<cond>-prompts.md)
 *     as a numbered list, so this splits that file into ordered prompts (one per `N.` item)
 *     instead of reading a prompts/ directory.
 *
 * Output namespaced so materialize_cr / static_cr / conformance_cr find it:
 *   runs/<modelslug>__<condition>/<rep>/   (condition in {naive, gs})
 *
 * Usage: node ollama_generate_cr.cjs <naive|gs> <rep> <ollama-model> [--smoke]
 *   e.g. node ollama_generate_cr.cjs naive 0 qwen2.5-coder:7b
 * Resumable: progress.json checkpoints after every prompt; meta.json marks a rep done.
 */
const fs = require("fs");
const path = require("path");
const http = require("http");

const BENCH = path.resolve(__dirname, "..", "benchmark");
const OLLAMA = "http://127.0.0.1:11434/api/chat";
const NUM_CTX = 16384;
const TEMPERATURE = 0.2;
const PER_PROMPT_TIMEOUT_MS = 1_800_000;

const condition = process.argv[2];
const rep = process.argv[3];
const model = process.argv[4];
const smoke = process.argv.includes("--smoke");
if (!["naive", "gs"].includes(condition) || !rep || !model) {
  console.error("usage: node ollama_generate_cr.cjs <naive|gs> <rep> <ollama-model> [--smoke]");
  process.exit(1);
}
const slug = model.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
const outCondition = `${slug}__${condition}`;
const outDir = path.join(__dirname, "runs", outCondition, String(rep));
const metaFile = path.join(outDir, "meta.json");
if (fs.existsSync(metaFile) && !smoke) { console.log(`[${outCondition}/${rep}] already done`); process.exit(0); }
fs.mkdirSync(outDir, { recursive: true });

const stripFrontmatter = (md) => md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "").trim();
function concatDir(dir) {
  const parts = [];
  const walk = (p) => {
    const st = fs.existsSync(p) && fs.statSync(p);
    if (!st) return;
    if (st.isDirectory()) { for (const e of fs.readdirSync(p).sort()) walk(path.join(p, e)); }
    else if (/\.(md|prisma|ya?ml|json|ts)$/.test(p)) { parts.push(`\n===== FILE: ${path.relative(BENCH, p).split(path.sep).join("/")} =====\n` + fs.readFileSync(p, "utf-8")); }
  };
  walk(dir);
  return parts.join("\n");
}
function buildContext() {
  const spec = fs.readFileSync(path.join(BENCH, "DOMAIN_SPEC.md"), "utf-8");
  let ctx =
    "You are implementing a backend API. Emit ALL code as fenced code blocks, each with an explicit file-path header comment on the FIRST LINE INSIDE the fence (for example `// src/routes/moves.ts`). A file referenced but not emitted as a code block does not exist.\n\n" +
    "===== DOMAIN SPECIFICATION (ground truth) =====\n" + spec + "\n";
  if (condition === "naive") {
    const readme = fs.readFileSync(path.join(BENCH, "naive", "README.md"), "utf-8");
    ctx += "\n===== PROJECT README =====\n" + readme + "\n";
  } else {
    ctx += "\n===== SPECIFICATION ARTIFACTS (the GS cascade — read CLAUDE.md first) =====\n" + concatDir(path.join(BENCH, "gs")) + "\n";
  }
  return ctx;
}
// split the single numbered-list prompt file into ordered prompts
function loadPrompts() {
  const raw = stripFrontmatter(fs.readFileSync(path.join(BENCH, "prompts", `${condition}-prompts.md`), "utf-8"));
  const lines = raw.split(/\r?\n/);
  const items = []; let cur = null;
  for (const ln of lines) {
    const m = ln.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) { if (cur) items.push(cur.trim()); cur = m[2]; }
    else if (cur != null) { cur += "\n" + ln; }
  }
  if (cur) items.push(cur.trim());
  // strip surrounding quotes a prompt line may carry
  return items.map((s) => s.replace(/^"(.*)"$/s, "$1").trim()).filter(Boolean);
}

function callOllama(messages) {
  const payload = JSON.stringify({ model, messages, stream: false, options: { temperature: TEMPERATURE, num_ctx: NUM_CTX } });
  return new Promise((resolve) => {
    const req = http.request(OLLAMA, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { const j = JSON.parse(data);
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
  const prompts = loadPrompts();
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
    const userMsg = i === 0 ? context + "\n\n===== TASK =====\n" + seq[i] : seq[i];
    messages.push({ role: "user", content: userMsg });
    const t0 = Date.now();
    const r = await callOllama(messages);
    const wall = Date.now() - t0;
    if (!r.ok) {
      console.error(`[${outCondition}/${rep}] P${i + 1} FAILED: ${r.err}`);
      fs.writeFileSync(path.join(outDir, `error-P${i + 1}.txt`), r.err);
      fs.writeFileSync(progressFile, JSON.stringify({ condition: outCondition, rep: String(rep), model, messages, prompt_eval_count: sumIn, eval_count: sumOut, total_duration_ns: sumDur, passes, failed_at: i + 1, error: r.err }, null, 2));
      process.exit(2);
    }
    messages.push({ role: "assistant", content: r.content });
    sumIn += r.prompt_eval_count; sumOut += r.eval_count; sumDur += r.total_duration;
    fs.writeFileSync(path.join(outDir, `response-P${i + 1}.md`), r.content);
    passes.push({ prompt_index: i + 1, prompt_eval_count: r.prompt_eval_count, eval_count: r.eval_count, wall_ms: wall });
    fs.writeFileSync(progressFile, JSON.stringify({ condition: outCondition, rep: String(rep), model, messages, prompt_eval_count: sumIn, eval_count: sumOut, total_duration_ns: sumDur, passes }, null, 2));
    console.log(`[${outCondition}/${rep}] P${i + 1}/${seq.length} ok  ${Math.round(wall / 1000)}s  out_tok=${r.eval_count}`);
  }
  const meta = { condition: outCondition, base_condition: condition, rep: String(rep), model, vendor: "ollama-local", smoke,
    n_prompts: seq.length, prompt_eval_count: sumIn, eval_count: sumOut, total_duration_ns: sumDur, passes };
  fs.writeFileSync(smoke ? path.join(outDir, "meta-smoke.json") : metaFile, JSON.stringify(meta, null, 2));
  try { fs.rmSync(progressFile, { force: true }); } catch {}
  console.log(`[${outCondition}/${rep}] complete: ${seq.length} passes, in=${sumIn} out=${sumOut} tok`);
})();
