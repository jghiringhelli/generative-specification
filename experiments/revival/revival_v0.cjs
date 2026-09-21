#!/usr/bin/env node
/*
 * revival_v0.cjs — v0 of the discipline-revival analyzer (simple FILTER, not the portfolio/PCA).
 * Model: docs/discipline-revival-model.md. Point it at a GS-ready repo; it returns which
 * engineering disciplines are worth reviving/applying and the advantage each buys.
 *
 * Usage:  node revival_v0.cjs <repoPath> [inputs.json]
 *   inputs.json (optional): { "S":0..1, "L":0..1, "T":0..1, "R":0..1, "V":0..1 }
 *   S stakes/blast-radius · L longevity×change · T team/turnover · R audit/regulatory · V verifiability
 *
 * ALL practice parameters (cov, c_res, c_AI, h0) are PROVISIONAL — calibrate from data (chronicle
 * ledger outcomes). Numbers are DIRECTIONAL, not calibrated.
 */
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

// ---------- args ----------
const repo = process.argv[2];
if (!repo || !fs.existsSync(repo)) { console.error("usage: node revival_v0.cjs <repoPath> [inputs.json]"); process.exit(1); }
let inputs = { S: 0.5, L: 0.5, T: 0.5, R: 0.5, V: 0.5 }, inputsGiven = false;
if (process.argv[3] && fs.existsSync(process.argv[3])) {
  try { inputs = Object.assign(inputs, JSON.parse(fs.readFileSync(process.argv[3], "utf8"))); inputsGiven = true; } catch (e) {}
}
const sh = (c, o = {}) => { try { return cp.execSync(c, { cwd: repo, stdio: ["ignore", "pipe", "ignore"], timeout: 120000, ...o }).toString(); } catch (e) { return (e.stdout ? e.stdout.toString() : ""); } };

// ---------- gather source files ----------
const IGN = /(^|[\\/])(node_modules|\.git|dist|build|coverage|\.jscpd|out)([\\/]|$)/;
const SRC = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|java|rb)$/;
function walk(dir, acc = []) {
  let ents = []; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return acc; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (IGN.test(p)) continue;
    if (e.isDirectory()) walk(p, acc);
    else if (SRC.test(e.name)) acc.push(p);
  }
  return acc;
}
const srcRoot = fs.existsSync(path.join(repo, "src")) ? path.join(repo, "src") : repo;
const files = walk(srcRoot);
const isTest = f => /\.(test|spec)\.|(^|[\\/])(tests?|__tests__)[\\/]/.test(f);
const srcFiles = files.filter(f => !isTest(f));
const testFiles = walk(repo).filter(isTest);

// ---------- objective signals ----------
const signals = {};
// duplication %
(() => {
  const target = fs.existsSync(path.join(repo, "src")) ? "src" : ".";
  const out = sh(`npx --yes jscpd ${target} --reporters json --output .jscpd-cli --min-lines 5 --silent`, {});
  try {
    const rep = JSON.parse(fs.readFileSync(path.join(repo, ".jscpd-cli", "jscpd-report.json"), "utf8"));
    signals.dupPct = +(rep.statistics.total.percentage || 0);
  } catch (e) { signals.dupPct = null; }
  try { fs.rmSync(path.join(repo, ".jscpd-cli"), { recursive: true, force: true }); } catch (e) {}
})();
signals.srcCount = srcFiles.length;
signals.testCount = testFiles.length;
signals.testRatio = srcFiles.length ? testFiles.length / srcFiles.length : 0;
signals.filesOver400 = srcFiles.filter(f => { try { return fs.readFileSync(f, "utf8").split("\n").length > 400; } catch (e) { return false; } }).length;
// git churn: files touched most in last 90d
(() => {
  const out = sh(`git log --since="90 days ago" --name-only --pretty=format: -- .`);
  const counts = {};
  out.split("\n").map(s => s.trim()).filter(s => s && SRC.test(s)).forEach(f => counts[f] = (counts[f] || 0) + 1);
  const hot = Object.entries(counts).filter(([f, n]) => n >= 3).length;
  signals.churnHotFiles = hot;
  signals.commits90d = (sh(`git log --since="90 days ago" --oneline`).match(/\n/g) || []).length;
})();
// layer-hint: data-client calls inside route/controller/handler/entrypoint files
(() => {
  const DATA = /\b(prisma|knex|pg|mongoose|db|pool|sequelize|drizzle)\s*\.\s*\w/;
  const ROUTE = /(route|controller|handler|app|server|index|main|api)/i;
  let hits = 0;
  for (const f of srcFiles) {
    if (!ROUTE.test(path.basename(f))) continue;
    try { const t = fs.readFileSync(f, "utf8"); (t.match(new RegExp(DATA, "g")) || []).forEach(() => hits++); } catch (e) {}
  }
  signals.layerHits = hits;
})();

