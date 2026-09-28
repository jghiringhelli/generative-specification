#!/usr/bin/env node
// ollama_mod.cjs <twinDir> <targetRel> <model> <rep> <outJson>
// Feeds ONE file to a local Ollama model, asks for the cross-cutting readingTime change, applies it,
// checks whether a low-capacity model can produce a valid compiling modification of THIS file.
// Capacity test: M's file is a 489-line God-class; D's is a smaller bounded service.
const fs = require("fs"), http = require("http"), path = require("path"), { spawnSync } = require("child_process");
const [, , twinDir, targetRel, model, rep, outJson] = process.argv;
const target = path.join(twinDir, targetRel);
const content = fs.readFileSync(target, "utf8");
const isRoute = /routes/.test(targetRel);
const where = isRoute
  ? "every place this file builds an article object for a response — the single-article response, the article-list response, and the feed response"
  : "the article response builder";
const prompt = `You are editing ONE TypeScript file from a RealWorld "Conduit" API backend. Add a \`readingTime\` field to every article object returned in a response. \`readingTime\` is an integer equal to Math.ceil( (number of whitespace-separated words in the article's body) / 200 ). Add it to ${where}. Preserve ALL existing behavior and types. Output ONLY the complete modified file inside a single \`\`\`typescript code block and nothing else.

FILE (${targetRel}):
\`\`\`typescript
${content}
\`\`\``;

const body = JSON.stringify({ model, prompt, stream: false, options: { num_predict: 12000, temperature: 0.2 } });
const req = http.request({ host: "localhost", port: 11434, path: "/api/generate", method: "POST",
  headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (res) => {
  let d = ""; res.on("data", (c) => (d += c)); res.on("end", () => {
    let resp; try { resp = JSON.parse(d); } catch (e) { return finish({ twin: path.basename(twinDir), model, rep: +rep, error: "parse", raw: d.slice(0, 200) }); }
    const text = resp.response || "";
    const m = text.match(/```(?:typescript|ts)?\s*\n([\s\S]*?)```/);
    const code = m ? m[1] : null;
    const bak = target + ".bak"; fs.copyFileSync(target, bak);
    let tsc = 0, wired = 0, tsc_errs = null;
    if (code) {
      fs.writeFileSync(target, code);
      const r = spawnSync("npx", ["tsc", "--noEmit"], { cwd: twinDir, shell: true, encoding: "utf8" });
      tsc = r.status === 0 ? 1 : 0;
      tsc_errs = (String(r.stdout || "").match(/error TS/g) || []).length;
      wired = /readingTime/.test(code) ? 1 : 0;
      try { fs.writeFileSync(outJson.replace(/\.json$/, ".code.ts"), code); } catch (e) {}
      try { fs.writeFileSync(outJson.replace(/\.json$/, ".tsc.txt"), String(r.stdout || "")); } catch (e) {}
    }
    fs.copyFileSync(bak, target); fs.unlinkSync(bak);
    finish({ twin: path.basename(twinDir), model, rep: +rep, extracted: code ? 1 : 0, tsc, tsc_errs, wired,
      resp_chars: text.length, code_chars: code ? code.length : 0, orig_chars: content.length,
      eval_count: resp.eval_count, ms: resp.total_duration ? Math.round(resp.total_duration / 1e6) : null });
  });
});
function finish(o) { fs.writeFileSync(outJson, JSON.stringify(o, null, 2)); console.log(JSON.stringify(o)); process.exit(0); }
req.on("error", (e) => finish({ twin: path.basename(twinDir), model, rep: +rep, error: e.message }));
req.write(body); req.end();
