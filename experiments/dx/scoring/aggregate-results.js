#!/usr/bin/env node
/**
 * DX experiment — results aggregator.
 *
 * Usage:
 *   node aggregate-results.js [vaquita-scores.jsonl] [taskflow-scores.jsonl]
 *
 * Reads one or more .jsonl files (output of score-fork.js --json),
 * groups results by condition (derived from fork URL prefix or --condition flag),
 * and produces:
 *   - per-condition mean score, std dev, and per-property breakdown
 *   - H1–H4 hypothesis test results (Mann-Whitney U approximation)
 *   - console summary + aggregate-results.json written to cwd
 *
 * Condition assignment:
 *   The script reads a side-car file `condition-map.json` (fork-url → "A" | "B")
 *   if present, otherwise uses --condition-map <path> argument.
 *   If no map is provided, scores are reported without group separation.
 *
 * Output:
 *   aggregate-results.json  — machine-readable full report
 *   (stdout)                — human-readable summary
 */

const fs = require('fs');
const path = require('path');

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const jsonlFiles = args.filter(a => a.endsWith('.jsonl'));
const conditionMapArg = (() => {
  const idx = args.indexOf('--condition-map');
  return idx >= 0 ? args[idx + 1] : null;
})();
const taskFilter = (() => {
  const idx = args.indexOf('--task');
  return idx >= 0 ? args[idx + 1] : null;
})();

if (jsonlFiles.length === 0) {
  console.error('Usage: node aggregate-results.js <file1.jsonl> [file2.jsonl] [--condition-map map.json] [--task vaquita|taskflow]');
  process.exit(2);
}

// ── Load condition map ────────────────────────────────────────────────────────

/**
 * Maps fork URL → group ("A" | "B").
 * @type {Record<string, string>}
 */
let conditionMap = {};

const candidateMapPath = conditionMapArg
  ?? path.join(path.dirname(jsonlFiles[0]), 'condition-map.json')
  ?? path.join(process.cwd(), 'condition-map.json');

if (fs.existsSync(candidateMapPath)) {
  conditionMap = JSON.parse(fs.readFileSync(candidateMapPath, 'utf8'));
  console.error(`Loaded condition map: ${candidateMapPath} (${Object.keys(conditionMap).length} entries)`);
} else {
  console.error('No condition-map.json found — scores will be reported without group separation.');
}

// ── Load scores ───────────────────────────────────────────────────────────────

/** @type {Array<{fork: string, task: string, totalPoints: number, maxPoints: number, checks: Array, group?: string}>} */
const allScores = [];

for (const file of jsonlFiles) {
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of lines) {
    try {
      const record = JSON.parse(line);
      if (taskFilter && record.task !== taskFilter) continue;
      record.group = conditionMap[record.fork] ?? 'unknown';
      allScores.push(record);
    } catch {
      console.error(`Skipping malformed line in ${file}: ${line.slice(0, 80)}`);
    }
  }
}

if (allScores.length === 0) {
  console.error('No valid score records found.');
  process.exit(1);
}

console.error(`Loaded ${allScores.length} score records.`);

// ── Statistical helpers ───────────────────────────────────────────────────────

/**
 * Arithmetic mean.
 * @param {number[]} values
 * @returns {number}
 */
function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Sample standard deviation.
 * @param {number[]} values
 * @returns {number}
 */
function stdDev(values) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Mann-Whitney U statistic and approximate two-tailed p-value.
 * Uses normal approximation (valid for n > 20; reported as approximate for smaller samples).
 *
 * @param {number[]} groupA
 * @param {number[]} groupB
 * @returns {{ u: number, z: number, p: string, significant: boolean }}
 */
function mannWhitneyU(groupA, groupB) {
  const n1 = groupA.length;
  const n2 = groupB.length;
  if (n1 === 0 || n2 === 0) return { u: 0, z: 0, p: 'N/A', significant: false };

  let u1 = 0;
  for (const a of groupA) {
    for (const b of groupB) {
      if (a > b) u1 += 1;
      else if (a === b) u1 += 0.5;
    }
  }
  const u2 = n1 * n2 - u1;
  const u = Math.min(u1, u2);

  const mu = (n1 * n2) / 2;
  const sigma = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
  const z = sigma === 0 ? 0 : (u - mu) / sigma;

  // Two-tailed p approximation via standard normal CDF
  const p = 2 * (1 - standardNormalCDF(Math.abs(z)));
  const pStr = p < 0.001 ? '<0.001' : p.toFixed(3);

  return { u, z: parseFloat(z.toFixed(3)), p: pStr, significant: p < 0.05 };
}

/**
 * Standard normal CDF approximation (Horner's method).
 * @param {number} x
 * @returns {number}
 */
function standardNormalCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const poly = t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.8212560 + t * 1.3302744))));
  const p = 1 - d * poly;
  return x < 0 ? 1 - p : p;
}

/**
 * Effect size r = Z / sqrt(N).
 * @param {number} z
 * @param {number} n
 * @returns {string}
 */
function effectSizeR(z, n) {
  if (n === 0) return 'N/A';
  const r = Math.abs(z) / Math.sqrt(n);
  if (r < 0.1) return `${r.toFixed(3)} (negligible)`;
  if (r < 0.3) return `${r.toFixed(3)} (small)`;
  if (r < 0.5) return `${r.toFixed(3)} (medium)`;
  return `${r.toFixed(3)} (large)`;
}

// ── Group scores ──────────────────────────────────────────────────────────────

const tasks = [...new Set(allScores.map(s => s.task))].sort();
const groups = [...new Set(allScores.map(s => s.group))].sort();
const properties = [...new Set(allScores.flatMap(s => s.checks.map(c => c.property)))].sort();

/**
 * Get scores for a specific task and group.
 * @param {string} task
 * @param {string} group
 * @returns {typeof allScores}
 */
function getScores(task, group) {
  return allScores.filter(s => s.task === task && s.group === group);
}

// ── Build report ──────────────────────────────────────────────────────────────

const report = {
  generatedAt: new Date().toISOString(),
  totalParticipants: allScores.length,
  tasks,
  groups,
  byTask: {},
  hypotheses: {},
};

for (const task of tasks) {
  report.byTask[task] = { groups: {}, comparison: null };

  for (const group of groups) {
    const scores = getScores(task, group);
    const points = scores.map(s => s.totalPoints);
    const propertyBreakdown = {};

    for (const prop of properties) {
      const propPoints = scores.map(s => {
        const checks = s.checks.filter(c => c.property === prop);
        return checks.reduce((sum, c) => sum + (c.points ?? 0), 0);
      });
      propertyBreakdown[prop] = {
        mean: parseFloat(mean(propPoints).toFixed(2)),
        max: Math.max(...propPoints, 0),
        passRate: propPoints.length > 0
          ? `${Math.round((propPoints.filter(p => p > 0).length / propPoints.length) * 100)}%`
          : 'N/A',
      };
    }

    report.byTask[task].groups[group] = {
      n: scores.length,
      mean: parseFloat(mean(points).toFixed(2)),
      stdDev: parseFloat(stdDev(points).toFixed(2)),
      min: Math.min(...points, 0),
      max: Math.max(...points, 0),
      median: [...points].sort((a, b) => a - b)[Math.floor(points.length / 2)] ?? 0,
      propertyBreakdown,
    };
  }

  // Comparison: A vs B (if both groups present)
  if (report.byTask[task].groups['A'] && report.byTask[task].groups['B']) {
    const aPoints = getScores(task, 'A').map(s => s.totalPoints);
    const bPoints = getScores(task, 'B').map(s => s.totalPoints);
    const mwu = mannWhitneyU(aPoints, bPoints);
    report.byTask[task].comparison = {
      mannWhitneyU: mwu.u,
      z: mwu.z,
      p: mwu.p,
      significant: mwu.significant,
      effectSize: effectSizeR(mwu.z, aPoints.length + bPoints.length),
      direction: mean(bPoints) > mean(aPoints) ? 'B > A' : mean(aPoints) > mean(bPoints) ? 'A > B' : 'A = B',
    };
  }
}

// ── Hypothesis tests ──────────────────────────────────────────────────────────

const allTasksWithBothGroups = tasks.filter(t =>
  report.byTask[t].groups['A'] && report.byTask[t].groups['B']
);

// H1: GS (B) scores higher than prompt-driven (A) on same task
const h1Results = allTasksWithBothGroups.map(task => ({
  task,
  result: report.byTask[task].comparison,
  bMean: report.byTask[task].groups['B']?.mean ?? 0,
  aMean: report.byTask[task].groups['A']?.mean ?? 0,
}));
report.hypotheses.H1 = {
  description: 'Group B (GS+ForgeCraft) scores higher than Group A (prompt-driven) on same task',
  results: h1Results,
  supported: h1Results.every(r => r.bMean > r.aMean && r.result?.significant),
};

// H2: B requires fewer interventions — data comes from INTERVENTION_LOG (manual, not automated)
report.hypotheses.H2 = {
  description: 'Group B requires fewer human interventions (from INTERVENTION_LOG)',
  note: 'Manual scoring required — load intervention-log-counts.json to compute',
  supported: null,
};

