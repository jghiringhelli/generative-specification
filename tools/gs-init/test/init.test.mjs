// gs-init tests. No model, no network. Each test builds a throwaway project in the temp folder and runs the installer on it as a child process.
// Run: node --test tools/gs-init/test/init.test.mjs      (the two proof tests run gs-check --strict and take about a minute each on Windows)
// GS_INIT_SKIP_PROOF=1 skips them.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { detectStack } from '../gs-init.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const INIT = path.join(HERE, '..', 'gs-init.mjs');
const VENDOR = path.join(HERE, 'vendor');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-init-test-'));
process.on('exit', () => { try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* ignore */ } });

let n = 0;
// an agent environment variable (this suite may itself run inside an assistant) would make the hooks treat every entry as agent-made: strip them
const ENV = { ...process.env }; for (const k of ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'GS_DECIDE_AGENT', 'CURSOR_AGENT', 'CODEX_SANDBOX', 'AIDER_MODEL', 'GEMINI_CLI']) delete ENV[k];
const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8', env: ENV });
const sh = (cwd, cmd) => spawnSync('sh', ['-c', cmd], { cwd, encoding: 'utf8' });
function project(files, { repo = true } = {}) {
  const dir = path.join(TMP, 'p' + (++n));
  fs.mkdirSync(dir, { recursive: true });
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), c); }
  if (repo) { git(dir, 'init', '-q'); git(dir, 'config', 'user.name', 'Pat Person'); git(dir, 'config', 'user.email', 'pat@example.com'); git(dir, 'config', 'core.autocrlf', 'false'); }
  return dir;
}
const init = (dir, ...args) => spawnSync(process.execPath, [INIT, '--tools', VENDOR, '--no-proof', ...args], { cwd: dir, encoding: 'utf8' });
const read = (dir, f) => fs.readFileSync(path.join(dir, f), 'utf8');
const has = (dir, f) => fs.existsSync(path.join(dir, f));
function snapshot(dir) {
  const out = {};
  const walk = rel => { for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) { if (e.name === '.git') continue; const p = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) walk(p); else out[p] = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, p))).digest('hex'); } };
  walk('');
  return out;
}
const NODE_PROJECT = {
  'package.json': '{"name":"demo","version":"1.0.0","scripts":{"test":"node --test"}}\n',
  'src/a.js': 'exports.add = (a, b) => a + b;\n',
  'tests/a.test.js': "const test = require('node:test'); const assert = require('assert');\ntest('add', () => { assert.equal(require('../src/a').add(1, 2), 3); });\n",
};
const PY_PROJECT = {
  'requirements.txt': 'pytest\n',
  'src/calc.py': 'def add(a, b):\n    return a + b\n',
  'tests/test_calc.py': 'def test_add():\n    assert 1 + 2 == 3\n\ndef test_zero():\n    assert 0 == 0\n',
};
const commit = (dir, msg, files = {}) => {
  for (const [f, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); fs.writeFileSync(path.join(dir, f), c); }
  git(dir, 'add', '-A');
  return git(dir, 'commit', '-q', '-m', msg);
};

test('G1 dry run writes nothing, not even a repository', () => {
  const dir = project(NODE_PROJECT, { repo: false });
  const before = snapshot(dir);
  const r = init(dir, '--dry-run', '--level', 'L2');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /dry run: nothing was written/);
  assert.match(r.stdout, /create +CLAUDE\.md/);
  assert.deepEqual(snapshot(dir), before);
  assert.equal(has(dir, '.git'), false);
  assert.equal(has(dir, '.gs-init-backup'), false);
});

test('G2 L0 on a node project: sentinel and three documents, nothing that runs', () => {
  const dir = project(NODE_PROJECT);
  const r = init(dir, '--level', 'L0');
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['CLAUDE.md', 'docs/spec/SPEC.md', 'docs/open-questions.md', 'docs/decisions/0001-adopt-generative-specification.md', '.gs.json']) assert.ok(has(dir, f), f);
  for (const f of ['scripts', '.githooks', 'tools', 'docs/baseline.json', 'README.md']) assert.equal(has(dir, f), false, f + ' must not exist at L0');
  const cfg = JSON.parse(read(dir, '.gs.json'));
  assert.equal(cfg.level, 'L0'); assert.equal(cfg.stack, 'node');
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath').stdout.trim(), '');
  // every path the sentinel names exists
  const named = [...read(dir, 'CLAUDE.md').matchAll(/`([A-Za-z0-9_./-]+\.(?:md|json|mjs)|docs\/[A-Za-z0-9_./-]*)`/g)].map(m => m[1]);
  assert.ok(named.length >= 4);
  for (const p of named) assert.ok(has(dir, p), 'sentinel names a missing path: ' + p);
  assert.match(r.stdout, /You got:/); assert.match(r.stdout, /Do next:/); assert.match(r.stdout, /Not yet:/);
});

