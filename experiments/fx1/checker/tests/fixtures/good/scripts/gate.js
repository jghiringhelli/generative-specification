'use strict';
// The project's own gates. Written independently of the FX-1 checker (it is the checker's positive control).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8').replace(/\r/g, '');
const fail = msg => { console.error('gate: ' + msg); process.exit(1); };
const walk = (d, out = []) => { for (const e of fs.readdirSync(path.join(root, d), { withFileTypes: true })) { const p = d + '/' + e.name; if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); } else out.push(p); } return out; };

function syntax() {
  for (const f of walk('src').filter(x => x.endsWith('.js'))) {
    const r = spawnSync(process.execPath, ['--check', path.join(root, f)]);
    if (r.status !== 0) fail('syntax error in ' + f);
  }
}
function tests() {
  const r = spawnSync(process.execPath, ['--test'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) { process.stderr.write(r.stdout + r.stderr); fail('tests fail'); }
}
function open() {
  if (!fs.existsSync(path.join(root, 'docs/spec'))) return;
  for (const f of walk('docs/spec').filter(x => x.endsWith('.md'))) if (/^\s*OPEN:/m.test(read(f))) fail('open question in ' + f);
}
function measure() { if (!fs.existsSync(path.join(root, 'tests'))) return { tests_min: 0 }; let n = 0; for (const f of walk('tests').filter(x => x.endsWith('.test.js'))) n += (read(f).match(/^test\(/gm) || []).length; return { tests_min: n }; }
function ratchet() {
  const floor = JSON.parse(read('docs/ratchet.json')); const cur = measure();
  for (const k of Object.keys(floor)) if (cur[k] < floor[k]) fail(`ratchet: ${k} measured ${cur[k]} is below the floor ${floor[k]}`);
  const head = spawnSync('git', ['show', 'HEAD:docs/ratchet.json'], { cwd: root, encoding: 'utf8' });
  if (head.status === 0) { const old = JSON.parse(head.stdout); for (const k of Object.keys(old)) if (floor[k] < old[k]) fail(`ratchet: floor ${k} lowered from ${old[k]} to ${floor[k]}`); }
}
const norm = t => t.replace(/\r/g, '').replace(/^[ \t]*(?:[-*]|\d+\.)[ \t]+(?:\[[ xX~]\][ \t]*)?/gm, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
function section(file, want) {
  let cur = null; const buf = {};
  for (const line of read(file).split('\n')) { const h = line.match(/^#{1,6}\s+(.*)$/); if (h) { cur = slug(h[1]); buf[cur] = []; } else if (cur) buf[cur].push(line); }
  return buf[want] ? buf[want].join('\n') : null;
}
function lock() {
  if (!fs.existsSync(path.join(root, 'docs/spec.lock'))) return;
  const S = new Map(), A = new Map();
  for (const l of read('docs/spec.lock').split('\n')) { const p = l.split(' '); if (p[0] === 'S') S.set(p[1], p[2]); if (p[0] === 'A') A.set(p[1] + '|' + p[2], { target: p[3], hash: p[4] }); }
  const hashOf = target => { const [f, s] = target.split('#'); if (!fs.existsSync(path.join(root, f))) return null; const t = section(f, s); return t === null ? null : require('crypto').createHash('sha256').update(norm(t)).digest('hex').slice(0, 16); };
  for (const [t, h] of S) if (hashOf(t) !== h) fail('lock: section changed or missing: ' + t);
  for (const [k, a] of A) if (hashOf(a.target) !== a.hash) fail('lock: stale artifact ' + k);
}
function commitMsg(file) {
  const msg = fs.readFileSync(file, 'utf8').split('\n')[0];
  if (!/^(feat|fix|docs|test|chore|refactor|ci|build|perf|style|revert)(\([^)]+\))?!?: \S.{6,}$/.test(msg)) fail('commit message is not a conventional commit');
  const staged = spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
  if (staged.some(f => f.startsWith('src/')) && !staged.some(f => f.startsWith('docs/')) && !/\b[A-Z]{2,5}-\d{3}\b/.test(msg) && !/^refactor/.test(msg)) fail('co-change: a change under src/ needs a criterion id in the message or a change under docs/');
}
const [mode, arg] = process.argv.slice(2);
if (mode === 'pre-commit') { syntax(); tests(); open(); ratchet(); lock(); }
else if (mode === 'commit-msg') commitMsg(arg);
else if (mode === 'lock') lock();
else if (mode === 'open') open();
else if (mode === 'ratchet') ratchet();
else fail('unknown mode ' + mode);
