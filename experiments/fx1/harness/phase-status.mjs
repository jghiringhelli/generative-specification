// phase-status.mjs: what is running, what finished, what it used. Safe to call any time; reads only logs, never outcome data (no reports).
// usage: FX_ROOT=... node phase-status.mjs [phase]
import fs from 'node:fs';
import { paths as getPaths } from './lib/config.mjs';
import { summary, capStatus } from './lib/ledger.mjs';
const paths = getPaths({ noFormulas: true });
const ph = process.argv[2];
for (const n of ph ? [ph] : [1, 2, 3]) {
  const f = `${paths.root}/phase-${n}-status.json`;
  if (!fs.existsSync(f)) continue;
  const s = JSON.parse(fs.readFileSync(f, 'utf8'));
  console.log(`phase ${n}: started ${s.started}${s.done ? ` ended ${s.ended} exit ${s.exit}` : ' (RUNNING or interrupted)'}; jobs ${s.jobs.length}`);
  for (const j of s.jobs.slice(-6)) console.log(`  ${j.at} ${j.name} -> ${j.result}`);
  const lf = `${paths.root}/phase-${n}.log`;
  if (fs.existsSync(lf)) console.log('  log tail: ' + fs.readFileSync(lf, 'utf8').trim().split('\n').slice(-2).join(' | ').slice(0, 300));
}
const cells = fs.existsSync(paths.cells) ? fs.readdirSync(paths.cells) : [];
const st = {};
for (const c of cells) { let s = 'no-meta'; try { s = JSON.parse(fs.readFileSync(`${paths.cells}/${c}/logs/meta.json`, 'utf8')).status || '?'; } catch {} if (/\.void\d+$/.test(c)) s = 'archived-void'; st[s] = (st[s] || 0) + 1; }
console.log('cells by status:', JSON.stringify(st));
const s = summary(paths);
console.log(`ledger: ${s.calls} calls, ${s.errors} errors (${s.infraErrors} infrastructure), premium est ${s.premium} (multiplier unknown on ${s.premiumUnknownCalls} calls), tokens in/out ${s.tokensIn}/${s.tokensOut}, usd (Claude route) ${s.usd.toFixed(2)}`);
console.log('models served:', JSON.stringify(s.byModel));
for (const stage of ['critic', 'practitioner', 's1', 'dry']) { const c = capStatus(paths, stage); if (Object.keys(c.caps).length) console.log(`caps ${stage}: used ${JSON.stringify(c.used)} caps ${JSON.stringify(c.caps)} hard=${c.hard} soft=${c.soft}`); }
console.log(fs.existsSync(paths.stop) ? 'STOP file present: ' + fs.readFileSync(paths.stop, 'utf8').trim() : 'no STOP file');
