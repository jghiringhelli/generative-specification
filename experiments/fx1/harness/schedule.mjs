// schedule.mjs: a seeded, blocked random run order for FX stages (moved from runner/ into the harness; same algorithm and output as before).
// Full factorial:  node schedule.mjs --stage fx0d --seed 20261010 --paths A,B --langs en --vendors anth,oai,goog --fixtures lendmark,stitchcount,tidewatch,cinderfall,shelfwise --reps 1 > schedule.csv
// Explicit cells:  node schedule.mjs --stage s1 --seed 7 --vendors anth --cells A:hive:en,A:kiln:es,A:lamp:en,A:tally:en,B:kiln:en,B:tally:es --reps 1 > schedule.csv
// One block = one repetition of every cell. Order inside a block = Fisher-Yates shuffle driven by the seed (mulberry32). Same arguments, same file, on any PC.
const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
for (const k of ['stage', 'seed', 'vendors', 'reps']) if (!a[k]) { console.error('missing --' + k); process.exit(2); }
const KEY = { hive: 'DEV-API-hivelog', kiln: 'DEV-CLI-kilnlog', lamp: 'DEV-PIPE-lampwatch', tally: 'DEV-GAME-tallyhouse', lendmark: 'FIX-API-lendmark', stitchcount: 'FIX-CLI-stitchcount', tidewatch: 'FIX-PIPE-tidewatch', cinderfall: 'FIX-GAME-cinderfall', shelfwise: 'FIX-MCP-shelfwise', habits: 'habits', shortly: 'shortly', rollup: 'rollup' };
let s = Number(a.seed) >>> 0;
const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const L = k => a[k].split(',');
let cells = [];
if (a.cells) for (const v of L('vendors')) for (const c of L('cells')) { const [p, f, l] = c.split(':'); cells.push({ p, l, v, f }); }
else for (const p of L('paths')) for (const l of L('langs')) for (const v of L('vendors')) for (const f of L('fixtures')) cells.push({ p, l, v, f });
for (const c of cells) if (!KEY[c.f]) { console.error('unknown fixture short name ' + c.f); process.exit(2); }
console.log('seq,block,id,path,lang,vendor,fixture,fixtureKey,rep');
let seq = 0;
for (let rep = 1; rep <= Number(a.reps); rep++) {
  const b = cells.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  for (const c of b) console.log([++seq, rep, `${a.stage}-${c.p}-${c.f}-${c.l}-${c.v}-r${rep}`, c.p, c.l, c.v, c.f, KEY[c.f], rep].join(','));
}
