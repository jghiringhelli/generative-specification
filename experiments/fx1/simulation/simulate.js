'use strict';
// FX-1 sample-size simulation. No model is contacted. Node only, no dependencies.
// Usage: node simulate.js [--quick]   -> writes results.json and results.md next to this file.
// All success rates are ASSUMPTIONS (scenarios), not measurements.
const fs = require('fs');
const path = require('path');
const Z = 1.959963984540054; // two-sided 95%
const THETA = 0.90;          // registered per-element target
const THETA_ALL = 0.80;      // registered project-level target (all items present and working)

function wilson(k, n, z = Z) {
  if (n === 0) return [0, 1];
  const p = k / n, z2 = z * z, d = 1 + z2 / n;
  const c = (p + z2 / (2 * n)) / d;
  const h = (z * Math.sqrt(p * (1 - p) / n + z2 / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
const LF = [0, 0];
function lf(n) { while (LF.length <= n) LF.push(LF[LF.length - 1] + Math.log(LF.length)); return LF[n]; }
function binomPmf(k, n, p) {
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(lf(n) - lf(k) - lf(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
// exact classification probabilities for a target theta
function classify(n, p, theta) {
  let meets = 0, fails = 0, indec = 0;
  for (let k = 0; k <= n; k++) {
    const w = binomPmf(k, n, p);
    const [lo, hi] = wilson(k, n);
    if (lo >= theta) meets += w; else if (hi < theta) fails += w; else indec += w;
  }
  return { meets, fails, indec };
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function gammaSample(shape, rnd) { // Marsaglia-Tsang
  if (shape < 1) { const u = rnd(); return gammaSample(shape + 1, rnd) * Math.pow(u, 1 / shape); }
  const d = shape - 1 / 3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do {
      const u1 = rnd(), u2 = rnd();
      x = Math.sqrt(-2 * Math.log(u1 || 1e-12)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rnd();
    if (u < 1 - 0.0331 * x ** 4 || Math.log(u || 1e-12) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function betaSample(a, b, rnd) { const x = gammaSample(a, rnd), y = gammaSample(b, rnd); return x / (x + y); }
function binomSample(n, p, rnd) { let k = 0; for (let i = 0; i < n; i++) if (rnd() < p) k++; return k; }
const r3 = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, +v.toFixed(3)]));

const quick = process.argv.includes('--quick');
const out = { generated_by: 'simulate.js', theta: THETA, theta_all: THETA_ALL, z: Z, quick };

// 1. Wilson widths
const nGrid = [10, 20, 30, 50, 75, 100, 150, 200, 210, 250, 300, 400, 600];
const phats = [0.5, 0.8, 0.9, 0.95, 0.98];
out.widths = nGrid.map(n => {
  const row = { n };
  for (const ph of phats) { const k = Math.round(ph * n); const [lo, hi] = wilson(k, n); row['w_' + ph] = +(hi - lo).toFixed(3); }
  return row;
});

// 2. Exact classification, homogeneous (independent runs, one true rate), per-element target
const pGrid = [0.70, 0.75, 0.80, 0.85, 0.90, 0.93, 0.95, 0.97, 0.98, 0.99];
const nClass = [50, 100, 150, 180, 210, 240, 300, 400, 600];
out.exact = [];
for (const n of nClass) for (const p of pGrid) out.exact.push({ n, p, ...r3(classify(n, p, THETA)) });

// 2b. Rung probabilities and conjunction over 12 elements (independent and perfectly correlated bounds)
function rungs(n, p) {
  let r3p = 0, r2 = 0, r1 = 0, r0 = 0;
  for (let k = 0; k <= n; k++) { const w = binomPmf(k, n, p); const lo = wilson(k, n)[0]; if (lo >= 0.9) r3p += w; else if (lo >= 0.8) r2 += w; else if (lo >= 0.5) r1 += w; else r0 += w; }
  return { lb_ge_090: r3p, lb_080_090: r2, lb_050_080: r1, lb_lt_050: r0 };
}
out.rungs = []; out.conj = [];
for (const n of [150, 180, 210, 240, 300]) for (const p of pGrid) { out.rungs.push({ n, p, ...r3(rungs(n, p)) }); const m = rungs(n, p).lb_ge_090; out.conj.push({ n, p, per_element: +m.toFixed(3), all12_independent: +Math.pow(m, 12).toFixed(3), all12_perfectly_correlated: +m.toFixed(3) }); }

// 2c. Joint simulation of the headline claim CONJ-s: twelve elements per run, all twelve intervals >= 0.90 AND the all-twelve rate >= 0.80.
// Correlation models: independent; "run quality" (each run draws q ~ Beta around p, elements independent given q); all-or-nothing (a run is clean or not).
function conjSim(n, p, model, reps, rnd) {
  let ok = 0, allEl = 0, allRate = 0;
  for (let r = 0; r < reps; r++) {
    const cnt = new Array(12).fill(0); let full = 0;
    for (let i = 0; i < n; i++) {
      let all = true;
      if (model === 'allornothing') { const clean = rnd() < p; for (let e = 0; e < 12; e++) { if (clean) cnt[e]++; } all = clean; }
      else {
        const q = model === 'quality' ? Math.min(0.9999, Math.max(0.5, betaSample(p * 40, (1 - p) * 40, rnd))) : p;
        for (let e = 0; e < 12; e++) { if (rnd() < q) cnt[e]++; else all = false; }
      }
      if (all) full++;
    }
    const el = cnt.every(k => wilson(k, n)[0] >= 0.9), al = wilson(full, n)[0] >= 0.8;
    if (el) allEl++; if (al) allRate++; if (el && al) ok++;
  }
  return { p_all12_elements_meet: +(allEl / reps).toFixed(3), p_all12_rate_ge_080: +(allRate / reps).toFixed(3), p_conj: +(ok / reps).toFixed(3) };
}
out.conj_joint = [];
{
  const rnd = mulberry32(777); const REPS2 = quick ? 150 : 600;
  for (const model of ['independent', 'quality', 'allornothing']) for (const p of [0.95, 0.97, 0.98, 0.99, 0.995]) out.conj_joint.push({ n: 210, model, p, ...conjSim(210, p, model, REPS2, rnd) });
}
out.clear080 = [0.8, 0.85, 0.9, 0.93, 0.95, 0.97].map(p => { let m = 0; for (let k = 0; k <= 210; k++) if (wilson(k, 210)[0] >= 0.8) m += binomPmf(k, 210, p); return { n: 210, p, p_lb_ge_080: +m.toFixed(3) }; });
// Audit adjustment (a sensitivity analysis, not a conjunct of the rung): conservative bound after subtracting the Clopper-Pearson upper limit of the false-PASS rate.
function cpUpper(k, n, alpha = 0.05) { let lo = 0, hi = 1; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; let c = 0; for (let j = 0; j <= k; j++) c += binomPmf(j, n, mid); if (c > alpha / 2) lo = mid; else hi = mid; } return (lo + hi) / 2; }
out.audit = [50, 100, 150, 200].map(na => ({ audited_pass_judgments: na, false_pass_upper_limit_if_zero_errors: +cpUpper(0, na).toFixed(3), observed_passes_needed_at_n210_for_adjusted_bound_090: (() => { for (let k = 0; k <= 210; k++) { const adj = Math.round(k * (1 - cpUpper(0, na))); if (wilson(adj, 210)[0] >= 0.9) return k; } return null; })() }));

// 3. Project-level all-items rate vs THETA_ALL, exact
const qGrid = [0.50, 0.65, 0.75, 0.85, 0.90, 0.95];
out.exact_all = [];
for (const n of nClass) for (const q of qGrid) out.exact_all.push({ n, q, vs80: r3(classify(n, q, THETA_ALL)), vs90: r3(classify(n, q, 0.90)) });

// 4. Heterogeneity across cells (fixture x vendor = 15 cells); decision needs BOTH pooled Wilson and cell-bootstrap lower bounds >= THETA
const C = 15, REPS = quick ? 300 : 1000, B = quick ? 200 : 400;
const mus = { pessimistic: 0.85, central: 0.93, optimistic: 0.97 };
const kappas = { homogeneous: Infinity, moderate: 30, strong: 10 };
const mGrid = [8, 10, 12, 14, 16, 20, 24];
function cellBootLB(counts, m, rnd) {
  const ests = new Array(B);
  for (let b = 0; b < B; b++) {
    let s = 0;
    for (let i = 0; i < counts.length; i++) s += counts[(rnd() * counts.length) | 0];
    ests[b] = s / (counts.length * m);
  }
  ests.sort((a, b) => a - b);
  return ests[Math.floor(0.025 * B)];
}
out.hetero = [];
for (const [sname, mu] of Object.entries(mus)) for (const [kname, kap] of Object.entries(kappas)) for (const m of mGrid) {
  const rnd = mulberry32(12345 + m * 7 + Math.round(mu * 1000) + (isFinite(kap) ? kap : 0));
  let meetsW = 0, meetsBoth = 0, failsW = 0, widthSum = 0;
  for (let r = 0; r < REPS; r++) {
    const counts = []; let K = 0;
    for (let c = 0; c < C; c++) {
      const pc = isFinite(kap) ? betaSample(mu * kap, (1 - mu) * kap, rnd) : mu;
      const k = binomSample(m, pc, rnd); counts.push(k); K += k;
    }
    const n = C * m; const [lo, hi] = wilson(K, n); widthSum += hi - lo;
    if (lo >= THETA) { meetsW++; if (cellBootLB(counts, m, rnd) >= THETA) meetsBoth++; }
    if (hi < THETA) failsW++;
  }
  out.hetero.push({
    scenario: sname, mu, heterogeneity: kname, runs_per_cell: m, n_pooled: C * m,
    p_meets_wilson: +(meetsW / REPS).toFixed(3), p_meets_both: +(meetsBoth / REPS).toFixed(3),
    p_fails: +(failsW / REPS).toFixed(3), p_indecisive_both: +(1 - meetsBoth / REPS - failsW / REPS).toFixed(3),
    mean_wilson_width: +(widthSum / REPS).toFixed(3)
  });
}
fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(out, null, 1));

let md = '# FX-1 sample-size simulation (generated by simulate.js; all rates are assumptions)\n\n';
md += `Per-element target theta = ${THETA}; project-level target = ${THETA_ALL}. MEETS = lower 95% Wilson bound >= target; FAILS = upper bound < target; INDECISIVE = otherwise.\n\n`;
md += '## Wilson 95% full interval width by n (rounded observed rate)\n\n| n | p=0.5 | p=0.8 | p=0.9 | p=0.95 | p=0.98 |\n|---|---|---|---|---|---|\n';
for (const r of out.widths) md += `| ${r.n} | ${r['w_0.5']} | ${r['w_0.8']} | ${r['w_0.9']} | ${r['w_0.95']} | ${r['w_0.98']} |\n`;
md += '\n## Exact classification, one stream, per-element target 0.90 (independent runs, homogeneous true rate)\n\n| n | true p | P(MEETS) | P(FAILS) | P(INDECISIVE) |\n|---|---|---|---|---|\n';
for (const r of out.exact) md += `| ${r.n} | ${r.p} | ${r.meets} | ${r.fails} | ${r.indec} |\n`;
md += '\n## Exact classification of the all-items rate (target 0.80; last column: P(MEETS) against 0.90)\n\n| n | true q | P(MEETS 0.80) | P(FAILS 0.80) | P(INDEC 0.80) | P(MEETS 0.90) |\n|---|---|---|---|---|---|\n';
for (const r of out.exact_all) md += `| ${r.n} | ${r.q} | ${r.vs80.meets} | ${r.vs80.fails} | ${r.vs80.indec} | ${r.vs90.meets} |\n`;
md += `\n## Heterogeneity across 15 cells (5 fixtures x 3 vendors); decision requires pooled Wilson AND cell-bootstrap lower bounds >= 0.90 (${REPS} reps, ${B} bootstrap draws)\n\n| scenario | mu | heterogeneity | runs/cell | n | P(MEETS both) | P(FAILS) | P(INDECISIVE) | mean Wilson width |\n|---|---|---|---|---|---|---|---|---|\n`;
for (const r of out.hetero) md += `| ${r.scenario} | ${r.mu} | ${r.heterogeneity} | ${r.runs_per_cell} | ${r.n_pooled} | ${r.p_meets_both} | ${r.p_fails} | ${r.p_indecisive_both} | ${r.mean_wilson_width} |\n`;
md += '\n## Joint simulation of the headline claim CONJ (n = 210 per stream; every element at rate p; all twelve intervals >= 0.90 and the all-twelve rate bound >= 0.80)\n\n| correlation model | p | P(all 12 elements MEET) | P(all-12 rate bound >= 0.80) | P(CONJ) |\n|---|---|---|---|---|\n';
for (const r of out.conj_joint) md += `| ${r.model} | ${r.p} | ${r.p_all12_elements_meet} | ${r.p_all12_rate_ge_080} | ${r.p_conj} |\n`;
md += '\n## Probability that one element clears the 0.80 rung (n = 210)\n\n| true p | P(lower bound >= 0.80) |\n|---|---|\n';
for (const r of out.clear080) md += `| ${r.p} | ${r.p_lb_ge_080} |\n`;
md += '\n## Audit adjustment as a sensitivity analysis: audited PASS judgments, and what the adjustment costs\n\n| audited PASS judgments (zero false-PASS found) | upper limit of the false-PASS rate | PASS count needed out of 210 for an adjusted bound >= 0.90 |\n|---|---|---|\n';
for (const r of out.audit) md += `| ${r.audited_pass_judgments} | ${r.false_pass_upper_limit_if_zero_errors} | ${r.observed_passes_needed_at_n210_for_adjusted_bound_090 === null ? 'unreachable' : r.observed_passes_needed_at_n210_for_adjusted_bound_090} |\n`;
fs.writeFileSync(path.join(__dirname, 'results.md'), md);
console.log('written results.json and results.md');
