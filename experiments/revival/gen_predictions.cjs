// Emit predictions.csv from EXPLICIT shape rules committed in the pre-registration §4.
// The three practices are predicted to have DIFFERENT shapes across the capability ladder; that
// difference is the falsifiable claim (F1/F2). Benefit is a normalized marginal-benefit in [0,1]
// (defects/violations caught, net of false-positive + residual cost). Run: node gen_predictions.cjs > predictions.csv
//
// Generators, weakest -> strongest (capability index g = 0..3), plus a cross-vendor frontier rung.
const GENERATORS = ['qwen1.5b', 'qwen3b', 'qwen7b', 'sonnet', 'xvendor'];
const capIndex = { 'qwen1.5b': 0, 'qwen3b': 1, 'qwen7b': 2, 'sonnet': 3, 'xvendor': 3 }; // xvendor ~ frontier
const TIERS = ['T0', 'T1', 'T2', 'T3'];
const tierDiff = { T0: 0, T1: 1, T2: 2, T3: 3 };

// Shape functions: benefit(practice, capability g in 0..3, difficulty d in 0..3).
// P1 N-version: HUMP over capability (dead at frontier via lambda~0; degraded at weakest via
//   dead-version residual; peak in the middle). Rises with difficulty (more exposure).
function p1(g, d) {
  if (d === 0) return 0;                       // T0: nothing to catch
  const capShape = [0.55, 0.9, 1.0, 0.12][g];  // hump: low@1.5b, peak@3b/7b, ~dead@frontier
  const diff = [0, 0.25, 0.55, 0.65][d];       // exposure grows with difficulty
  return round(capShape * diff);
}
// P2 Mutation testing: RECEDING with a non-zero FLOOR at the frontier on hard tiers
//   (even strong models write superficially-passing tests).
function p2(g, d) {
  if (d === 0) return 0;
  const capShape = [1.0, 0.72, 0.48, 0.34][g]; // monotone decreasing, but frontier stays > 0
  const diff = [0, 0.5, 0.6, 0.65][d];
  const floor = (g >= 3 && d >= 2) ? 0.2 : 0;  // explicit frontier floor on T2/T3
  return round(Math.max(capShape * diff, floor));
}
// P3 Property-spec: RECEDING toward ~0 at the frontier (strong models stop violating invariants);
//   distinctly LOWER than P2 at the frontier on hard tiers -> the key discriminating prediction.
function p3(g, d) {
  if (d === 0) return 0;
  const capShape = [1.0, 0.62, 0.34, 0.12][g]; // steeper decay, no floor
  const diff = [0, 0.5, 0.6, 0.65][d];
  return round(capShape * diff);
}
function round(x) { return Math.round(x * 100) / 100; }

function verdict(b) { return b >= 0.3 ? 'REVIVED' : b >= 0.1 ? 'MARGINAL' : 'STILL-DEAD'; }
// NULL region (§5): cells the model predicts ~0, which MUST verify (a positive there falsifies F3).
function inNull(practice, g, d) {
  if (d === 0) return true;                              // any practice, T0
  if (practice === 'P1' && g >= 3 && d <= 2) return true; // N-version at frontier within competence
  if (practice === 'P3' && g >= 3 && d <= 1) return true; // property-spec at frontier, easy tiers
  return false;
}

const fns = { P1: p1, P2: p2, P3: p3 };
const shapeName = { P1: 'hump', P2: 'receding+floor', P3: 'receding' };
const rows = [['practice', 'generator', 'tier', 'predicted_benefit', 'predicted_verdict', 'in_null_region', 'predicted_shape']];
for (const practice of ['P1', 'P2', 'P3'])
  for (const gen of GENERATORS)
    for (const tier of TIERS) {
      const g = capIndex[gen], d = tierDiff[tier];
      const b = fns[practice](g, d);
      rows.push([practice, gen, tier, b.toFixed(2), verdict(b), inNull(practice, g, d) ? 'yes' : 'no', shapeName[practice]]);
    }
console.log(rows.map(r => r.join(',')).join('\n'));