test('G3 L1 on a python project: gate, hooks, floor measured from the tests found', () => {
  const dir = project(PY_PROJECT);
  const r = init(dir, '--level', 'L1');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /stack python/);
  for (const f of ['scripts/gs-gate.mjs', 'scripts/install-hooks.mjs', '.githooks/pre-commit', '.githooks/commit-msg', '.githooks/pre-push', 'docs/baseline.json', 'tools/gs-check/gs-check.mjs', 'tools/gs-lock/gs-lock.mjs', 'tools/gs-decide/gs-decide.mjs']) assert.ok(has(dir, f), f);
  assert.equal(has(dir, '.github'), false, 'no CI file below L2');
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath').stdout.trim(), '.githooks');
  const b = JSON.parse(read(dir, 'docs/baseline.json'));
  assert.equal(b.floors.tests, 2); assert.equal(b.floors.criteria, 3);
  const g = spawnSync(process.execPath, ['scripts/gs-gate.mjs', 'all'], { cwd: dir, encoding: 'utf8' });
  assert.equal(g.status, 0, g.stdout + g.stderr);
  // the hook files are the ones git will run: no CRLF, a shell shebang
  assert.match(read(dir, '.githooks/pre-commit'), /^#!\/bin\/sh\n/);
  assert.equal(read(dir, '.githooks/pre-commit').includes('\r'), false);
});

test('G4 idempotent: a second run changes nothing and makes no backup', () => {
  const dir = project(NODE_PROJECT);
  assert.equal(init(dir, '--level', 'L1').status, 0);
  const before = snapshot(dir);
  const r = init(dir, '--level', 'L1');
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(snapshot(dir), before);
  assert.equal(/^\s+(create|append|update) /m.test(r.stdout), false, r.stdout);
  assert.equal(has(dir, '.gs-init-backup'), false);
});

test('G5 an existing .git/hooks pre-commit is carried over and still runs; a bad message is refused, a good one accepted', () => {
  const dir = project(NODE_PROJECT);
  fs.writeFileSync(path.join(dir, '.git/hooks/pre-commit'), '#!/bin/sh\necho ran >> "$PWD/hook-ran.log"\n', { mode: 0o755 });
  const r = init(dir, '--level', 'L1');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /carried over/);
  const hook = read(dir, '.githooks/pre-commit');
  assert.ok(hook.indexOf('gs-gate.mjs') < hook.indexOf('hook-ran.log'), 'the checks come first, your line stays');
  const bad = commit(dir, 'fixed stuff');
  assert.notEqual(bad.status, 0, 'a message with no type must be refused');
  assert.match(bad.stderr + bad.stdout, /type: what changed/);
  const good = commit(dir, 'chore: adopt gs at level L1');
  assert.equal(good.status, 0, good.stdout + good.stderr);
  assert.ok(has(dir, 'hook-ran.log'), 'your own pre-commit hook must still run');
});

test('G6 core.hooksPath already set (a .husky folder): the block goes into the existing hook, hooksPath is kept, a backup is made', () => {
  const dir = project(NODE_PROJECT);
  fs.mkdirSync(path.join(dir, '.husky'));
  const original = '#!/bin/sh\necho husky-ran >> "$PWD/husky.log"\n';
  fs.writeFileSync(path.join(dir, '.husky/pre-commit'), original, { mode: 0o755 });
  git(dir, 'config', 'core.hooksPath', '.husky');
  const r = init(dir, '--level', 'L1');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(git(dir, 'config', '--get', 'core.hooksPath').stdout.trim(), '.husky');
  assert.ok(read(dir, '.husky/pre-commit').includes('echo husky-ran'));
  assert.ok(read(dir, '.husky/pre-commit').includes('gs-gate.mjs pre-commit'));
  assert.ok(has(dir, '.husky/commit-msg'));
  const stamp = fs.readdirSync(path.join(dir, '.gs-init-backup'))[0];
  assert.equal(read(dir, `.gs-init-backup/${stamp}/.husky/pre-commit`), original);
  const c = commit(dir, 'chore: adopt gs at level L1');
  assert.equal(c.status, 0, c.stdout + c.stderr);
  assert.ok(has(dir, 'husky.log'));
  // the backup folder is kept out of git
  assert.equal(git(dir, 'status', '--porcelain').stdout.includes('.gs-init-backup'), false);
});

