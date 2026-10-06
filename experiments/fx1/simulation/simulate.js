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
const nGrid = [10, 20, 30, 50, 75, 100, 150, 200, 250, 300, 400, 600];
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
fs.writeFileSync(path.join(__dirname, 'results.md'), md);
console.log('written results.json and results.md');
