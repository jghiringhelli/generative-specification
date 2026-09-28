// Self-test: run every oracle on its full battery and confirm each invariant holds on the ORACLE's
// own output. A failure means the oracle or an invariant is wrong — fix before committing/DOI.
const { PROBLEMS, battery } = require('./problems.cjs');

let failures = 0, total = 0;
for (const p of PROBLEMS) {
  const inputs = battery(p, 300);
  let oracleErrors = 0, invFails = {};
  for (const args of inputs) {
    total++;
    let out;
    try { out = p.oracle(...args); } catch (e) { oracleErrors++; if (oracleErrors <= 2) console.log(`  [${p.id}] ORACLE THREW on ${JSON.stringify(args)}: ${e.message}`); continue; }
    for (const inv of (p.invariants || [])) {
      let ok; try { ok = inv.check(args, out); } catch (e) { ok = false; }
      if (!ok) { invFails[inv.name] = (invFails[inv.name] || 0) + 1; if (invFails[inv.name] <= 2) console.log(`  [${p.id}] INVARIANT '${inv.name}' FAILED on ${JSON.stringify(args)} -> ${JSON.stringify(out)}`); }
    }
  }
  const bad = oracleErrors + Object.values(invFails).reduce((a, b) => a + b, 0);
  failures += bad;
  const tag = bad === 0 ? 'OK ' : 'FAIL';
  console.log(`[${tag}] ${p.id.padEnd(20)} tier=${p.tier} battery=${inputs.length} invariants=${(p.invariants || []).length} errors=${oracleErrors} invFails=${JSON.stringify(invFails)}`);
}
console.log(`\n${failures === 0 ? 'ALL CLEAN' : failures + ' FAILURES'} across ${PROBLEMS.length} problems, ${total} oracle evaluations.`);
process.exit(failures === 0 ? 0 : 1);