// H3: B has better Bounded + Composable scores
const h3Results = allTasksWithBothGroups.map(task => {
  const bBounded = report.byTask[task].groups['B']?.propertyBreakdown['Bounded']?.mean ?? 0;
  const aBounded = report.byTask[task].groups['A']?.propertyBreakdown['Bounded']?.mean ?? 0;
  const bComposable = report.byTask[task].groups['B']?.propertyBreakdown['Composable']?.mean ?? 0;
  const aComposable = report.byTask[task].groups['A']?.propertyBreakdown['Composable']?.mean ?? 0;
  return { task, bBounded, aBounded, bComposable, aComposable };
});
report.hypotheses.H3 = {
  description: 'Group B scores higher on Bounded and Composable (architectural completeness)',
  results: h3Results,
  supported: h3Results.every(r => r.bBounded >= r.aBounded && r.bComposable >= r.aComposable),
};

// H4: Gap widens on brownfield (taskflow) vs greenfield (vaquita)
const h4 = (() => {
  const greenfield = report.byTask['vaquita']?.comparison;
  const brownfield = report.byTask['taskflow']?.comparison;
  if (!greenfield || !brownfield) return { supported: null, note: 'Both tasks required' };
  const gfGap = (report.byTask['vaquita'].groups['B']?.mean ?? 0) - (report.byTask['vaquita'].groups['A']?.mean ?? 0);
  const bfGap = (report.byTask['taskflow'].groups['B']?.mean ?? 0) - (report.byTask['taskflow'].groups['A']?.mean ?? 0);
  return {
    greenfieldGap: parseFloat(gfGap.toFixed(2)),
    brownfieldGap: parseFloat(bfGap.toFixed(2)),
    supported: bfGap > gfGap,
  };
})();
report.hypotheses.H4 = {
  description: 'Quality gap between B and A widens on brownfield (taskflow) vs greenfield (vaquita)',
  ...h4,
};

// ── Write output ──────────────────────────────────────────────────────────────

const outPath = path.join(process.cwd(), 'aggregate-results.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.error(`Report written to ${outPath}`);

// ── Print summary ─────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║           DX EXPERIMENT — AGGREGATE RESULTS              ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log(`Total participants scored: ${report.totalParticipants}`);
console.log(`Tasks: ${tasks.join(', ')}  |  Groups: ${groups.join(', ')}\n`);

for (const task of tasks) {
  const taskData = report.byTask[task];
  console.log(`─── Task: ${task.toUpperCase()} ─────────────────────────────────`);

  for (const group of groups) {
    const g = taskData.groups[group];
    if (!g) continue;
    console.log(`  Group ${group} (n=${g.n}): mean=${g.mean}/10  sd=${g.stdDev}  median=${g.median}  range=[${g.min}–${g.max}]`);
    for (const [prop, data] of Object.entries(g.propertyBreakdown)) {
      console.log(`    ${prop.padEnd(16)} mean=${String(data.mean).padEnd(5)} pass=${data.passRate}`);
    }
  }

  if (taskData.comparison) {
    const c = taskData.comparison;
    const sig = c.significant ? '✅ SIGNIFICANT' : '❌ not significant';
    console.log(`\n  A vs B: ${c.direction}  U=${c.mannWhitneyU}  z=${c.z}  p=${c.p}  r=${c.effectSize}  ${sig}\n`);
  }
}

console.log('─── Hypotheses ──────────────────────────────────────────────');

const h1 = report.hypotheses.H1;
console.log(`H1 (GS scores higher):           ${h1.supported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'}`);
for (const r of h1.results) {
  const direction = r.bMean > r.aMean ? `B=${r.bMean} > A=${r.aMean}` : `A=${r.aMean} >= B=${r.bMean}`;
  console.log(`   ${r.task}: ${direction}  p=${r.result?.p ?? 'N/A'}`);
}

console.log(`H2 (fewer interventions):         ${report.hypotheses.H2.note}`);

const h3 = report.hypotheses.H3;
console.log(`H3 (better Bounded+Composable):   ${h3.supported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'}`);
for (const r of h3.results) {
  console.log(`   ${r.task}: Bounded B=${r.bBounded} A=${r.aBounded}  Composable B=${r.bComposable} A=${r.aComposable}`);
}

const h4r = report.hypotheses.H4;
if (h4r.supported !== null) {
  console.log(`H4 (gap widens brownfield):       ${h4r.supported ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'}`);
  console.log(`   greenfield gap=${h4r.greenfieldGap}  brownfield gap=${h4r.brownfieldGap}`);
} else {
  console.log(`H4 (gap widens brownfield):       ${h4r.note}`);
}

console.log('\n────────────────────────────────────────────────────────────');
console.log(`Full report: ${outPath}\n`);
