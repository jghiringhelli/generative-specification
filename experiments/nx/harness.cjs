// NX harness — generate baseline(1)+nversion(3) via agentic claude -p (writes a file we READ),
// run vs oracle, compute revival metrics. Serial, RAM-light. Usage: node harness.cjs [k]
const fs = require("fs"), path = require("path");
const { spawnSync } = require("child_process");
const { PROBLEMS, battery } = require("./problems.cjs");

const K = parseInt(process.argv[2] || "1", 10);
const MODEL = "claude-sonnet-4-5";
const DIR = __dirname, VDIR = path.join(DIR, "versions"), TMP = path.join(DIR, ".tmp");
fs.mkdirSync(TMP, { recursive: true });
const log = m => { const s = `[${new Date().toISOString().slice(11,19)}] ${m}`; console.log(s); fs.appendFileSync(path.join(DIR,"nx.log"), s+"\n"); };
const FRAMINGS = ["", "Write it in a clean, minimal functional style.", "Be careful and defensive: handle boundary and edge cases explicitly."];
const NOTE = "\n\nCreate exactly ONE CommonJS module file in the current directory implementing this, with module.exports set to the function. Do not create tests or extra files.";

function extractCode(text){ const f=text.match(/```(?:js|javascript|cjs)?\s*([\s\S]*?)```/i); return (f?f[1]:text).trim(); }

function genOne(spec, framing) {
  const cwd = fs.mkdtempSync(path.join(TMP, "gen_"));
  const prompt = (framing ? framing + "\n\n" : "") + spec + NOTE;
  const r = spawnSync("claude", ["-p","--dangerously-skip-permissions","--output-format","json","--model",MODEL],
    { cwd, input: prompt, encoding: "utf-8", timeout: 240000, maxBuffer: 64*1024*1024, shell: process.platform === "win32" });
  let cost = 0, resultText = "";
  try { const j = JSON.parse(r.stdout); cost = j.total_cost_usd || 0; resultText = j.result || ""; } catch(e){}
  let code = null;
  try {
    const files = fs.readdirSync(cwd).filter(f => /\.(c?js)$/.test(f) && !/test/i.test(f));
    let best=null, bestScore=-1;
    for (const f of files) { const c=fs.readFileSync(path.join(cwd,f),"utf-8"); const s=(c.includes("module.exports")?100:0)+c.length/1000; if(s>bestScore){bestScore=s;best=c;} }
    if (best) code = best.trim();
  } catch(e){}
  if (!code && resultText) code = extractCode(resultText);
  try { fs.rmSync(cwd, { recursive:true, force:true }); } catch(e){}
  return { code: code || null, cost, err: code ? null : "no-code" };
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

const results = []; let totalGen=0, failGen=0, totalCost=0;
for (const p of PROBLEMS) {
  log(`=== ${p.id} (${p.category}) ===`);
  const inputs = battery(p, 300);
  const oracle = inputs.map(inp => p.oracle(...inp.map(x=> x&&typeof x==="object"?JSON.parse(JSON.stringify(x)):x)));
  const baseRates=[], baseDefectMask=inputs.map(()=>0);
  for (let rep=0; rep<K; rep++) {
    const g=genOne(p.spec,""); totalGen++; totalCost+=g.cost;
    if(!g.code){ failGen++; log(`  baseline/${rep} GEN FAIL`); continue; }
    const vp=writeVersion(p,"baseline",rep,"v0",g.code); const outs=runVersion(vp,inputs);
    let w=0; outs.forEach((o,i)=>{ if(wrong(o,oracle[i])){w++;baseDefectMask[i]++;} });
    baseRates.push(w/inputs.length); log(`  baseline/${rep} defect-rate=${(w/inputs.length*100).toFixed(1)}%`);
  }
  const nBV=baseRates.length||1; inputs.forEach((_,i)=>baseDefectMask[i]/=nBV);
  const repStats=[];
  for (let rep=0; rep<K; rep++) {
    let triple=[];
    for (let v=0; v<3; v++) {
      const g=genOne(p.spec,FRAMINGS[v]); totalGen++; totalCost+=g.cost;
      if(!g.code){ failGen++; log(`  nver/${rep}/v${v} GEN FAIL`); continue; }
      const vp=writeVersion(p,"nversion",rep,`v${v}`,g.code); triple.push(runVersion(vp,inputs));
    }
    const live = triple.filter(outs => outs.filter(o=>o.ok).length > inputs.length*0.1);
    if (live.length < 2) { log(`  nver/${rep} <2 LIVE versions (dead gens), skip`); continue; }
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
fs.writeFileSync(path.join(DIR,"nx_results.json"), JSON.stringify({K,MODEL,totalGen,failGen,totalCost,results},null,2));
log(`DONE gen=${totalGen} fail=${failGen} cost=$${totalCost.toFixed(3)}`);
console.log(JSON.stringify(results,null,2));
