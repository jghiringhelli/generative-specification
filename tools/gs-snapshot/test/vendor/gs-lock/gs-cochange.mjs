#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-cochange: the co-change gate. One file next to gs-lock.mjs (it imports it), Node 18+, no dependencies, no model.
// A commit that changes SOURCE must say why:
//   - cite, in its message, an id the spec defines (F-001.2, AC-004 ...), or
//   - stage a change to a spec file (that change is the citation), or
//   - be typed `refactor:` AND pass the PARENT commit's tests, UNCHANGED, against the new source (run in a temporary git worktree;
//     edits to test files in the same commit are ignored, so a test edited to match new behaviour proves nothing), or
//   - carry a line `Waiver: <reason of 10+ characters>` (printed; count them in the review). A refactor waiver also needs `Ratified-by:`.
// A refactor that changes a spec is rejected (that is not a refactor). A cited id the spec does not define is rejected, but only when
// its letters are a prefix the spec uses, so "UTF-8" in a message is not an id.
//
// Usage (run from the project root; --root <dir> to point elsewhere):
//   node gs-cochange.mjs --msg-file <file>         commit-msg hook: the staged change against HEAD, message from <file>
//   node gs-cochange.mjs --commit <rev>            one commit against its parent (CI)
//   node gs-cochange.mjs --range <base>..<head>    every non-merge commit of the range (CI, or a manual pre-push check)
//   node gs-cochange.mjs --pre-push                pre-push hook: reads git's stdin lines; checks the commits being pushed
// Options: --test-cmd "<cmd>" (default: .gs.json testCmd, else `npm test --silent` when package.json has a test script, else pytest),
//          --skip-proof (do not run the refactor proof; for self-tests only).
// Optional .gs.json keys: testCmd, testPattern, sourcePattern (regex strings), specDirs, specRoots.
// Honest limit: the refactor proof is only as strong as the tests. A change at an edge no test pins passes as a refactor; the remedy
// is a criterion and a test at that edge. A refactor that moves a file the tests import fails the proof (known false positive): say
// what it is (a typed change citing an id) or use Waiver plus Ratified-by. Exit codes: 0 accepted, 1 rejected, 2 usage or environment.

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { gitOf as git, gitCtx, loadConfig, specIds, lf } from './gs-lock.mjs';

const CODE_EXT = /\.(js|mjs|cjs|jsx|ts|tsx|py|go|rs|java|kt|rb|php|cs|c|cpp|h|swift|scala)$/i;
const NOT_SOURCE = /^(docs|doc|scripts|tools|bin|\.githooks|\.github|\.husky|node_modules|vendor|dist|build)\//;
const DEFAULT_TEST = /(^|\/)(tests?|__tests__|spec|specs)\/|\.(test|spec)\.[^/]+$|(^|\/)test_[^/]*\.py$|_test\.(py|go)$|(^|\/)conftest\.py$/;
const CONFIG_FILE = /(^|\/)([^/]*\.config\.[cm]?[jt]s|setup\.py|noxfile\.py|eslint[^/]*|vitest[^/]*|jest[^/]*|babel[^/]*|webpack[^/]*|rollup[^/]*)$/;
const TYPE_RE = /^([a-z]+)(\([^)]*\))?!?:/;

function parseArgs(argv) {
  const o = { flags: new Set() }, withValue = new Set(['--root', '--msg-file', '--commit', '--range', '--test-cmd']);
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (withValue.has(a)) o[a.slice(2)] = argv[++i]; else if (a.startsWith('--')) o.flags.add(a.slice(2)); }
  return o;
}

export function classify(paths, cfg, specFile) {
  const testRe = cfg.testPattern ? new RegExp(cfg.testPattern) : DEFAULT_TEST, srcRe = cfg.sourcePattern ? new RegExp(cfg.sourcePattern) : null;
  const tests = [], specs = [], source = [];
  for (const p of paths) {
    if (testRe.test(p)) tests.push(p);
    else if (specFile(p)) specs.push(p);
    else if (srcRe ? srcRe.test(p) : CODE_EXT.test(p) && !NOT_SOURCE.test(p) && !CONFIG_FILE.test(p)) source.push(p);
  }
  return { tests, specs, source };
}

function testCommand(root, cfg, o) {
  if (o['test-cmd']) return o['test-cmd'];
  if (cfg.testCmd) return cfg.testCmd;
  try { const t = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts || {}).test; if (t && !/no test specified/.test(t)) return 'npm test --silent'; } catch { /* not a node project */ }
  if (['pyproject.toml', 'pytest.ini', 'setup.cfg', 'requirements.txt', 'tox.ini'].some(f => existsSync(join(root, f)))) return process.platform === 'win32' ? 'python -m pytest -q' : '(python3 -m pytest -q || python -m pytest -q)';
  return null;
}
const cleanEnv = () => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^(GIT_DIR|GIT_INDEX_FILE|GIT_WORK_TREE|GIT_PREFIX|GIT_QUARANTINE_PATH|GIT_OBJECT_DIRECTORY|NODE_TEST_CONTEXT)$/.test(k)) delete e[k]; return e; };

