// SPDX-License-Identifier: MIT
// Builds the hand-made control substrates in temp folders: one known-good project and variants with an element removed or broken.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { internals } from '../gs-check.mjs';
const { git, sections, sectionHash, read, walk, posix } = internals.util;

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const TAG = /^[ \t]*(?:\/\/|#|\*|--|<!--)[ \t]*@gs[ \t]+(\S+)[ \t]+([^\s#]+)#([\w-]+)/;

const h = {
  rm: (dir, p) => fs.rmSync(path.join(dir, p), { recursive: true, force: true }),
  write: (dir, p, t) => { fs.mkdirSync(path.dirname(path.join(dir, p)), { recursive: true }); fs.writeFileSync(path.join(dir, p), t); },
  edit: (dir, p, fn) => fs.writeFileSync(path.join(dir, p), fn(read(path.join(dir, p)))),
  dropLines: (dir, p, substr) => h.edit(dir, p, t => t.split('\n').filter(l => !l.includes(substr)).join('\n')),
  replace: (dir, p, from, to) => h.edit(dir, p, t => { if (!t.includes(from)) throw new Error(`fixture mutation: "${from}" not found in ${p}`); return t.split(from).join(to); }),
  stripTags: dir => { for (const f of walk(path.join(dir, 'src')).concat(walk(path.join(dir, 'tests')))) { const rel = posix(path.relative(dir, f)); h.dropLines(dir, rel, '@gs '); } },
  // recompute docs/spec.lock from the tags in src/ and tests/ (uses the checker's own helpers; the fixture gate re-derives it independently)
  relock(dir) {
    if (fs.existsSync(path.join(dir, 'tools/gs-lock/gs-lock.mjs'))) { // the reference tool writes its own lock
      fs.rmSync(path.join(dir, 'docs/spec.lock'), { force: true });
      const r = spawnSync(process.execPath, ['tools/gs-lock/gs-lock.mjs', 'init'], { cwd: dir, encoding: 'utf8' });
      if (r.status !== 0) throw new Error('gs-lock init failed: ' + r.stdout + r.stderr);
      return;
    }
    const S = new Map(), A = new Map();
    for (const f of walk(path.join(dir, 'src')).concat(walk(path.join(dir, 'tests')))) {
      const rel = posix(path.relative(dir, f));
      read(f).split('\n').forEach(line => {
        const m = line.match(TAG); if (!m) return;
        const target = `${m[2]}#${m[3]}`; const sec = sections(read(path.join(dir, m[2]))).find(s => s.slug === m[3]);
        const hash = sectionHash(sec.text); S.set(target, hash); A.set(`${rel}|${m[1]}`, { rel, id: m[1], target, hash });
      });
    }
    const lines = [...[...S].map(([t, x]) => `S ${t} ${x}`).sort(), ...[...A.values()].map(a => `A ${a.rel} ${a.id} ${a.target} ${a.hash}`).sort()];
    h.write(dir, 'docs/spec.lock', '# spec.lock: one line per spec section and per artifact\n' + lines.join('\n') + '\n');
  },
  commit(dir, msg, files) { git(dir, ['add', '-A', ...(files || [])]); const r = git(dir, ['commit', '-q', '-m', msg]); if (r.code !== 0) throw new Error('fixture commit failed: ' + r.out); }
};

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}

// Build the project in a new temp folder. Commits are made without hooks (the hooks are not installed in the source repository).
function buildGood({ sloppy = false, template = 'good', gs = false } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fx1-fixture-'));
  copyDir(path.join(FIXTURES, template), dir);
  if (gs) { // the same project wired to the REFERENCE lock tool (copied from tools/gs-lock, never stored twice)
    copyDir(path.join(FIXTURES, 'good-gs'), dir);
    const toolDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'gs-lock');
    for (const f of ['gs-lock.mjs', 'gs-cochange.mjs']) { fs.mkdirSync(path.join(dir, 'tools/gs-lock'), { recursive: true }); fs.copyFileSync(path.join(toolDir, f), path.join(dir, 'tools/gs-lock', f)); }
  }
  git(dir, ['init', '-q', '-b', 'main']);
  h.relock(dir);
  const msgs = sloppy ? ['wip', 'update', 'stuff', 'changes', 'fix', 'misc'] : [
    'chore: scaffold package and readme', 'docs: add spec and decision record', 'docs: add architecture, data model and conventions',
    'feat: add ledger and cli with tests (AC-001)', 'chore: add hooks, gates, ratchet floor and spec lock', 'docs: add the sentinel routing to the cascade'
  ];
  const groups = [['package.json', 'requirements.txt', 'README.md'], ['docs/spec', 'docs/decisions'], ['docs/architecture.md', 'docs/data-model.md', 'docs/conventions.md'], ['src', 'tests', 'docs/coverage.md'], ['.githooks', 'scripts', 'tools', '.gitattributes', 'docs/ratchet.json', 'docs/spec.lock', '.github'], ['CLAUDE.md']];
  groups.forEach((g, i) => { git(dir, ['add', '--', ...g.filter(p => fs.existsSync(path.join(dir, p)))]); const r = git(dir, ['commit', '-q', '-m', msgs[i]]); if (r.code !== 0) throw new Error('fixture commit failed: ' + r.out); });
  git(dir, ['update-index', '--chmod=+x', '.githooks/pre-commit', '.githooks/commit-msg']);
  git(dir, ['commit', '-q', '-m', 'chore: make the hooks executable in the index']);
  return dir;
}
function buildVariant(variant) {
  const dir = buildGood({ sloppy: !!variant.sloppy, template: variant.template || 'good', gs: !!variant.gs });
  if (variant.mutate) {
    variant.mutate(dir, h);
    git(dir, ['add', '-A']);
    // (dev loop 2026-10-06) every tracked hook is committed executable, as a Linux author would: the checker now reads the committed mode (defect C8)
    for (const f of git(dir, ['ls-files', '.githooks']).stdout.split('\n').filter(Boolean)) git(dir, ['update-index', '--chmod=+x', f]);
    const r = git(dir, ['commit', '-q', '-m', `chore: control variant ${variant.id}`]);
    if (r.code !== 0 && !/nothing to commit/.test(r.out)) throw new Error('variant commit failed: ' + r.out);
  }
  return dir;
}
function cleanup(dir) { try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort */ } }
export { buildGood, buildVariant, cleanup, h };
