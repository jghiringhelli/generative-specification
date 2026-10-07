'use strict';
// The project's own gates, wired to the REFERENCE lock tool (tools/gs-lock). Written independently of the checker (it is the positive control).
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
function tool(file, ...args) {
  const r = spawnSync(process.execPath, [path.join(root, 'tools/gs-lock', file), ...args], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) { process.stderr.write(r.stdout + r.stderr); fail(`${file} ${args[0]} failed`); }
}
function commitMsg(file) {
  const msg = fs.readFileSync(file, 'utf8').split('\n')[0];
  if (!/^(feat|fix|docs|test|chore|refactor|ci|build|perf|style|revert)(\([^)]+\))?!?: \S.{6,}$/.test(msg)) fail('commit message is not a conventional commit');
  tool('gs-cochange.mjs', '--msg-file', file);
}
const [mode, arg] = process.argv.slice(2);
if (mode === 'pre-commit') { syntax(); tests(); open(); ratchet(); tool('gs-lock.mjs', 'check'); tool('gs-lock.mjs', 'commit-check'); }
else if (mode === 'commit-msg') commitMsg(arg);
else if (mode === 'lock') tool('gs-lock.mjs', 'check');
else if (mode === 'open') open();
else if (mode === 'ratchet') ratchet();
else fail('unknown mode ' + mode);
