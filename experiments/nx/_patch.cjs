const fs=require("fs"),path=require("path");
let h=fs.readFileSync("harness.cjs","utf-8");

// 1) replace genOne to run in isolated cwd and READ the written module file
h = h.replace(/function genOne\(spec, framing\) \{[\s\S]*?\n\}/,
`function genOne(spec, framing) {
  const cwd = fs.mkdtempSync(path.join(TMP, "gen_"));
  const prompt = (framing ? framing + "\n\n" : "") + spec +
    "\n\nCreate exactly ONE CommonJS module file in the current directory implementing this, with module.exports = the function. Do not create tests or extra files.";
  const r = spawnSync("claude", ["-p","--dangerously-skip-permissions","--output-format","json","--model",MODEL],
    { cwd, input: prompt, encoding: "utf-8", timeout: 240000, maxBuffer: 64*1024*1024, shell: process.platform === "win32" });
  let cost = 0, resultText = "";
  try { const j = JSON.parse(r.stdout); cost = j.total_cost_usd || 0; resultText = j.result || ""; } catch(e){}
  // read the module file the agent wrote (prefer one containing module.exports)
  let code = null;
  try {
    const files = fs.readdirSync(cwd).filter(f => /\.(c?js)$/.test(f) && !/test/i.test(f));
    let best = null, bestScore = -1;
    for (const f of files) {
      const c = fs.readFileSync(path.join(cwd, f), "utf-8");
      const score = (c.includes("module.exports")?100:0) + c.length/1000;
      if (score > bestScore) { bestScore = score; best = c; }
    }
    if (best) code = best.trim();
  } catch(e){}
  if (!code) code = extractCode(resultText); // fallback: inline
  try { fs.rmSync(cwd, { recursive: true, force: true }); } catch(e){}
  return { code: code || null, cost, err: code ? null : "no-code" };
}`);

// 2) drop DEAD versions (errored on >90% of inputs) from the triple; require >=2 live
h = h.replace(
  'if (triple.length < 2) { log(`  nver/${rep} <2 versions, skip`); continue; }',
`const live = triple.filter(outs => outs.filter(o=>o.ok).length > inputs.length*0.1);
    if (live.length < 2) { log(\`  nver/\${rep} <2 LIVE versions (dead gens), skip\`); continue; }
    triple.length = 0; live.forEach(t=>triple.push(t));
    const NV = triple.length;`);

// make majority threshold relative to NV live versions
h = h.replace('const hasMaj = majN >= 2;', 'const hasMaj = majN > NV/2;');

fs.writeFileSync("harness.cjs", h);
console.log("patched");