test('G7 an existing hook that is not a shell script is kept as .gs-prev and still runs', () => {
  const dir = project(NODE_PROJECT);
  const js = '#!/usr/bin/env node\nrequire("fs").writeFileSync("node-hook-ran.log", "x");\n';
  fs.writeFileSync(path.join(dir, '.git/hooks/pre-commit'), js, { mode: 0o755 });
  const r = init(dir, '--level', 'L1');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(has(dir, '.githooks/pre-commit.gs-prev'));
  assert.equal(read(dir, '.githooks/pre-commit.gs-prev'), js);
  const c = commit(dir, 'chore: adopt gs at level L1');
  assert.equal(c.status, 0, c.stdout + c.stderr);
  assert.ok(has(dir, 'node-hook-ran.log'), 'the node hook must have run');
});

test('G8 backups: your sentinel, README and .gs.json get a block or a key, never a replacement; your spec is kept; a changed generated file is backed up', () => {
  const myClaude = '# My project\n\nMy own rules. Do not touch.\n';
  const myReadme = '# Demo\n\nHow to build it.\n';
  const mySpec = '# Spec\n\n## F-001 Mine\n\n### Acceptance criteria\n\n- F-001.1 It MUST work. verified by: tests/a.test.js\n- F-001.2 It MUST stop. verified by: tests/a.test.js\n- F-001.3 It MAY sing. verified by: tests/a.test.js\n';
  const dir = project({ ...NODE_PROJECT, 'CLAUDE.md': myClaude, 'README.md': myReadme, '.gs.json': '{"decide":{"log":"docs/decisions.log.md"},"custom":1}\n', 'docs/spec/SPEC.md': mySpec });
  const r = init(dir, '--level', 'L1');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(read(dir, 'CLAUDE.md').startsWith(myClaude.trimEnd()), 'your text stays first');
  assert.match(read(dir, 'CLAUDE.md'), /Which case it is/);
  assert.ok(read(dir, 'README.md').startsWith(myReadme.trimEnd()));
  assert.match(read(dir, 'README.md'), /Fresh clone/);
  const cfg = JSON.parse(read(dir, '.gs.json'));
  assert.equal(cfg.custom, 1); assert.equal(cfg.decide.log, 'docs/decisions.log.md'); assert.equal(cfg.level, 'L1');
  assert.equal(read(dir, 'docs/spec/SPEC.md'), mySpec, 'your spec is kept as it is');
  const stamp = fs.readdirSync(path.join(dir, '.gs-init-backup'))[0];
  for (const f of ['CLAUDE.md', 'README.md', '.gs.json']) assert.ok(has(dir, `.gs-init-backup/${stamp}/${f}`), 'backup of ' + f);
  assert.equal(read(dir, `.gs-init-backup/${stamp}/CLAUDE.md`), myClaude);
  assert.equal(has(dir, `.gs-init-backup/${stamp}/docs/spec/SPEC.md`), false, 'a kept file needs no backup');
  // a generated file edited by hand is replaced only after a backup
  fs.writeFileSync(path.join(dir, 'scripts/gs-gate.mjs'), '// my edit\n');
  const r2 = init(dir, '--level', 'L1');
  assert.match(r2.stdout, /update +scripts\/gs-gate\.mjs/);
  const stamps = fs.readdirSync(path.join(dir, '.gs-init-backup'));
  assert.ok(stamps.some(s => has(dir, `.gs-init-backup/${s}/scripts/gs-gate.mjs`) && read(dir, `.gs-init-backup/${s}/scripts/gs-gate.mjs`) === '// my edit\n'));
  assert.notEqual(read(dir, 'scripts/gs-gate.mjs'), '// my edit\n');
});