// The proof: the parent's tests, unchanged, on the new source. changes: [{s: 'A'|'M'|'D', p}] for the non-test paths; blob(p) returns the new bytes.
function refactorProof(root, parent, changes, blob, cmd) {
  const tmp = mkdtempSync(join(tmpdir(), 'gs-cochange-')), wt = join(tmp, 'wt');
  const add = spawnSync('git', ['worktree', 'add', '--detach', '-q', wt, parent], { cwd: root, encoding: 'utf8', env: cleanEnv() });
  if (add.status !== 0) { rmSync(tmp, { recursive: true, force: true }); return { status: 2, out: 'could not create a worktree at the parent: ' + add.stderr }; }
  try {
    for (const { s, p } of changes) { const dest = join(wt, p); if (s === 'D') rmSync(dest, { force: true }); else { mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, blob(p)); } }
    for (const dir of ['node_modules']) if (existsSync(join(root, dir)) && !existsSync(join(wt, dir))) { try { symlinkSync(join(root, dir), join(wt, dir), process.platform === 'win32' ? 'junction' : 'dir'); } catch { /* tests will say */ } }
    const r = spawnSync(cmd, { cwd: wt, shell: true, encoding: 'utf8', env: cleanEnv(), maxBuffer: 1 << 26 });
    return { status: r.status === 0 ? 0 : 1, out: ((r.stdout || '') + (r.stderr || '')).trim() };
  } finally {
    spawnSync('git', ['worktree', 'remove', '--force', wt], { cwd: root, env: cleanEnv() });
    rmSync(tmp, { recursive: true, force: true, maxRetries: 3 });
    spawnSync('git', ['worktree', 'prune'], { cwd: root, env: cleanEnv() });
  }
}

// One change: where = { ctx (post-change tree), parent, names: [{s,p}], blob(p), message, label }
export function judge(root, where, o = {}) {
  const ctx = where.ctx, cfg = loadConfig(ctx), problems = [], notes = [];
  const specFile = p => /\.md$/i.test(p) && (cfg.specRoots.includes(p) || cfg.specDirs.some(d => p.startsWith(d + '/'))) && !/(ratifications|coverage|cobertura)[^/]*$/i.test(p);
  const msg = lf(where.message).split('\n').filter(l => !l.startsWith('#')).join('\n'), subject = msg.split('\n')[0] || '';
  if (/^(Merge|Revert) /.test(subject)) return { ok: true, problems, notes: ['merge or revert: not judged'] };
  const cls = classify(where.names.map(n => n.p), cfg, specFile);
  if (!cls.source.length) return { ok: true, problems, notes: ['no source change'] };
  const type = (subject.match(TYPE_RE) || [])[1] || '', waiver = msg.match(/^Waiver: (.{10,})/m), ratified = /^Ratified-by: .{2,}/m.test(msg);
  const defined = specIds(ctx, cfg), prefixes = new Set([...defined.keys()].map(i => i.split('-')[0]));
  const cited = [...new Set(msg.match(new RegExp('\\b[A-Z][A-Z0-9]{0,5}(?:-[A-Z][A-Z0-9]{0,5})?-\\d{1,4}(?:\\.[A-Z]?\\d{1,3}){0,2}\\b', 'g')) || [])].filter(i => prefixes.has(i.split('-')[0]));
  const unknown = cited.filter(i => !defined.has(i)), known = cited.filter(i => defined.has(i));
  if (unknown.length) problems.push(`the message cites ${unknown.join(', ')}, which the spec does not define`);
  if (type === 'refactor') {
    if (cls.specs.length) problems.push(`refactor: a change to a spec (${cls.specs[0]}) is not a refactor; a refactor leaves requirements alone`);
    else if (waiver && ratified) notes.push('refactor proof waived with Ratified-by (count it in the review): ' + waiver[1]);
    else if (o.skipProof) notes.push('refactor proof skipped (--skip-proof)');
    else {
      const cmd = testCommand(where.root, cfg, o);
      if (!cmd) return { ok: false, problems: ['no test command: set testCmd in .gs.json or pass --test-cmd'], notes, fatal: true };
      const changes = where.names.filter(n => !cls.tests.includes(n.p)).map(n => ({ s: n.s, p: n.p }));
      const r = refactorProof(where.root, where.parent, changes, where.blob, cmd);
      if (r.status === 2) return { ok: false, problems: [r.out], notes, fatal: true };
      if (r.status === 1) problems.push(`NOT A REFACTOR: the parent's tests, unchanged, fail against the new source (${cmd}). Say what it is: a change that cites an id the spec defines, or a spec change.` + '\n' + r.out.split('\n').slice(-12).map(l => '      ' + l).join('\n'));
      else notes.push("the parent's tests pass unchanged on the new source" + (cls.tests.length ? ` (edits to ${cls.tests.join(', ')} were ignored: they prove nothing here)` : ''));
    }
  } else if (!known.length && !cls.specs.length) {
    if (waiver) notes.push('waiver: ' + waiver[1]);
    else problems.push('a change to source must cite an id the spec defines (for example F-001.2) in its message, or stage a spec change, or be typed "refactor:" (then the parent tests must pass unchanged): ' + cls.source.slice(0, 3).join(', '));
  }
  return { ok: !problems.length, problems, notes };
}

