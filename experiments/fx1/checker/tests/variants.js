'use strict';
// Negative controls: each variant removes one element ("removed") or leaves it present but broken ("broken").
// `expect` lists every item that must NOT be PASS, with the exact expected status; every other item must be PASS.
// Collateral entries are declared dependencies (see FX-1-CHECKER-SPEC.md, dependency matrix).
const P = 'PARTIAL', A = 'ABSENT';
const stripLines = (h, d, p, ...subs) => subs.forEach(s => h.dropLines(d, p, s));

module.exports = [
  // ---------- positive controls ----------
  { id: 'G1', kind: 'good', target: null, desc: 'hand-built known-good substrate', expect: {} },
  { id: 'G2', kind: 'good', target: null, desc: 'known-good, Spanish headings (tests the bilingual config)', expect: {},
    mutate(d, h) {
      h.replace(d, 'docs/spec/SPEC.md', '## Requirements', '## Requisitos');
      h.replace(d, 'docs/spec/SPEC.md', '## Acceptance criteria', '## Criterios de aceptación');
      h.replace(d, 'docs/spec/SPEC.md', '## Open questions', '## Preguntas abiertas');
      h.replace(d, 'docs/decisions/0001-use-node-test-runner.md', '## Context', '## Contexto');
      h.replace(d, 'docs/decisions/0001-use-node-test-runner.md', '## Decision', '## Decisión');
      h.replace(d, 'docs/architecture.md', '# Architecture', '# Arquitectura');
      h.replace(d, 'docs/data-model.md', '# Data model', '# Modelo de datos');
      h.replace(d, 'docs/conventions.md', '# Conventions', '# Convenciones');
      for (const f of ['src/ledger.js', 'tests/ledger.test.js']) h.replace(d, f, '#acceptance-criteria', '#criterios-de-aceptaci-n');
      h.relock(d);
    } },
  { id: 'G3', kind: 'good', target: null, desc: 'known-good python project (exercises the python adapter and a hook-install README step)', expect: {}, template: 'good-py' },
  { id: 'PY1', kind: 'broken', target: 'E05', template: 'good-py', desc: 'python: a committed test fails in a clean clone', expect: { E05: P, E12: P, E06: P, E07: P, E10: P, E11: P },
    mutate: (d, h) => h.write(d, 'tests/test_broken.py', 'def test_ac_001_fails():\n    assert False\n') },
  // ---------- elements removed ----------
  { id: 'R01', kind: 'removed', target: 'E01', desc: 'no sentinel', expect: { E01: A, E04: P },
    mutate: (d, h) => h.rm(d, 'CLAUDE.md') },
  { id: 'R02', kind: 'removed', target: 'E02', desc: 'no spec (and what is derived from it: lock, coverage)', expect: { E02: A, E04: P, E07: A, E08: A, E10: A },
    mutate(d, h) { h.rm(d, 'docs/spec'); h.rm(d, 'docs/spec.lock'); h.rm(d, 'docs/coverage.md'); h.stripTags(d); stripLines(h, d, 'CLAUDE.md', 'docs/spec/SPEC.md', 'docs/coverage.md'); } },
  { id: 'R03', kind: 'removed', target: 'E03', desc: 'no decision records', expect: { E03: A },
    mutate(d, h) { h.rm(d, 'docs/decisions'); stripLines(h, d, 'CLAUDE.md', 'docs/decisions/'); } },
  { id: 'R04', kind: 'removed', target: 'E04', desc: 'no cascade documents', expect: { E04: A },
    mutate(d, h) { for (const f of ['architecture', 'data-model', 'conventions']) { h.rm(d, `docs/${f}.md`); stripLines(h, d, 'CLAUDE.md', `docs/${f}.md`); } } },
  { id: 'R05', kind: 'removed', target: 'E05', desc: 'no tests', expect: { E05: A, E08: P },
    mutate(d, h) { h.rm(d, 'tests'); h.write(d, 'docs/ratchet.json', '{\n  "tests_min": 0\n}\n'); h.relock(d); } },
  { id: 'R06', kind: 'removed', target: 'E05', desc: 'no hooks installed or versioned (scripts remain)', expect: { E05: P, E11: P },
    mutate(d, h) { h.rm(d, '.githooks'); h.replace(d, 'package.json', '    "prepare": "node scripts/install-hooks.js",\n', ''); } },
  { id: 'R07', kind: 'removed', target: 'E06', desc: 'no ratchet', expect: { E06: A },
    mutate(d, h) { h.rm(d, 'docs/ratchet.json'); stripLines(h, d, 'CLAUDE.md', 'docs/ratchet.json', 'ratchet floor'); h.replace(d, 'scripts/gate.js', 'open(); ratchet(); lock(); }', 'open(); lock(); }'); h.replace(d, 'scripts/gate.js', "else if (mode === 'ratchet') ratchet();\n", ''); h.replace(d, 'package.json', '    "gate:ratchet": "node scripts/gate.js ratchet"\n', ''); h.replace(d, 'package.json', '"gate:open": "node scripts/gate.js open",', '"gate:open": "node scripts/gate.js open"'); } },
  { id: 'R08', kind: 'removed', target: 'E07', desc: 'no open-questions gate', expect: { E07: A },
    mutate(d, h) { h.replace(d, 'scripts/gate.js', "for (const f of walk('docs/spec').filter(x => x.endsWith('.md'))) if (/^\\s*OPEN:/m.test(read(f))) fail('open question in ' + f);", '/* no open-questions check */'); h.replace(d, 'scripts/gate.js', "else if (mode === 'open') open();\n", ''); h.replace(d, 'package.json', '    "gate:open": "node scripts/gate.js open",\n', ''); stripLines(h, d, 'CLAUDE.md', 'OPEN:'); } },
  { id: 'R09', kind: 'removed', target: 'E08', desc: 'no criteria coverage', expect: { E08: A },
    mutate(d, h) { h.rm(d, 'docs/coverage.md'); stripLines(h, d, 'CLAUDE.md', 'docs/coverage.md'); } },
  { id: 'R10', kind: 'removed', target: 'E09', desc: 'non-conventional, non-descriptive history', expect: { E09: P }, sloppy: true },
  { id: 'R11', kind: 'removed', target: 'E10', desc: 'no spec lock', expect: { E10: A },
    mutate(d, h) { h.rm(d, 'docs/spec.lock'); h.stripTags(d); } },
  { id: 'R12', kind: 'removed', target: 'E11', desc: 'no co-change gate', expect: { E11: A },
    mutate(d, h) { h.edit(d, 'scripts/gate.js', t => t.split('\n').filter(l => !/staged/.test(l)).join('\n')); } },
  { id: 'R13', kind: 'removed', target: 'E12', desc: 'no README', expect: { E12: A },
    mutate(d, h) { h.rm(d, 'README.md'); stripLines(h, d, 'CLAUDE.md', 'README.md'); } },
  // ---------- elements present but broken ----------
  { id: 'B01', kind: 'broken', target: 'E01', desc: 'sentinel references a missing file', expect: { E01: P },
    mutate: (d, h) => h.edit(d, 'CLAUDE.md', t => t + '\n- Style guide: `docs/style-guide.md`\n') },
  { id: 'B02', kind: 'broken', target: 'E02', desc: 'duplicate criterion id', expect: { E02: P },
    mutate(d, h) { h.replace(d, 'docs/spec/SPEC.md', '- [ ] AC-005 The largest debit', '- [ ] AC-004 The largest debit'); h.relock(d); } },
  { id: 'B03', kind: 'broken', target: 'E08', desc: 'a criterion has no coverage entry', expect: { E08: P },
    mutate(d, h) { h.replace(d, 'docs/spec/SPEC.md', '\n## Open questions', '- [ ] AC-006 The balance of a very large list is still exact (REQ-001).\n\n## Open questions'); h.relock(d); } },
  { id: 'B04', kind: 'broken', target: 'E03', desc: 'a decision record is referenced by nothing', expect: { E03: P },
    mutate: (d, h) => h.write(d, 'docs/decisions/0002-orphan-decision.md', '# ADR 0002: orphan\n\n## Status\n\nAccepted.\n\n## Context\n\nNothing refers to this record.\n\n## Decision\n\nKeep it unreferenced.\n') },
  { id: 'B05', kind: 'broken', target: 'E05', desc: 'pre-commit hook exists but never blocks', expect: { E05: P },
    mutate: (d, h) => h.write(d, '.githooks/pre-commit', '#!/bin/sh\nexit 0\n') },
  { id: 'B06', kind: 'broken', target: 'E05', desc: 'hooks are versioned but nothing installs them', expect: { E05: P, E11: P },
    mutate: (d, h) => h.replace(d, 'package.json', '    "prepare": "node scripts/install-hooks.js",\n', '') },
  { id: 'B07', kind: 'broken', target: 'E05', desc: 'install script points the hooks path at a folder that does not exist', expect: { E05: P, E11: P },
    mutate: (d, h) => h.replace(d, 'scripts/install-hooks.js', "'.githooks'], { cwd: root }", "'.githook'], { cwd: root }") },
  { id: 'B08', kind: 'broken', target: 'E06', desc: 'ratchet floor file exists but nothing enforces it', expect: { E06: P },
    mutate: (d, h) => h.replace(d, 'scripts/gate.js', 'function ratchet() {', 'function ratchet() { return;') },
  { id: 'B09', kind: 'broken', target: 'E07', desc: 'open-questions gate looks in the wrong folder', expect: { E07: P },
    mutate: (d, h) => h.edit(d, 'scripts/gate.js', t => t.replace(/function open\(\) \{[\s\S]*?\n\}/, "function open() {\n  if (!fs.existsSync(path.join(root, 'docs/notes'))) return;\n  for (const f of walk('docs/notes')) if (/^\\s*OPEN:/m.test(read(f))) fail('open question in ' + f);\n}")) },
  { id: 'B10', kind: 'broken', target: 'E10', desc: 'lock is stale (a criterion changed, lock not updated); the project cannot commit', expect: { E10: P, E05: P, E06: P, E07: P, E11: P },
    mutate: (d, h) => h.replace(d, 'docs/spec/SPEC.md', 'makes the balance function throw a TypeError', 'makes the balance function raise a TypeError') },
  { id: 'B11', kind: 'broken', target: 'E11', desc: 'co-change gate blocks every source change', expect: { E11: P },
    mutate: (d, h) => h.replace(d, 'scripts/gate.js', "if (staged.some(f => f.startsWith('src/')) && !staged.some(f => f.startsWith('docs/')) && !/\\b[A-Z]{2,5}-\\d{3}\\b/.test(msg) && !/^refactor/.test(msg))", "if (staged.some(f => f.startsWith('src/')))") },
  { id: 'B12', kind: 'broken', target: 'E12', desc: 'README install step fails in a clean clone (npm ci without a lockfile)', expect: { E12: P },
    mutate: (d, h) => h.replace(d, 'README.md', 'npm install\nnpm test', 'npm ci\nnpm test') },
  { id: 'B13', kind: 'broken', target: 'E05', desc: 'gate blocks a clean docs-only change; the project cannot commit', expect: { E05: P, E06: P, E07: P, E10: P, E11: P },
    mutate: (d, h) => h.replace(d, 'scripts/gate.js', "if (mode === 'pre-commit') { syntax(); tests(); open(); ratchet(); lock(); }", "if (mode === 'pre-commit') { if (spawnSync('git', ['diff', '--cached', '--name-only'], { cwd: root, encoding: 'utf8' }).stdout.includes('README.md')) fail('README is frozen'); syntax(); tests(); open(); ratchet(); lock(); }") },
  { id: 'B14', kind: 'broken', target: 'E05', desc: 'a committed test fails in a clean clone', expect: { E05: P, E12: P, E06: P, E07: P, E10: P, E11: P },
    mutate: (d, h) => h.write(d, 'tests/broken.test.js', "const test = require('node:test');\ntest('AC-001 this one fails', () => { throw new Error('broken'); });\n") },
  { id: 'B15', kind: 'broken', target: 'E01', desc: 'sentinel is an import of generic boilerplate (routes nothing)', expect: { E01: P, E04: P },
    mutate(d, h) { h.write(d, 'CLAUDE.md', '@AGENTS.md\n'); h.write(d, 'AGENTS.md', '# Agents\n\nThis is a Node project.\nUse the usual npm commands to test it.\nFollow best practices.\nWrite clean, readable code.\nKeep functions small.\nPrefer clarity over cleverness.\nAsk when requirements are unclear.\n'); } },
  { id: 'B16', kind: 'broken', target: 'E04', desc: 'cascade documents exist but the sentinel does not route to them', expect: { E04: P },
    mutate(d, h) { for (const f of ['architecture', 'data-model', 'conventions']) stripLines(h, d, 'CLAUDE.md', `docs/${f}.md`); } },
  // ---------- gaming controls: structure without substance ----------
  { id: 'X01', kind: 'gaming', target: 'E05', desc: 'hooks only print "all checks passed" and exit 0', expect: { E05: P, E11: P },
    mutate(d, h) { h.write(d, '.githooks/pre-commit', '#!/bin/sh\necho "all checks passed"\nexit 0\n'); h.write(d, '.githooks/commit-msg', '#!/bin/sh\nexit 0\n'); } },
  { id: 'X02', kind: 'gaming', target: 'E08', desc: 'a criterion is "covered" by a comment far from any test', expect: { E08: P },
    mutate(d, h) { h.replace(d, 'docs/spec/SPEC.md', '\n## Open questions', '- [ ] AC-006 The balance of a very large list is still exact (REQ-001).\n\n## Open questions'); h.relock(d); h.write(d, 'tests/notes.test.js', '// AC-006 will be tested later\n'); h.edit(d, 'docs/coverage.md', t => t + '| AC-006 | tests/notes.test.js |\n'); } },
  { id: 'X03', kind: 'gaming', target: 'E01', desc: 'sentinel links to three empty files and nothing else', expect: { E01: P, E04: P },
    mutate(d, h) { for (const f of ['one', 'two', 'three']) h.write(d, `docs/${f}.md`, ''); h.write(d, 'CLAUDE.md', '# Sentinel\n\nStart here.\n\n- `docs/one.md`\n- `docs/two.md`\n- `docs/three.md`\n\nThat is all.\n'); } },
  // ---------- KNOWN LEAKS: the checker is blind to these; each is declared in FX-1-CHECKER-SPEC.md section 7 ----------
  { id: 'L01', kind: 'known-leak', target: 'E04', desc: 'cascade documents are filler of the minimum length that cite the spec (semantic emptiness is not detected; the secondary judges are meant to catch it)', expect: {},
    mutate(d, h) { for (const [f, t] of [['architecture', 'Architecture'], ['data-model', 'Data model'], ['conventions', 'Conventions']]) h.write(d, `docs/${f}.md`, `# ${t}\n\nSee docs/spec/SPEC.md.\n\nFiller line 1.\nFiller line 2.\nFiller line 3.\nFiller line 4.\nFiller line 5.\nFiller line 6.\nFiller line 7.\n`); } },
  { id: 'L02', kind: 'known-leak', target: 'E06', desc: 'the ratchet gate rejects any edit of the floor file instead of comparing a measurement (a frozen file is indistinguishable from a ratchet)', expect: {},
    mutate: (d, h) => h.edit(d, 'scripts/gate.js', t => t.replace(/function ratchet\(\) \{[\s\S]*?\n\}\nconst norm/, "function ratchet() {\n  const head = spawnSync('git', ['show', 'HEAD:docs/ratchet.json'], { cwd: root, encoding: 'utf8' });\n  if (head.status === 0 && head.stdout.trim() !== read('docs/ratchet.json').trim()) fail('ratchet file changed');\n}\nconst norm")) }
];