test('G9 changing the level rewrites only the managed block and the level key', () => {
  const dir = project(NODE_PROJECT);
  assert.equal(init(dir, '--level', 'L0').status, 0);
  const l0 = read(dir, 'CLAUDE.md');
  assert.match(l0, /level L0/);
  assert.equal(init(dir, '--level', 'L1').status, 0);
  const l1 = read(dir, 'CLAUDE.md');
  assert.match(l1, /level L1/); assert.equal((l1.match(/gs-init:begin/g) || []).length, 1, 'one block only');
  assert.ok(l1.startsWith('# ' + path.basename(dir) + ': sentinel'));
  assert.equal(JSON.parse(read(dir, '.gs.json')).level, 'L1');
});

test('G10 missing tools: said honestly with where to fetch; L2 without gs-decide is refused before anything is written', () => {
  const alone = fs.mkdtempSync(path.join(TMP, 'alone-'));
  fs.copyFileSync(INIT, path.join(alone, 'gs-init.mjs'));
  const dir = project(NODE_PROJECT);
  const run = (...a) => spawnSync(process.execPath, [path.join(alone, 'gs-init.mjs'), '--no-proof', ...a], { cwd: dir, encoding: 'utf8', env: { ...process.env, GS_TOOLS: '' } });
  const r2 = run('--level', 'L2');
  assert.equal(r2.status, 2);
  assert.match(r2.stderr, /needs gs-decide/); assert.match(r2.stderr, /github\.com\/jghiringhelli\/generative-specification/);
  assert.equal(has(dir, 'CLAUDE.md'), false, 'nothing is written when it refuses');
  const r1 = run('--level', 'L1');
  assert.equal(r1.status, 0, r1.stderr);
  assert.match(r1.stdout, /missing tool gs-check/); assert.match(r1.stdout, /Fetch tools\/gs-check from https:\/\/github\.com\/jghiringhelli\/generative-specification/);
  assert.ok(has(dir, 'scripts/gs-gate.mjs'), 'the gate is generated and needs no tool');
  assert.equal(has(dir, 'tools'), false);
});

test('G11 the gate: red and green for spec shape, open question, ratchet floor and a typed message', () => {
  const dir = project(NODE_PROJECT);
  assert.equal(init(dir, '--level', 'L1').status, 0);
  const gate = (...a) => spawnSync(process.execPath, ['scripts/gs-gate.mjs', ...a], { cwd: dir, encoding: 'utf8' });
  assert.equal(gate('all').status, 0);
  const spec = read(dir, 'docs/spec/SPEC.md'), oq = read(dir, 'docs/open-questions.md');
  // spec shape
  fs.appendFileSync(path.join(dir, 'docs/spec/SPEC.md'), '\n- F-001.9 The thing MUST work.\n');
  let r = gate('spec'); assert.equal(r.status, 1); assert.match(r.stderr, /verified by/);
  fs.writeFileSync(path.join(dir, 'docs/spec/SPEC.md'), spec); assert.equal(gate('spec').status, 0);
  // open question
  fs.appendFileSync(path.join(dir, 'docs/open-questions.md'), '\nOPEN: who owns billing?\n');
  r = gate('open'); assert.equal(r.status, 1); assert.match(r.stderr, /open question/);
  fs.writeFileSync(path.join(dir, 'docs/open-questions.md'), oq); assert.equal(gate('open').status, 0);
  // ratchet: floor above what is measured
  const base = read(dir, 'docs/baseline.json');
  fs.writeFileSync(path.join(dir, 'docs/baseline.json'), '{"floors":{"tests":99999},"ceilings":{}}');
  r = gate('ratchet'); assert.equal(r.status, 1); assert.match(r.stderr, /below the floor/);
  fs.writeFileSync(path.join(dir, 'docs/baseline.json'), base); assert.equal(gate('ratchet').status, 0);
  // ratchet: a floor lowered after it was committed
  assert.equal(commit(dir, 'chore: adopt gs at level L1').status, 0);
  fs.writeFileSync(path.join(dir, 'docs/baseline.json'), JSON.stringify({ floors: { tests: 0, criteria: 0 }, ceilings: {} }));
  r = gate('ratchet'); assert.equal(r.status, 1); assert.match(r.stderr, /lowered/);
  fs.writeFileSync(path.join(dir, 'docs/baseline.json'), base);
  // typed message
  fs.writeFileSync(path.join(dir, 'm.txt'), 'fixed stuff\n'); assert.equal(gate('commit-msg', 'm.txt').status, 1);
  fs.writeFileSync(path.join(dir, 'm.txt'), 'feat(core): add the thing\n'); assert.equal(gate('commit-msg', 'm.txt').status, 0);
  // the red proofs written in the sentinel run as written
  const proof = read(dir, 'CLAUDE.md').split('\n').filter(l => l.startsWith('| open-questions |'))[0].split('|')[4].trim().replace(/^`|`$/g, '');
  fs.writeFileSync(path.join(dir, 'docs/open-questions.md'), oq);
  assert.notEqual(sh(dir, proof).status, 0, 'the red proof in the sentinel must fail: ' + proof);
});