// ---------- failure modes & exposure λ ----------
// F: 0 logic-error, 1 layer-violation, 2 business-rule-drift, 3 config-contradiction,
//    4 silent-truncation, 5 spec-code-divergence, 6 unaudited-decision
const F = ["logic-error", "layer-violation", "business-rule-drift", "config-contradiction", "silent-truncation", "spec-code-divergence", "unaudited-decision"];
const clamp = (x) => Math.max(0, Math.min(1, x));
const dup = signals.dupPct == null ? 0.3 : clamp(signals.dupPct / 20);          // 20%+ = max
const testGap = clamp(1 - signals.testRatio);                                    // few tests = high gap
const bigFiles = clamp(signals.filesOver400 / Math.max(1, signals.srcCount) * 3);// share of oversized files
const churn = clamp(signals.churnHotFiles / Math.max(1, signals.srcCount) * 4);  // hot-spot density
const layer = clamp(signals.layerHits / 3);                                      // any data-in-route is bad
const L = inputs.L;
// λ per failure mode from signals (+ churn as a global amplifier). PROVISIONAL weights.
const lamBase = [
  0.5 * dup + 0.6 * testGap + 0.3 * bigFiles,   // logic-error
  0.9 * layer,                                   // layer-violation
  0.6 * dup + 0.4 * testGap,                     // business-rule-drift (duplicated constants / untested rules)
  0.5 * dup + 0.3,                               // config-contradiction (baseline; no dedicated detector in v0)
  0.7 * bigFiles + 0.3 * (signals.dupPct == null ? 0.3 : 0), // silent-truncation (big files don't fit context)
  0.6 * testGap + 0.4 * (1 - clamp(signals.testRatio)),      // spec-code-divergence
  0.5 + 0.3 * inputs.T,                          // unaudited-decision (baseline; scales with team)
];
const lam = lamBase.map(v => clamp(v * (0.7 + 0.6 * churn)));   // churn amplifies exposure everywhere

// ---------- impact κ per failure mode (PROVISIONAL base × project) ----------
const S = inputs.S, T = inputs.T, R = inputs.R;
const kBase = [3, 2, 4, 3, 2, 2, 3]; // hours-equivalent if it reaches prod (business-rule-drift highest)
const kap = kBase.map((k, i) => {
  let m = 0.5 + 0.5 * S;                          // stakes scale all
  if (i === 2 || i === 3) m *= 1 + 0.5 * R;       // business/config → audit exposure
  if (i === 6) m *= 1 + 0.6 * T + 0.4 * R;        // unaudited-decision → team + audit
  if (i === 1 || i === 5) m *= 1 + 0.3 * L;       // layer/divergence pay back over longevity
  return k * m;
});

// ---------- practice catalog (PROVISIONAL profiles) ----------
// cov: coverage over F (0..1). c_res: human-residual hours. c_AI: token hours. h0: pre-AI human hours.
const V = inputs.V;
const PRACTICES = [
  { id: "acceptance/contract tests", cov: [.7, .2, .8, .3, .3, .7, .2], c_res: 0.4, c_AI: 0.1, h0: 3, needV: 0.6 },
  { id: "mutation testing",          cov: [.9, 0, .5, 0, .2, .3, 0],   c_res: 0.2, c_AI: 0.2, h0: 8, needV: 0.7 },  // was dead: too costly by hand
  { id: "decision records / doc-cascade", cov: [0, .2, .5, .2, .2, .8, .95], c_res: 0.3, c_AI: 0.1, h0: 4, needV: 0 }, // tedious → dead
  { id: "sentinel / authored navigation", cov: [.2, .3, .3, .3, .8, .7, .3], c_res: 0.2, c_AI: 0.1, h0: 2, needV: 0 },
  { id: "layered boundaries + gate", cov: [.2, .95, .2, .1, .1, .3, .1], c_res: 0.2, c_AI: 0.1, h0: 2, needV: 0 },
  { id: "formal property spec",      cov: [.9, .3, .9, .5, .3, .8, .2], c_res: 0.9, c_AI: 0.3, h0: 20, needV: 0.8 }, // validated-but-dead (Loom = the revival)
  { id: "N-version",                 cov: [.8, 0, .4, .2, .7, .2, 0],  c_res: 0.95, c_AI: 0.4, h0: 25, needV: 0.6 }, // adjudication residual is high
  { id: "perspective-based reading", cov: [.3, .3, .5, .3, .3, .8, .7], c_res: 0.6, c_AI: 0.2, h0: 10, needV: 0 },  // PBR: validated, died on cost
];

