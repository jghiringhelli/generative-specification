// NX harness (OLLAMA weak-model variant) — generate baseline(1)+nversion(3) via the local Ollama
// API, run vs oracle, compute revival metrics. Execution + metrics identical to harness.cjs.
// Usage: node harness_ollama.cjs [k] [ollama-model]   (default k=2, model=qwen2.5-coder:7b)
const fs = require("fs"), path = require("path");
const { spawnSync } = require("child_process");
const { PROBLEMS, battery } = require("./problems.cjs");

const K = parseInt(process.argv[2] || "2", 10);
const MODEL = process.argv[3] || "qwen2.5-coder:7b";
const TEMP = 0.4;
const DIR = __dirname, VDIR = path.join(DIR, "versions_weak"), TMP = path.join(DIR, ".tmp");
fs.mkdirSync(TMP, { recursive: true });
const log = m => { const s = `[${new Date().toISOString().slice(11,19)}] ${m}`; console.log(s); fs.appendFileSync(path.join(DIR,"nx_weak.log"), s+"\n"); };
const FRAMINGS = ["", "Write it in a clean, minimal functional style.", "Be careful and defensive: handle boundary and edge cases explicitly."];
const NOTE = "\n\nOutput ONLY the JavaScript CommonJS module code, setting module.exports to the function. No explanation, no tests, no markdown prose.";

function extractCode(text){
  const f = text.match(/```(?:js|javascript|cjs|node)?\s*([\s\S]*?)```/i);
  let c = (f ? f[1] : text).trim();
  // if no fence and there's leading prose, try to start at the first plausible code token
  if (!f) { const m = c.match(/(^|\n)((?:\/\/|const |let |var |function |module\.exports|"use strict")[\s\S]*)/); if (m) c = m[2].trim(); }
  return c;
}

function genOne(spec, framing) {
  const prompt = (framing ? framing + "\n\n" : "") + spec + NOTE;
  const body = { model: MODEL, prompt, stream: false, options: { temperature: TEMP, num_predict: 1600 } };
  const bf = path.join(TMP, "req_" + Math.random().toString(36).slice(2) + ".json");
  fs.writeFileSync(bf, JSON.stringify(body));
  const r = spawnSync("curl", ["-s","-m","240","-X","POST","http://127.0.0.1:11434/api/generate","--data-binary","@"+bf],
    { encoding: "utf-8", maxBuffer: 64*1024*1024 });
  try { fs.unlinkSync(bf); } catch(e){}
  let text = "";
  try { const j = JSON.parse(r.stdout); text = j.response || ""; } catch(e){ return { code: null, cost: 0, err: "api" }; }
  if (!text) return { code: null, cost: 0, err: "empty" };
  let code = extractCode(text);
  if (code && !/module\.exports/.test(code)) { // sometimes qwen omits the export — reject as dead
    return { code: null, cost: 0, err: "no-export" };
  }
  return { code: code || null, cost: 0, err: code ? null : "no-code" };
}
function writeVersion(problem, cond, rep, v, code) {
  const d = path.join(VDIR, problem.id, cond, String(rep)); fs.mkdirSync(d, { recursive:true });
  const p = path.join(d, `${v}.cjs`); fs.writeFileSync(p, code); return p;
}
function runVersion(versionPath, inputs) {
  const ip = path.join(TMP, "inp_"+Math.random().toString(36).slice(2)+".json");
  fs.writeFileSync(ip, JSON.stringify(inputs));
  const r = spawnSync("node", ["run_version.cjs", versionPath, ip], { cwd:DIR, encoding:"utf-8", timeout:15000, maxBuffer:64*1024*1024 });
  try { fs.unlinkSync(ip); } catch(e){}
  if (r.status !== 0 || !r.stdout) return inputs.map(()=>({ok:false,err:"proc"}));
  try { const o=JSON.parse(r.stdout); if(o.loadError) return inputs.map(()=>({ok:false,err:"load"})); return o; }
  catch { return inputs.map(()=>({ok:false,err:"parse"})); }
}
const eq = (a,b)=>JSON.stringify(a)===JSON.stringify(b);
const wrong = (o,exp)=>!o.ok || !eq(o.v,exp);

