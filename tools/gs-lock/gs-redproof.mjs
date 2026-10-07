#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-redproof: the red proofs of the lock and the co-change gate, as ONE shell command each (the "red proof" column of the sentinel).
// It clones the repository (committed state) into a throwaway folder, plants one violation there, runs the gate and exits with the GATE's exit
// code: non-zero means the gate caught the violation (the proof is "red"); zero means the gate accepted it (the proof FAILED to be red).
//   node tools/gs-lock/gs-redproof.mjs stale               write a sentence inside a tagged spec section, run `gs-lock check`
//   node tools/gs-lock/gs-redproof.mjs uncited             change a source file with `feat:` and no id, run `gs-cochange --msg-file`
//   node tools/gs-lock/gs-redproof.mjs breaking-refactor   a `refactor:` that breaks the parent's tests (a test edited in the same commit)
// Options: --root <dir> (default: the current folder), --test-cmd "<cmd>" (passed to gs-cochange). Needs git. Exit 2 = it could not plant.

import { mkdtempSync, writeFileSync, readFileSync, rmSync, appendFileSync, symlinkSync, existsSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fsCtx, loadConfig, scanTags, lf } from './gs-lock.mjs';
import { classify } from './gs-cochange.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), kind = argv[0];
const opt = n => { const i = argv.indexOf(n); return i > 0 ? argv[i + 1] : null; };
const root = opt('--root') || process.cwd();
const env = { ...process.env }; for (const k of Object.keys(env)) if (/^(GIT_DIR|GIT_INDEX_FILE|GIT_WORK_TREE|NODE_TEST_CONTEXT)$/.test(k)) delete env[k];
const git = (cwd, ...a) => spawnSync('git', ['-c', 'core.autocrlf=false', ...a], { cwd, encoding: 'utf8', env });
let tmp = null;
const finish = c => { if (tmp) rmSync(tmp, { recursive: true, force: true, maxRetries: 3 }); process.exit(c); };
const die = (m, c = 2) => { process.stderr.write('gs-redproof: ' + m + '\n'); finish(c); };
if (!['stale', 'uncited', 'breaking-refactor'].includes(kind)) die('usage: gs-redproof stale|uncited|breaking-refactor [--root <dir>] [--test-cmd "<cmd>"]');

tmp = mkdtempSync(join(tmpdir(), 'gs-redproof-')); const clone = join(tmp, 'c');
{
  const c = git(root, 'clone', '-q', '--no-hardlinks', root, clone); if (c.status !== 0) die('could not clone: ' + c.stderr);
  if (existsSync(join(root, 'node_modules'))) { try { symlinkSync(join(root, 'node_modules'), join(clone, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'); } catch { /* the gate will say */ } }
  // the tool copies in the clone are the ones the project committed (the ones next to this file when it has none)
  const gate = (script, args) => { const own = join(clone, 'tools/gs-lock', script); const r = spawnSync(process.execPath, [existsSync(own) ? own : join(HERE, script), ...args], { cwd: clone, encoding: 'utf8', env }); process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || ''); return r.status === null ? 1 : r.status; };
  const ctx = fsCtx(clone), cfg = loadConfig(ctx), cls = classify(ctx.list(), cfg, p => /\.md$/i.test(p) && (cfg.specRoots.includes(p) || cfg.specDirs.some(d => p.startsWith(d + '/'))));
  // prefer a source file that the tests mention: the planted break has to reach them
  const testText = cls.tests.map(p => ctx.read(p) || '').join('\n').split('\n').filter(l => /require|import|from/.test(l)).join('\n'), stem = p => (p.split('/').pop() || '').replace(/\.[^.]+$/, '');
  const mentioned = cls.source.filter(p => stem(p) && testText.includes(stem(p))), inDirs = l => l.find(p => /(^|\/)(src|lib|app)\//.test(p));
  const src = inDirs(mentioned) || mentioned[0] || inDirs(cls.source) || cls.source[0], testFile = cls.tests.find(p => /\.(js|mjs|cjs|ts|py)$/.test(p));
  const comment = (p, t) => (/\.(py|sh)$/.test(p) ? '# ' : '// ') + t + '\n';
  if (kind === 'stale') {
    const { pairs } = scanTags(ctx, cfg);
    for (const t of pairs.values()) {
      const text = ctx.read(t.path); if (!text) continue;
      const lines = text.split('\n'), gh = s => s.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-');
      const at = lines.findIndex(l => /^#{1,6}[ \t]/.test(l) && gh(l.replace(/^#{1,6}[ \t]+/, '').replace(/[ \t]*#*[ \t]*$/, '')) === t.section.toLowerCase());
      if (at < 0) continue;
      lines.splice(at + 1, 0, '', 'Red proof: this sentence was written inside a locked section.'); writeFileSync(join(clone, t.path), lines.join('\n'));
      finish(gate('gs-lock.mjs', ['check']));
    }
    die('no tag points at a heading section of a spec file, so a drift cannot be planted');
  }
  if (!src) die('no source file to change');
  const brk = /\.py$/.test(src) ? 'raise RuntimeError("red proof: behaviour change")\n' : /\.(js|mjs|cjs|ts|tsx|jsx)$/.test(src) ? 'throw new Error("red proof: behaviour change");\n' : null;
  if (kind === 'breaking-refactor' && !brk) die('only JavaScript, TypeScript and Python sources are planted');
  appendFileSync(join(clone, src), '\n' + (kind === 'uncited' ? comment(src, 'red proof: a source change that cites nothing') : brk));
  if (kind === 'breaking-refactor' && testFile) appendFileSync(join(clone, testFile), '\n' + comment(testFile, 'red proof: a test edited in the same commit'));
  git(clone, 'add', '-A');
  const msgFile = join(tmp, 'msg.txt'); writeFileSync(msgFile, kind === 'uncited' ? 'feat: red proof change that cites no id\n' : 'refactor: red proof behaviour change disguised as a refactor\n');
  finish(gate('gs-cochange.mjs', ['--msg-file', msgFile, ...(opt('--test-cmd') ? ['--test-cmd', opt('--test-cmd')] : [])]));
}