// ---------- score ----------
const rows = PRACTICES.map(p => {
  // V gates verification practices (can't catch what you can't check)
  const vGate = p.needV ? clamp(V / p.needV) : 1;
  let benefit = 0, byMode = [];
  for (let i = 0; i < F.length; i++) {
    const b = p.cov[i] * lam[i] * kap[i] * vGate;
    benefit += b;
    if (b > 0.15) byMode.push([F[i], +b.toFixed(2)]);
  }
  byMode.sort((a, b) => b[1] - a[1]);
  const deadPreAI = benefit < p.h0;                 // human cost sank it
  const liveNow = benefit > (p.c_AI + p.c_res);     // cheap executor makes it pay
  let cls = "STILL-DEAD", why = "";
  if (liveNow && deadPreAI) { cls = "REVIVED"; why = `was dead by hand (cost ${p.h0}h > benefit ${benefit.toFixed(1)}h), now pays (residual ${(p.c_AI + p.c_res).toFixed(1)}h)`; }
  else if (liveNow && !deadPreAI) { cls = "ALWAYS-WORTH"; why = `benefit ${benefit.toFixed(1)}h ≥ its old cost ${p.h0}h — worth it even by hand`; }
  else { why = `benefit ${benefit.toFixed(1)}h ≤ residual ${(p.c_AI + p.c_res).toFixed(1)}h — not worth it here even cheap`; }
  const roi = benefit / (p.c_AI + p.c_res);         // benefit per residual hour
  return { id: p.id, benefit: +benefit.toFixed(2), roi: +roi.toFixed(1), cls, why, top: byMode.slice(0, 3), vGate: +vGate.toFixed(2) };
}).sort((a, b) => b.roi - a.roi);

// ---------- report ----------
const L1 = s => console.log(s);
L1("");
L1("=".repeat(78));
L1(`DISCIPLINE-REVIVAL v0  —  ${repo}`);
L1("=".repeat(78));
L1(`inputs ${inputsGiven ? "(from file)" : "(DEFAULTS 0.5 — pass inputs.json to refine)"}: S=${inputs.S} L=${inputs.L} T=${inputs.T} R=${inputs.R} V=${inputs.V}`);
L1(`signals: dup=${signals.dupPct == null ? "n/a" : signals.dupPct.toFixed(1) + "%"} · src=${signals.srcCount} · tests=${signals.testCount} (ratio ${signals.testRatio.toFixed(2)}) · files>400L=${signals.filesOver400} · churn-hot=${signals.churnHotFiles} · data-in-routes=${signals.layerHits}`);
L1(`exposure λ: ${F.map((f, i) => `${f}=${lam[i].toFixed(2)}`).join(" · ")}`);
L1("-".repeat(78));
L1("RANKED — apply top-down until your human-review budget is spent:");
L1("");
for (const r of rows) {
  const tag = r.cls === "REVIVED" ? "🟢 REVIVED   " : r.cls === "ALWAYS-WORTH" ? "🔵 ALWAYS     " : "⚫ STILL-DEAD ";
  L1(`${tag} ${r.id.padEnd(30)} benefit≈${String(r.benefit).padStart(5)}h  roi≈${String(r.roi).padStart(4)}`);
  if (r.top.length) L1(`             buys: ${r.top.map(([f, b]) => `${f} (${b}h)`).join(", ")}`);
  L1(`             ${r.why}${r.vGate < 1 ? `  [verifiability caps it: ×${r.vGate}]` : ""}`);
}
L1("-".repeat(78));
L1("PROVISIONAL: cov / c_res / c_AI / h0 are hand-set defaults; numbers are DIRECTIONAL, not");
L1("calibrated. λ (from detectors) is objective; κ, c_res, h0 need calibration from real outcomes.");
L1("=".repeat(78));

fs.writeFileSync(path.join(__dirname, "revival_v0.out.json"), JSON.stringify({ repo, inputs, inputsGiven, signals, lambda: F.reduce((o, f, i) => (o[f] = +lam[i].toFixed(3), o), {}), kappa: F.reduce((o, f, i) => (o[f] = +kap[i].toFixed(2), o), {}), practices: rows }, null, 2));