const results = []; let totalGen=0, failGen=0, totalCost=0, deadVersions=0, liveVersions=0;
for (const p of PROBLEMS) {
  log(`=== ${p.id} (${p.category}) ===`);
  const inputs = battery(p, 300);
  const oracle = inputs.map(inp => p.oracle(...inp.map(x=> x&&typeof x==="object"?JSON.parse(JSON.stringify(x)):x)));
  const baseRates=[], baseDefectMask=inputs.map(()=>0);
  for (let rep=0; rep<K; rep++) {
    const g=genOne(p.spec,""); totalGen++; totalCost+=g.cost;
    if(!g.code){ failGen++; deadVersions++; log(`  baseline/${rep} GEN FAIL (${g.err})`); continue; }
    liveVersions++;
    const vp=writeVersion(p,"baseline",rep,"v0",g.code); const outs=runVersion(vp,inputs);
    if (outs.filter(o=>o.ok).length < inputs.length*0.1) { deadVersions++; liveVersions--; log(`  baseline/${rep} DEAD (unrunnable)`); continue; }
    let w=0; outs.forEach((o,i)=>{ if(wrong(o,oracle[i])){w++;baseDefectMask[i]++;} });
    baseRates.push(w/inputs.length); log(`  baseline/${rep} defect-rate=${(w/inputs.length*100).toFixed(1)}%`);
  }
  const nBV=baseRates.length||1; inputs.forEach((_,i)=>baseDefectMask[i]/=nBV);
  const repStats=[];
  for (let rep=0; rep<K; rep++) {
    let triple=[];
    for (let v=0; v<3; v++) {
      const g=genOne(p.spec,FRAMINGS[v]); totalGen++; totalCost+=g.cost;
      if(!g.code){ failGen++; deadVersions++; log(`  nver/${rep}/v${v} GEN FAIL (${g.err})`); continue; }
      const vp=writeVersion(p,"nversion",rep,`v${v}`,g.code); triple.push(runVersion(vp,inputs));
    }
    const live = triple.filter(outs => outs.filter(o=>o.ok).length > inputs.length*0.1);
    deadVersions += triple.length - live.length; liveVersions += live.length;
    if (live.length < 2) { log(`  nver/${rep} <2 LIVE versions, skip`); continue; }
    triple = live; const NV = triple.length;
    let flagged=0,majWrong=0,catchMaj=0,fp=0,catchBase=0,baseDef=0;
    inputs.forEach((_,i)=>{
      const outs=triple.map(t=>t[i]);
      const keys=outs.map(o=>o.ok?JSON.stringify(o.v):"ERR");
      const isFlagged=new Set(keys).size>1; if(isFlagged)flagged++;
      const counts={}; keys.forEach(k=>counts[k]=(counts[k]||0)+1);
      let majKey=null,majN=0; for(const k in counts) if(counts[k]>majN){majN=counts[k];majKey=k;}
      const hasMaj=majN>NV/2; const oracleKey=JSON.stringify(oracle[i]);
      const majCorrect=hasMaj&&majKey===oracleKey; const majIsWrong=!majCorrect;
      if(majIsWrong){majWrong++; if(isFlagged)catchMaj++;}
      if(isFlagged&&majCorrect)fp++;
      if(baseDefectMask[i]>0.5){baseDef++; if(isFlagged)catchBase++;}
    });
    repStats.push({ flagged:flagged/inputs.length, majWrongRate:majWrong/inputs.length,
      disagreementCatch: majWrong?catchMaj/majWrong:null, falsePositive: flagged?fp/flagged:0,
      baseDefectCatch: baseDef?catchBase/baseDef:null, liveVersions:NV });
    const s=repStats[repStats.length-1];
    log(`  nver/${rep} live=${NV} flagged=${(s.flagged*100).toFixed(1)}% majWrong=${(s.majWrongRate*100).toFixed(1)}% catch=${s.disagreementCatch} fp=${s.falsePositive} baseCatch=${s.baseDefectCatch}`);
  }
  const avg=xs=>{const v=xs.filter(x=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;};
  results.push({ id:p.id, category:p.category, baselineDefectRate:avg(baseRates),
    flagged:avg(repStats.map(s=>s.flagged)), majWrongRate:avg(repStats.map(s=>s.majWrongRate)),
    disagreementCatch:avg(repStats.map(s=>s.disagreementCatch)), falsePositive:avg(repStats.map(s=>s.falsePositive)),
    baseDefectCatch:avg(repStats.map(s=>s.baseDefectCatch)), kBase:baseRates.length, kTriples:repStats.length });
}
fs.writeFileSync(path.join(DIR,"nx_results_weak.json"), JSON.stringify({K,MODEL,totalGen,failGen,deadVersions,liveVersions,totalCost,results},null,2));
log(`DONE gen=${totalGen} fail=${failGen} dead=${deadVersions} live=${liveVersions}`);
console.log(JSON.stringify(results,null,2));