function stagedWhere(root, messageFile) {
  const idx = gitCtx(root, ''), hasHead = git(root, ['rev-parse', '--verify', '-q', 'HEAD']).status === 0;
  if (!hasHead) return null; // the first commit has no parent to compare with
  const ns = git(root, ['diff', '--cached', '--name-status', '--no-renames', 'HEAD']).stdout.split('\n').filter(Boolean).map(l => { const [s, ...p] = l.split('\t'); return { s: s[0], p: p.join('\t') }; });
  return { root, ctx: idx, parent: 'HEAD', names: ns, blob: p => git(root, ['show', `:${p}`], { encoding: 'buffer' }).stdout, message: readFileSync(messageFile, 'utf8') };
}
function commitWhere(root, rev) {
  const parents = git(root, ['rev-list', '--parents', '-n', '1', rev]).stdout.trim().split(' ').slice(1);
  if (parents.length !== 1) return null; // root commit or merge
  const ns = git(root, ['diff', '--name-status', '--no-renames', parents[0], rev]).stdout.split('\n').filter(Boolean).map(l => { const [s, ...p] = l.split('\t'); return { s: s[0], p: p.join('\t') }; });
  return { root, ctx: gitCtx(root, rev), parent: parents[0], names: ns, blob: p => git(root, ['show', `${rev}:${p}`], { encoding: 'buffer' }).stdout, message: git(root, ['log', '-1', '--format=%B', rev]).stdout, label: git(root, ['log', '-1', '--format=%h %s', rev]).stdout.trim() };
}

function report(label, r) {
  if (!r.ok) { process.stdout.write(`x co-change gate: ${label ? label + ': ' : ''}COMMIT REJECTED\n`); r.problems.forEach(p => process.stdout.write('  - ' + p + '\n')); }
  else process.stdout.write(`ok co-change${label ? ' ' + label : ''}: ${r.notes.join('; ') || 'cited'}\n`);
}

export function main(argv) {
  const o = parseArgs(argv), root = o.root || process.cwd(), skipProof = o.flags.has('skip-proof') || process.env.GS_SKIP_REFACTOR_PROOF === '1';
  let revs = [];
  if (o['msg-file']) {
    const w = stagedWhere(root, o['msg-file']); if (!w) { process.stdout.write('ok co-change: first commit, nothing to compare\n'); return 0; }
    const r = judge(root, w, { ...o, skipProof }); report('', r); return r.fatal ? 2 : r.ok ? 0 : 1;
  }
  if (o.commit) revs = [o.commit];
  else if (o.range) revs = git(root, ['rev-list', '--reverse', '--no-merges', o.range]).stdout.split('\n').filter(Boolean);
  else if (o.flags.has('pre-push')) {
    for (const line of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
      const [, local, , remote] = line.split(' '); if (/^0+$/.test(local)) continue;
      const range = /^0+$/.test(remote) ? git(root, ['rev-list', '--reverse', '--no-merges', local, '--not', '--remotes']) : git(root, ['rev-list', '--reverse', '--no-merges', `${remote}..${local}`]);
      revs.push(...range.stdout.split('\n').filter(Boolean));
    }
  } else { process.stderr.write('usage: gs-cochange --msg-file <file> | --commit <rev> | --range <base>..<head> | --pre-push   [--root <dir>] [--test-cmd "<cmd>"]\n'); return 2; }
  let bad = 0;
  for (const rev of revs) { const w = commitWhere(root, rev); if (!w) continue; const r = judge(root, w, { ...o, skipProof }); report(w.label, r); if (r.fatal) return 2; if (!r.ok) bad++; }
  if (!revs.length) process.stdout.write('ok co-change: no commits to judge\n');
  return bad ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