test('G12 the tests found raise the floor and cannot fall below it', () => {
  const dir = project(NODE_PROJECT);
  assert.equal(init(dir, '--level', 'L1').status, 0);
  assert.equal(JSON.parse(read(dir, 'docs/baseline.json')).floors.tests, 1);
  fs.appendFileSync(path.join(dir, 'tests/a.test.js'), "test('add again', () => { assert.equal(1 + 1, 2); });\n");
  assert.equal(spawnSync(process.execPath, ['scripts/gs-gate.mjs', 'ratchet', '--raise'], { cwd: dir, encoding: 'utf8' }).status, 0);
  assert.equal(JSON.parse(read(dir, 'docs/baseline.json')).floors.tests, 2);
  fs.writeFileSync(path.join(dir, 'tests/a.test.js'), "const test = require('node:test');\ntest('only one', () => {});\n");
  const r = spawnSync(process.execPath, ['scripts/gs-gate.mjs', 'ratchet'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 1); assert.match(r.stderr, /tests is 1, below the floor 2/);
});

test('G13 stack detection: node, python, go, dotnet, other', () => {
  const t = files => detectStack(project(files, { repo: false })).stack;
  assert.equal(t({ 'package.json': '{}' }), 'node');
  assert.equal(t({ 'pyproject.toml': '[project]\nname="x"\n' }), 'python');
  assert.equal(t({ 'go.mod': 'module x\n' }), 'go');
  assert.equal(t({ 'App.sln': '' }), 'dotnet');
  assert.equal(t({ 'App/App.csproj': '<Project/>' }), 'dotnet');
  assert.equal(t({ 'README.md': 'hi' }), 'other');
  assert.deepEqual(detectStack(project({ 'package.json': '{}', 'go.mod': 'module x\n' }, { repo: false })), { stack: 'node', also: ['go'] });
});

test('G14 AGENTS.md: an existing one is used; --sentinel chooses; a folder that is not a repository gets git init', () => {
  const a = project({ ...NODE_PROJECT, 'AGENTS.md': '# Agents\n\nMine.\n' });
  assert.equal(init(a, '--level', 'L0').status, 0);
  assert.ok(read(a, 'AGENTS.md').startsWith('# Agents')); assert.equal(has(a, 'CLAUDE.md'), false);
  const b = project(NODE_PROJECT, { repo: false });
  const r = init(b, '--level', 'L1', '--sentinel', 'AGENTS.md');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(has(b, 'AGENTS.md')); assert.equal(has(b, 'CLAUDE.md'), false); assert.ok(has(b, '.git'));
  assert.equal(JSON.parse(read(b, '.gs.json')).sentinel, 'AGENTS.md');
});

test('G15 run from a subfolder of a repository: refused with the top folder named', () => {
  const dir = project(NODE_PROJECT);
  fs.mkdirSync(path.join(dir, 'sub'));
  const r = init(path.join(dir, 'sub'), '--level', 'L0');
  assert.equal(r.status, 2); assert.match(r.stderr, /top folder of the repository/);
});

test('G16 L2: decide hooks wired, CI file written, the first commit is refused until a person records the baseline, an agent Signed-off-by is refused', () => {
  const dir = project(NODE_PROJECT);
  git(dir, 'checkout', '-q', '-b', 'main');
  const r = init(dir, '--level', 'L2');
  assert.equal(r.status, 0, r.stderr);
  assert.match(read(dir, '.githooks/commit-msg'), /gs-decide-hook\.mjs --msg-file/);
  assert.match(read(dir, '.githooks/commit-msg'), /gs-attribution-hook\.mjs --msg-file/);
  assert.match(read(dir, '.githooks/pre-push'), /gs-decide-hook\.mjs --pre-push/);
  assert.match(read(dir, '.github/workflows/gs.yml'), /branches: \[main\]/);
  assert.match(read(dir, '.github/workflows/gs.yml'), /gs-decide-ci\.mjs/);
  assert.equal(JSON.parse(read(dir, '.gs.json')).attribution.enabled, true);
  // red: protected files with no ratification
  const red = commit(dir, 'chore: adopt gs at level L2');
  assert.notEqual(red.status, 0, 'protected paths with no entry must be refused');
  assert.match(red.stderr + red.stdout, /ratif|decisions\.log/i);
  // the person records the starting state
  const add = spawnSync(process.execPath, ['tools/gs-decide/gs-decide.mjs', 'add', '--kind', 'baseline', '--covers-protected', '--role', 'owner', '--why', 'adopting the substrate, accepting the starting files'], { cwd: dir, encoding: 'utf8', env: ENV });
  assert.equal(add.status, 0, add.stdout + add.stderr);
  const green = commit(dir, 'chore: adopt gs at level L2');
  assert.equal(green.status, 0, green.stdout + green.stderr);
  // an agent sign-off is refused by the attribution hook
  fs.writeFileSync(path.join(dir, 'x.txt'), 'x\n'); git(dir, 'add', 'x.txt');
  const so = git(dir, 'commit', '-q', '-m', 'feat: add x\n\nSigned-off-by: Claude <noreply@anthropic.com>\nAssisted-by: claude-code:claude-sonnet-5-5');
  assert.notEqual(so.status, 0, 'an agent Signed-off-by must be refused');
  const ok = git(dir, 'commit', '-q', '-m', 'feat: add x\n\nAssisted-by: claude-code:claude-sonnet-5-5');
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
});

const ssh = spawnSync('ssh-keygen', ['-V'], { encoding: 'utf8' });
test('G17 L2 with --pubkey writes the roles file and turns signing on (skipped without ssh-keygen)', { skip: ssh.error ? 'ssh-keygen not found' : false }, () => {
  const dir = project(NODE_PROJECT);
  const kd = fs.mkdtempSync(path.join(TMP, 'key-'));
  assert.equal(spawnSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-f', path.join(kd, 'k')], { encoding: 'utf8' }).status, 0);
  const r = init(dir, '--level', 'L2', '--pubkey', path.join(kd, 'k.pub'));
  assert.equal(r.status, 0, r.stderr);
  const roles = JSON.parse(read(dir, 'docs/decision-roles.json'));
  assert.ok(roles.keys['pat@example.com'][0].startsWith('ssh-ed25519 '));
  assert.equal(JSON.parse(read(dir, '.gs.json')).decide.requireSigned, true);
  const v = spawnSync(process.execPath, ['tools/gs-decide/gs-decide.mjs', 'verify'], { cwd: dir, encoding: 'utf8' });
  assert.equal(v.status, 0, v.stdout + v.stderr);
  // signing is on: an unsigned entry is refused by add
  const add = spawnSync(process.execPath, ['tools/gs-decide/gs-decide.mjs', 'add', '--kind', 'baseline', '--covers-protected', '--role', 'maintainer', '--why', 'adopting the substrate, accepting the starting files'], { cwd: dir, encoding: 'utf8' });
  assert.notEqual(add.status, 0); assert.match(add.stderr + add.stdout, /requireSigned/);
});

const skipProof = process.env.GS_INIT_SKIP_PROOF ? 'GS_INIT_SKIP_PROOF set' : false;
test('P1 proof at L1 on a node project: the installer runs gs-check --strict on a copy and its claimed items read PASS', { skip: skipProof, timeout: 600000 }, () => {
  const dir = project(NODE_PROJECT);
  const r = spawnSync(process.execPath, [INIT, '--tools', VENDOR, '--level', 'L1'], { cwd: dir, encoding: 'utf8', timeout: 600000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /claimed at L1: E01 E02 E03 E06 E07 -> all PASS/);
  assert.match(r.stdout, /E10 ABSENT/);
  assert.equal(git(dir, 'log', '--oneline').stdout.trim(), '', 'the installer commits nothing in your repository');
});

test('P2 proof at L0 on a python project: the three claimed items pass; the gate items read absent on purpose', { skip: skipProof, timeout: 600000 }, () => {
  const dir = project(PY_PROJECT);
  const r = spawnSync(process.execPath, [INIT, '--tools', VENDOR, '--level', 'L0'], { cwd: dir, encoding: 'utf8', timeout: 600000 });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /claimed at L0: E01 E02 E03 -> all PASS/);
  assert.match(r.stdout, /E07 (ABSENT|PARTIAL)/);
});
